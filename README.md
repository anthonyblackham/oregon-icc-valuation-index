# Oregon ICC Valuation Index

A map index to the original Interstate Commerce Commission railroad valuation maps for Oregon (1915–1920).
Each line is one valuation section as drawn on the 1916 ICC index maps, tagged with the railroad prefix used
there (O&C-5, OWR&N-8, …). The side index is grouped by the railroad NARA files the bundle under, with the
bundle and valuation-section numbers needed for a pull request at NARA II (RG 134, Cartographic).

Static site: `index.html`, `style.css`, `app.js`, and `data/`:

- `data/sections.geojson`: 79 valuation sections (`section_tag`, `filed_under`, `nara_bundle`, `nara_vs`, …)
- `data/interurban.geojson`: interurban reference lines (PRL&P, Oregon Electric, United Railways), not ICC-valued
- `data/oregon.geojson`: state outline (Natural Earth, public domain)

`build_data.py` regenerates `data/` from the project's section GeoJSON and NARA join
(`ICC_PROJECT=/path/to/project python3 build_data.py`; needs shapely).

Geometry is index-level: approximate stations snapped to known track. Track guides: © OpenStreetMap
contributors (ODbL), ODOT TransGIS rail network, and Forgotten Lands, Places and Transit
"Abandoned & Out-of-Service Railroad Lines" (non-commercial use with attribution).

Live at https://anthonyblackham.com/oregon-icc-valuation-index/
