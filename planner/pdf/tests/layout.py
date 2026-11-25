import sys
from pypdf import PdfReader
from reportlab.pdfbase.pdfmetrics import stringWidth
r=PdfReader(sys.argv[1]); issues=[]
for pi,pg in enumerate(r.pages,1):
    W,H=float(pg.mediabox.width),float(pg.mediabox.height); rects=[]
    for a in pg.get("/Annots",[]) or []:
        o=a.get_object(); n=o.get("/T")
        if n is None: continue
        x1,y1,x2,y2=[float(v) for v in o["/Rect"]]
        if x1<20 or x2>W-20 or y1<36 or y2>H-20: issues.append((pi,n,"too close to page edge"))
        v=str(o.get("/V","")); da=str(o.get("/DA",""))
        try: size=float(da.split(" Tf")[0].split()[-1])
        except: size=10
        if v and not v.startswith("/") and stringWidth(v,"Times-Roman",size)>(x2-x1)-4: issues.append((pi,n,f"text '{v}' too wide"))
        rects.append((n,x1,y1,x2,y2))
    for i in range(len(rects)):
        for j in range(i+1,len(rects)):
            a,b=rects[i],rects[j]
            if a[1]<b[3]-0.5 and b[1]<a[3]-0.5 and a[2]<b[4]-0.5 and b[2]<a[4]-0.5: issues.append((pi,f"{a[0]} / {b[0]}","boxes overlap"))
print(sys.argv[1].split("/")[-1], "->", len(issues), "layout issues"); [print("  ",x) for x in issues[:15]]
