# Pint Checker: setup guide

You will set up four free things. Allow about 45 minutes, plus a few days if you want Apple sign-in.

| Piece | What it does | Cost |
|---|---|---|
| GitHub Pages | Hosts the website | Free |
| Supabase | Sign-in, ratings and sign-ups database | Free tier |
| Google Cloud + Apple developer | Lets people press "Continue with Google / Apple" | Google free, Apple about £79/$99 a year |
| Google Sheet + Apps Script | Collects everything into a sheet you can read | Free |

Apple sign-in is the only part that costs money. Skip it at first: people can use Google or email, and you can add Apple later.

---

## 1. Put the site on GitHub Pages

1. In your repository on github.com, go to **Settings > Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**, branch **main**, folder **/ (root)**. Save.
3. After a minute your site is live at `https://jmegee84-stack.github.io/K-D_Pint-Checker/`. Write this address down. You need it below.

## 2. Create the database (Supabase)

1. Sign up at supabase.com and click **New project**. Pick a region close to the UK (London). Save the database password somewhere.
2. When it has finished starting, open **SQL Editor**, click **New query**, paste in the whole of `supabase/schema.sql`, and press **Run**.
3. Go to **Project Settings > API**. Copy the **Project URL** and the **anon public** key.
4. Open `config.js` in your repository, replace `YOUR_SUPABASE_URL` and `YOUR_SUPABASE_ANON_KEY` with those two values, and commit. The anon key is meant to be public. The database rules (set by the SQL file) stop anyone reading other people's data.
5. Go to **Authentication > URL Configuration**. Set **Site URL** to your Pages address from step 1, and add the same address under **Redirect URLs**.

At this point email sign-in already works. Test it on your phone.

## 3. Turn on Google sign-in

1. Go to console.cloud.google.com, create a project, then **APIs & Services > OAuth consent screen**. Choose **External**, fill in the app name (Pint Checker) and your email, and publish it.
2. Go to **Credentials > Create credentials > OAuth client ID**. Application type **Web application**.
3. Under **Authorised redirect URIs** add the callback address shown in Supabase at **Authentication > Providers > Google**. It looks like `https://abcd.supabase.co/auth/v1/callback`.
4. Copy the **Client ID** and **Client secret** into that same Supabase Google screen, switch Google **on**, and save.

## 4. Turn on Apple sign-in (optional, paid)

You need an Apple Developer account (developer.apple.com/programs). Then follow Supabase's guide at **Authentication > Providers > Apple**, which walks through creating a Services ID and key. Apple's setup is fiddly, so allow extra time. When it works, open `config.js` and change `apple: false` to `apple: true`.

Until then, leave Apple off so nobody sees a button that fails.

## 5. Send everything to a Google Sheet

1. Create a new Google Sheet (name it "Pint Checker data").
2. In the sheet, choose **Extensions > Apps Script**. Delete anything in the editor and paste in the whole of `apps-script/Code.gs`. Save.
3. Click the cog (**Project Settings**), scroll to **Script properties**, and add:
   - `SUPABASE_URL` = your Project URL
   - `SUPABASE_SERVICE_KEY` = the **service_role** key from Supabase **Project Settings > API**. Keep this secret. It gives full access to your data. Never put it in `config.js` or anywhere on GitHub.
   - `BEERS_URL` = `https://jmegee84-stack.github.io/K-D_Pint-Checker/beers.json` (this lets the sheet show beer names)
4. Back in the editor, pick `installTrigger` from the function drop-down and press **Run**. Approve the permissions when Google asks.

The sheet now has three tabs, refreshed every five minutes:
- **Sign-ups**: name, email and whether they agreed to marketing.
- **Ratings**: every rating, by person and beer.
- **Beer summary**: average Proper Pint Score, price and taste, and the third/half/full votes per beer.

Only email people with **Yes** in the Marketing OK column.

## Changing the beer list next year

1. Save your new list as CSV in the same columns as `data/beer-list-2025.csv`. Put prices in pounds in the three price columns (for example 5.50). Leave a size blank if the bar does not sell it.
2. Run `python3 tools/csv_to_beers.py data/your-list.csv 2026 > beers.json` and commit `beers.json`. (Or ask Claude to do it for you.)
3. Beer IDs include the year, so the new festival starts with clean ratings.

## Adding beer pictures and brewery logos

Upload files into the repository folders:
- `images/beers/` named by section and pump number, for example `cask-7.jpg`.
- `images/logos/` named by brewery, for example `siren.png`. Names are lower-case with dashes, for example `titanic-x-castle-rock.png`.

`data/image-checklist.csv` lists every brewery and beer. Use pictures you have permission for: the brewery's press kit, or your own photos.

## Good to know

- Anyone can see the beer averages. Only each person can see their own ratings and details through the app. You can see everything in Supabase and in the sheet.
- In your privacy notice, tell people their email is kept for marketing if they tick the box.
- To delete a person on request, delete their row under **Supabase > Authentication > Users**. Their ratings and profile go with it.
