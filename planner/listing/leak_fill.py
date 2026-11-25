import sys
from pypdf import PdfReader, PdfWriter
from pypdf.generic import NameObject, BooleanObject
rows=[("Video streaming",17.99,"Monthly",1,0),("Music",10.99,"Monthly",1,0),("Gym or fitness app",65,"Monthly",0,1),("Cloud storage",2.99,"Monthly",1,0),
      ("News or magazines",180,"Yearly",0,1),("Shopping membership",139,"Yearly",0,1),("Language app",12.99,"Monthly",0,1)]
f=lambda v: f"${v:,.2f}"
V={}; tm=ty=ts=0
for i,(n,c,b,u,k) in enumerate(rows,1):
    mo=c/12 if b=="Yearly" else c; yr=c if b=="Yearly" else c*12; tm+=mo; ty+=yr
    V.update({f"lc_{i}_0":n, f"lc_{i}_1":f(c), f"lc_{i}_2":b, f"lc_{i}_3":f(mo), f"lc_{i}_4":f(yr)})
    if u: V[f"lc_{i}_5"]="/Yes"
    if k: V[f"lc_{i}_6"]="/Yes"; V[f"lc_{i}_7"]=f(yr); ts+=yr
V.update(lc_tot_3=f(tm), lc_tot_4=f(ty), lc_tot_7=f(ts), lc_year=f(ty), lc_save=f(ts), lc_month=f(ts/12))
w=PdfWriter(clone_from=PdfReader(sys.argv[1])); w.update_page_form_field_values(w.pages[0], V, auto_regenerate=True)
w._root_object["/AcroForm"][NameObject("/NeedAppearances")]=BooleanObject(False); w.write(sys.argv[2]); print("leak saves", round(ts,2))
