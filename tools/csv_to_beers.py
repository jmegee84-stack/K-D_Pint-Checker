#!/usr/bin/env python3
"""Turn a festival CSV into beers.json.

Usage:  python3 tools/csv_to_beers.py data/beer-list-2025.csv 2025 > beers.json

Columns (extra columns are ignored): Category, Number, Beer, Brewery, Style, ABV,
Brewed in, Brewery info, Tasting notes, Food pairing, Full pint price,
Half pint price, Third pint price, Details. Prices are in pounds, for example 5.50.
Excel users: File > Save As > CSV first.
"""
import csv, json, sys

if len(sys.argv) < 3:
    sys.exit(__doc__)
path, edition = sys.argv[1], sys.argv[2]
MAP = {"category": "cat", "number": "num", "beer": "name", "brewery": "brewery", "style": "type", "abv": "abv",
       "brewedin": "place", "breweryinfo": "about", "tastingnotes": "taste", "foodpairing": "pairing",
       "price": "price", "fullpintprice": "price", "fullpint": "price", "pintprice": "price",
       "halfpintprice": "price_half", "halfprice": "price_half", "half": "price_half",
       "thirdpintprice": "price_third", "thirdprice": "price_third", "third": "price_third",
       "details": "notes"}
beers = []
with open(path, newline="", encoding="utf-8-sig") as f:
    for row in csv.DictReader(f):
        o = {}
        for k, v in row.items():
            key = MAP.get("".join(c for c in (k or "").lower() if c.isalpha()))
            if key and v and v.strip():
                o[key] = v.strip()
        if not o.get("name"):
            continue
        o["num"] = int(o.get("num", 0) or 0)
        for n in ("abv", "price", "price_half", "price_third"):
            if n in o:
                try:
                    o[n] = float(o[n].replace("%", "").replace("£", ""))
                except ValueError:
                    del o[n]
        beers.append(o)
json.dump({"edition": edition, "beers": beers}, sys.stdout, indent=1, ensure_ascii=False)
print()
