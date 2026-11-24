import sys
from pypdf import PdfReader, PdfWriter
src, out = sys.argv[1], sys.argv[2]
def m(v, d=0): return ("-" if v<0 else "")+f"${abs(v):,.{d}f}"
V = {"owner": "Maya Chen", "word": "Freedom", "cur": "$"}
# goal
t, s = 100000, 22000
V.update(goal_name="Save 100K", goal_target=m(t), goal_start=m(s), goal_why="Freedom to take a career break in 2028",
         goal_left=m(t-s), goal_pm=m((t-s)/12), goal_pw=m((t-s)/52), goal_pd=m((t-s)/365, 2))
for p, rw in zip([25,50,75,100], ["Picnic and a film at home", "New running shoes", "Weekend away", "Celebration dinner"]):
    V[f"ms_amt_{p}"] = m(s+(t-s)*p/100); V[f"ms_rew_{p}"] = rw
V["ms_done_25"] = "/Yes"
og = [("Emergency fund top-up", 6000, 6, 1500), ("New laptop", 1800, 4, 300), ("Family trip", 4500, 9, 900)]
for i,(g,tg,mo,sv) in enumerate(og,1):
    V.update({f"og_{i}_0":g, f"og_{i}_1":m(tg), f"og_{i}_2":str(mo), f"og_{i}_3":m(sv), f"og_{i}_4":m((tg-sv)/mo)})
# subscriptions
subs = [("Video streaming",17.99,1,0),("Second streaming service",15.49,0,1),("Music app",10.99,1,0),("Gym membership",65,0,1),
        ("News site",15,0,1),("Meditation app",5.99,0,1),("Cloud storage",2.99,1,0),("Meal-kit box",79,1,0),("Shopping membership",11.58,1,0),
        ("Language app",12.99,0,1)]
tm=ty=tc=0
for i,(n,c,used,canc) in enumerate(subs,1):
    V.update({f"sub_{i}_0":n, f"sub_{i}_1":m(c,2), f"sub_{i}_2":m(c*12,2)})
    if used: V[f"sub_{i}_3"]="/Yes"
    if canc: V[f"sub_{i}_4"]="/Yes"; V[f"sub_{i}_5"]=m(c*12,2); V[f"sub_{i}_6"]="/Yes" if i in (2,4) else "/Off"; tc+=c*12
    tm+=c; ty+=c*12
V.update(sub_tot_1=m(tm,2), sub_tot_2=m(ty,2), sub_tot_5=m(tc,2))
# IOUs
ious=[("Sam","Concert tickets",1200,"25 Jan",1,0),("Priya","Villa share",850,"19 Feb",1,1),("Alex","Car repair loan",400,"14 Mar",0,0),("Jordan","Gift split",300,"10 Jan",1,1)]
op=0
for i,(w,f,a,d,r,pd) in enumerate(ious,1):
    V.update({f"iou_{i}_0":w,f"iou_{i}_1":f,f"iou_{i}_2":m(a),f"iou_{i}_3":d})
    if r: V[f"iou_{i}_4"]="/Yes"
    if pd: V[f"iou_{i}_5"]="/Yes"
    else: V[f"iou_{i}_6"]=m(a); op+=a
V.update(iou_tot_2=m(sum(x[2] for x in ious)), iou_tot_6=m(op))
# January
inc=[(12000,12000),(0,850),(600,920),(40,46),(0,0),(0,0)]
for i,(pl,ac) in enumerate(inc,1):
    if pl: V[f"m0in_{i}_1"]=m(pl)
    if ac: V[f"m0in_{i}_2"]=m(ac)
ti=sum(a for _,a in inc); V.update(m0in_tot_1=m(sum(p for p,_ in inc)), m0in_tot_2=m(ti))
ex=[3200,320,900,450,300,400,120,250,100,180,500,600,150,250,300,100,50,150]
ac=[3200,298,964,410,300,400,60,250,45,95,380,455,140,190,120,85,50,120]
for i,(p,a) in enumerate(zip(ex,ac),1):
    V.update({f"m0ex_{i}_1":m(p), f"m0ex_{i}_2":m(a), f"m0ex_{i}_3":m(p-a)})
te=sum(ac); V.update(m0ex_tot_1=m(sum(ex)), m0ex_tot_2=m(te), m0ex_tot_3=m(sum(ex)-te))
V.update(tax_rate="20", m0in_3_3="/Yes", m0in_5_3="/Yes", m0_tax=m(920*0.2))
V.update(m0_inc=m(ti), m0_spent=m(te), m0_left=m(ti-te-920*0.2), m0_saved=m(6500), m0_win="Cancelled 4 subscriptions in one evening",
         m0_next="Cook at home 4 nights a week")
nsd=[3,5,6,10,12,13,17,19,24,26,27,31]
for d in nsd: V[f"m0_ns_{d}"]="/Yes"
V["m0_nscount"]=str(len(nsd))
for k in range(3): V[f"m0_cl_{k}"]="/Yes"
# tracker + earnings (Jan, Feb)
saved=[6500,6800]; earned=[13816,12950]; run=s
for k in range(2):
    run+=saved[k]
    V.update({f"tr_t_{k}":m(6500*(k+1)), f"tr_s_{k}":m(saved[k]), f"tr_r_{k}":m(run), f"tr_p_{k}":f"{run/t*100:.0f}", f"tr_ok_{k}":m(run-s-6500*(k+1))})
V.update(tr_goal=m(t), tr_pm=m(6500))
for i in range(5): V[f"tr_box_{i}"]="/Yes"
V.update(er_goal=m(160000), er_sofar=m(sum(earned)))
r2=0
for k in range(2):
    r2+=earned[k]; V.update({f"er_pl_{k}":m(12640), f"er_ac_{k}":m(earned[k]), f"er_run_{k}":m(r2), f"er_sv_{k}":m(saved[k]), f"er_rate_{k}":f"{saved[k]/earned[k]*100:.0f}"})

big=[("Holidays and travel","Dec",3600,900),("Insurance premiums","Mar",1800,450),("Medical check-ups and dental","Jun",600,150),("Festivals and celebrations","Oct",1200,300),("Car servicing and registration","Aug",900,225)]
for i,(n,d,a,sv) in enumerate(big,1):
    V.update({f"by_{i}_1":d, f"by_{i}_2":m(a), f"by_{i}_3":m(a/12), f"by_{i}_4":m(sv)})
ta=sum(x[2] for x in big); tsv=sum(x[3] for x in big)
V.update(by_tot_2=m(ta), by_tot_3=m(ta/12), by_tot_4=m(tsv), by_pm=m(ta/12), by_left=m(ta-tsv))
rd=PdfReader(src); w=PdfWriter(clone_from=rd)
for pg in w.pages:
    names={a.get_object().get("/T") for a in pg.get("/Annots",[])}
    sub={k:v for k,v in V.items() if k in names}
    if sub: w.update_page_form_field_values(pg, sub, auto_regenerate=True)
from pypdf.generic import NameObject, BooleanObject
w._root_object["/AcroForm"][NameObject("/NeedAppearances")]=BooleanObject(False)
w.write(out); print("filled", len(V))
