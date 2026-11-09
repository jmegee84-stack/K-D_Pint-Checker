/**
 * Pint Checker -> Google Sheet sync.
 * Reads sign-ups and ratings from Supabase and rewrites three tabs:
 *   Sign-ups, Ratings, Beer summary.
 * Setup is in SETUP.md (step 5). Script properties needed:
 *   SUPABASE_URL          e.g. https://abcdxyz.supabase.co
 *   SUPABASE_SERVICE_KEY  the service_role key (keep it secret, never put it in the website)
 *   BEERS_URL             optional, e.g. https://YOURNAME.github.io/pint-checker/beers.json
 */
function prop_(k) { return PropertiesService.getScriptProperties().getProperty(k); }

function fetchAll_(table, select) {
  var url = prop_('SUPABASE_URL') + '/rest/v1/' + table + '?select=' + select;
  var key = prop_('SUPABASE_SERVICE_KEY'), rows = [], from = 0, step = 1000;
  while (true) {
    var res = UrlFetchApp.fetch(url, {
      headers: { apikey: key, Authorization: 'Bearer ' + key, Range: from + '-' + (from + step - 1), 'Range-Unit': 'items' },
      muteHttpExceptions: true
    });
    if (res.getResponseCode() >= 300) throw new Error(table + ': ' + res.getResponseCode() + ' ' + res.getContentText());
    var page = JSON.parse(res.getContentText());
    rows = rows.concat(page);
    if (page.length < step) break;
    from += step;
  }
  return rows;
}

function slug_(x) { return String(x).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

function beerLookup_() {
  var map = {}, u = prop_('BEERS_URL');
  if (!u) return map;
  try {
    var d = JSON.parse(UrlFetchApp.fetch(u, { muteHttpExceptions: true }).getContentText());
    var seen = {};
    (d.beers || []).forEach(function (b, i) {
      var cat = String(b.cat || 'Beer').trim(); cat = cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
      var num = parseInt(b.num, 10) || 0;
      var id = slug_(d.edition || '') + '-' + slug_(cat) + '-' + (num || slug_(b.name));
      if (seen[id]) id = id + '-' + i;
      seen[id] = 1;
      map[id] = { name: b.name, brewery: b.brewery || '', cat: cat + (num ? ' ' + num : '') };
    });
  } catch (e) {}
  return map;
}

function write_(name, header, rows) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  sh.clearContents();
  sh.getRange(1, 1, 1, header.length).setValues([header]).setFontWeight('bold');
  if (rows.length) sh.getRange(2, 1, rows.length, header.length).setValues(rows);
  sh.setFrozenRows(1);
  sh.autoResizeColumns(1, header.length);
}

function syncAll() {
  var profiles = fetchAll_('profiles', 'id,name,email,marketing_consent,created_at');
  var ratings = fetchAll_('ratings', 'user_id,beer_id,price,taste,score,size,updated_at');
  var beers = beerLookup_(), who = {};
  profiles.forEach(function (p) { who[p.id] = p; });

  write_('Sign-ups', ['Joined', 'Name', 'Email', 'Marketing OK?'],
    profiles.sort(function (a, b) { return a.created_at < b.created_at ? 1 : -1; })
      .map(function (p) { return [new Date(p.created_at), p.name, p.email, p.marketing_consent ? 'Yes' : 'No']; }));

  write_('Ratings', ['Updated', 'Name', 'Email', 'Beer', 'Brewery', 'Pump', 'Beer ID', 'Price (1-5)', 'Taste (1-5)', 'Proper Pint Score (0-10)', 'Best size'],
    ratings.sort(function (a, b) { return a.updated_at < b.updated_at ? 1 : -1; }).map(function (r) {
      var p = who[r.user_id] || {}, b = beers[r.beer_id] || {};
      return [new Date(r.updated_at), p.name || '', p.email || '', b.name || r.beer_id, b.brewery || '', b.cat || '', r.beer_id,
              r.price, r.taste, r.score, r.size || ''];
    }));

  var agg = {};
  ratings.forEach(function (r) {
    var a = agg[r.beer_id] = agg[r.beer_id] || { n: 0, s: 0, ps: 0, pn: 0, ts: 0, tn: 0, third: 0, half: 0, full: 0 };
    if (r.score !== null) { a.n++; a.s += r.score; }
    if (r.price !== null) { a.pn++; a.ps += r.price; }
    if (r.taste !== null) { a.tn++; a.ts += r.taste; }
    if (r.size) a[r.size]++;
  });
  var rows = Object.keys(agg).map(function (id) {
    var a = agg[id], b = beers[id] || {};
    return [b.name || id, b.brewery || '', b.cat || '', a.n, a.n ? +(a.s / a.n).toFixed(2) : '', a.pn ? +(a.ps / a.pn).toFixed(2) : '',
            a.tn ? +(a.ts / a.tn).toFixed(2) : '', a.third, a.half, a.full];
  }).sort(function (x, y) { return (y[4] || 0) - (x[4] || 0); });
  write_('Beer summary', ['Beer', 'Brewery', 'Pump', 'Ratings', 'Avg Proper Pint Score', 'Avg price', 'Avg taste', 'Thirds', 'Halves', 'Full pints'], rows);
}

/** Run once: makes the sheet refresh itself every 5 minutes. */
function installTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'syncAll') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('syncAll').timeBased().everyMinutes(5).create();
  syncAll();
}
