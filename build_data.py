# Builds site/data/*.geojson from the project's section GeoJSON + NARA join.
# Run: python3 build_data.py   (needs shapely)
import csv, json, os
from shapely.geometry import shape, mapping
H = os.path.dirname(os.path.abspath(__file__)); P = os.environ.get("ICC_PROJECT", os.path.dirname(H))  # folder holding geojson/, nara_join/, interurban/
PFX = {"Oregon & California Railroad Company":"O&C","Southern Pacific Company":"SP","Central Pacific Railway Company":"CP","Oregon-Washington Railroad & Navigation Company":"OWR&N","Des Chutes Railroad Company":"DRy","Oregon Trunk Railway":"OT","Spokane, Portland & Seattle Railway Company":"SP&S","Northern Pacific Railway Company":"NP","Northern Pacific Terminal Company of Oregon":"NPT","Portland Traction Co.":"PT","Central Railroad of Oregon":"CRRO","Sumpter Valley Railway":"SV","Mount Hood Railroad":"MH","Great Southern Railroad":"GS","Beaverton & Willsburg Railway":"B&W","Portland & South Western Railway":"P&SW","Willamette Valley & Coast Railway":"WV&C","Carlton & Coast Railway":"C&C","Independence & Monmouth Railroad":"I&M","Oregon Pacific & Eastern Railway":"OP&E","Pacific & Eastern Railway":"P&E","California & Oregon Coast Railroad":"C&OC","Smith-Powers Logging Co.":"S-P"}
KEEP = ['valuation','line','operator','operator_as_printed','nara_bundle','nara_vs','from_terminus','to_terminus','successor','extent_confidence','uncertainty_notes','manual_addition','source_map','ref_1964_sp_index','geometry_unmatched']
def tag(p):
    x = PFX.get(p['operator'], '')
    if not p['valuation']: return x
    return f"{x} {p['valuation']}" if p['valuation'].startswith('V') else f"{x}-{p['valuation']}"
join = {(r['operator'], r['valuation']): r for r in csv.DictReader(open(os.path.join(P, 'nara_join/oregon_sections_with_nara_bundles.csv')))}
src = json.load(open(os.path.join(P, 'geojson/oregon_valuation_sections.geojson')))
out = []
for i, f in enumerate(src['features']):
    s = f['properties']; p = {k: s[k] for k in KEEP}; p['id'] = i
    r = join.get((s['operator'], s['valuation']))
    if r and r['nara_bundle'] == s['nara_bundle']:
        p.update(nara_rrname=r['nara_rrname'], nara_otherrr=r['nara_otherrr'], nara_state=r['nara_state'])
    p['section_tag'] = tag(s)
    p['filed_under'] = ('Portland Traction (manual addition)' if s['operator'] == 'Portland Traction Co.' else
                        'No bundle found' if not s['nara_bundle'] else p.get('nara_rrname') or 'Southern Pacific Company')
    g = f['geometry']
    if g:
        m = mapping(shape(g).simplify(0.0001))
        rnd = lambda c: [[round(x, 5), round(y, 5)] for x, y in c]
        g = {'type': m['type'], 'coordinates': rnd(m['coordinates']) if m['type'] == 'LineString' else [rnd(c) for c in m['coordinates']]}
    out.append({'type': 'Feature', 'properties': p, 'geometry': g})
json.dump({'type': 'FeatureCollection', 'features': out}, open(os.path.join(H, 'data/sections.geojson'), 'w'), ensure_ascii=False, separators=(',', ':'))
iu = json.load(open(os.path.join(P, 'interurban/prlp_interurban_lines_draft.geojson')))
json.dump(iu, open(os.path.join(H, 'data/interurban.geojson'), 'w'), separators=(',', ':'))
print(len(out), 'sections;', len(iu['features']), 'interurban lines')
