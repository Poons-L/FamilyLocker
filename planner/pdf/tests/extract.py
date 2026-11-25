import sys, json
from pypdf import PdfReader
r = PdfReader(sys.argv[1])
fields = {}
for pi, pg in enumerate(r.pages):
    for a in pg.get("/Annots", []) or []:
        o = a.get_object(); n = o.get("/T")
        if n is None: continue
        aa = o.get("/AA", {})
        fields[n] = dict(page=pi + 1, ft=o.get("/FT"), v=str(o.get("/V", "")),
                         calc=aa["/C"]["/JS"] if "/C" in aa else None,
                         fmt=aa["/F"]["/JS"] if "/F" in aa else None,
                         val=aa["/V"]["/JS"] if "/V" in aa else None,
                         ff=int(o.get("/Ff", 0)))
co = [x.get_object()["/T"] for x in r.trailer["/Root"]["/AcroForm"]["/CO"]]
json.dump(dict(fields=fields, co=co), open(sys.argv[2], "w"))
print(len(fields), "fields,", len(co), "calculated")
