import json, random, subprocess, sys, math
random.seed(7)
spec=json.load(open("planner.json")); F=spec["fields"]
I={}
def put(n,v):
    assert n in F, n; I[n]=v
# ---- inputs across every page ----
put("cur","S$"); put("tax_rate","20")
put("goal_target","100000"); put("goal_start","22000"); put("goal_pay","15000")
for r in range(1,6): put(f"og_{r}_1",str(random.randint(1000,9000))); put(f"og_{r}_2",str(random.randint(0,12))); put(f"og_{r}_3",str(random.randint(0,900)))
for r in range(1,10): put(f"as_{r}_1",str(random.randint(0,90000))); put(f"as_{r}_2",str(random.randint(0,90000)))
for r in range(1,7): put(f"li_{r}_1",str(random.randint(0,40000))); put(f"li_{r}_2",str(random.randint(0,40000)))
for r in range(1,17):
    put(f"sub_{r}_1",f"{random.uniform(1,90):.2f}")
    if random.random()<.5: put(f"sub_{r}_3","Yes")
    if random.random()<.4: put(f"sub_{r}_4","Yes")
for r in range(1,13): put(f"lk_{r}_1",str(random.randint(0,900))); put(f"lk_{r}_2",str(random.randint(0,1000)))
for r in range(1,15): put(f"by_{r}_2",str(random.randint(0,5000))); put(f"by_{r}_4",str(random.randint(0,3000)))
put("best_rate","4.25"); put("ef_month","5200")
for r in range(1,8): put(f"ac_{r}_1",str(random.randint(0,60000))); put(f"ac_{r}_2",f"{random.uniform(0,7):.2f}")
for r in range(1,13):
    put(f"iou_{r}_2",str(random.randint(0,2000)))
    if random.random()<.4: put(f"iou_{r}_5","Yes")
for m in range(12):
    p=f"m{m}"
    for r in range(1,7):
        put(f"{p}in_{r}_1",str(random.randint(0,9000))); put(f"{p}in_{r}_2",str(random.randint(0,9000)))
        put(f"{p}in_{r}_3","Yes" if random.random()<.4 else "Off")
    for r in range(1,19): put(f"{p}ex_{r}_1",str(random.randint(0,3000))); put(f"{p}ex_{r}_2",str(random.randint(0,3000)))
    put(f"{p}_saved",str(random.randint(0,7000)))
    for d in range(1,29):
        if random.random()<.3: put(f"{p}_ns_{d}","Yes")
json.dump(I,open("inputs.json","w"))
passes=sys.argv[1] if len(sys.argv)>1 else "1"
subprocess.run(["node","run.js","planner.json","inputs.json","out.json",passes],check=True)
out=json.load(open("out.json")); V=out["values"]; D=out["display"]
def n(name):
    v=V.get(name,"")
    return 0.0 if v=="" else float(str(v).replace(",",""))
def x(name): return float(I.get(name,"0") or 0)
def chk(name): return 1 if I.get(name, "Yes" if F[name]["v"]=="/Yes" else "Off")=="Yes" else 0
E={}
t,s=x("goal_target"),x("goal_start")
E.update(goal_left=t-s,goal_pm=(t-s)/12,goal_pw=(t-s)/52,goal_pd=(t-s)/365)
pay=x("goal_pay"); E["goal_share"]=E["goal_pm"]/pay*100 if pay>0 else 0
for p in (25,50,75,100): E[f"ms_amt_{p}"]=s+(t-s)*p/100
for r in range(1,6): E[f"og_{r}_4"]=(x(f"og_{r}_1")-x(f"og_{r}_3"))/max(1,x(f"og_{r}_2"))
for c in (1,2):
    E[f"as_tot_{c}"]=sum(x(f"as_{r}_{c}") for r in range(1,10)); E[f"li_tot_{c}"]=sum(x(f"li_{r}_{c}") for r in range(1,7))
E["nw_jan"]=E["as_tot_1"]-E["li_tot_1"]; E["nw_dec"]=E["as_tot_2"]-E["li_tot_2"]; E["nw_chg"]=E["nw_dec"]-E["nw_jan"]
for r in range(1,17): E[f"sub_{r}_2"]=x(f"sub_{r}_1")*12; E[f"sub_{r}_5"]=x(f"sub_{r}_1")*12*chk(f"sub_{r}_4")
for c in (1,2,5): E[f"sub_tot_{c}"]=sum(E.get(f"sub_{r}_{c}",x(f"sub_{r}_{c}")) for r in range(1,17))
for r in range(1,13): E[f"lk_{r}_3"]=max(0,x(f"lk_{r}_1")-x(f"lk_{r}_2")); E[f"lk_{r}_4"]=E[f"lk_{r}_3"]*12
for c in (1,2,3,4): E[f"lk_tot_{c}"]=sum(E.get(f"lk_{r}_{c}",x(f"lk_{r}_{c}")) for r in range(1,13))
for r in range(1,15): E[f"by_{r}_3"]=x(f"by_{r}_2")/12
for c in (2,3,4): E[f"by_tot_{c}"]=sum(E.get(f"by_{r}_{c}",x(f"by_{r}_{c}")) for r in range(1,15))
E["by_pm"]=E["by_tot_3"]; E["by_left"]=max(0,E["by_tot_2"]-E["by_tot_4"])
b=x("best_rate")
for r in range(1,8):
    B,R=x(f"ac_{r}_1"),x(f"ac_{r}_2"); E[f"ac_{r}_3"]=B*R/100; E[f"ac_{r}_4"]=B*max(R,b)/100; E[f"ac_{r}_5"]=B*max(0,b-R)/100
for c in (1,3,4,5): E[f"ac_tot_{c}"]=sum(E.get(f"ac_{r}_{c}",x(f"ac_{r}_{c}")) for r in range(1,8))
E["ef_target"]=x("ef_month")*6
for r in range(1,13): E[f"iou_{r}_6"]=0 if chk(f"iou_{r}_5") else x(f"iou_{r}_2")
E["iou_tot_2"]=sum(x(f"iou_{r}_2") for r in range(1,13)); E["iou_tot_6"]=sum(E[f"iou_{r}_6"] for r in range(1,13))
tax=x("tax_rate")
for m in range(12):
    p=f"m{m}"
    for c in (1,2): E[f"{p}in_tot_{c}"]=sum(x(f"{p}in_{r}_{c}") for r in range(1,7))
    for r in range(1,19): E[f"{p}ex_{r}_3"]=x(f"{p}ex_{r}_1")-x(f"{p}ex_{r}_2")
    for c in (1,2,3): E[f"{p}ex_tot_{c}"]=sum(E.get(f"{p}ex_{r}_{c}",x(f"{p}ex_{r}_{c}")) for r in range(1,19))
    E[f"{p}_nscount"]=sum(chk(f"{p}_ns_{d}") for d in range(1,32) if f"{p}_ns_{d}" in F)
    E[f"{p}_inc"]=E[f"{p}in_tot_2"]; E[f"{p}_spent"]=E[f"{p}ex_tot_2"]
    E[f"{p}_tax"]=sum(x(f"{p}in_{r}_2")*chk(f"{p}in_{r}_3") for r in range(1,7))*tax/100
    E[f"{p}_left"]=E[f"{p}_inc"]-E[f"{p}_spent"]-E[f"{p}_tax"]
E["tr_goal"]=t; E["tr_pm"]=E["goal_pm"]
run=s; erun=0
for m in range(12):
    sv=x(f"m{m}_saved"); run+=sv; erun+=E[f"m{m}in_tot_2"]
    E[f"tr_t_{m}"]=E["goal_pm"]*(m+1); E[f"tr_s_{m}"]=sv; E[f"tr_r_{m}"]=run; E[f"tr_p_{m}"]=run/t*100; E[f"tr_ok_{m}"]=(run-s)-E[f"tr_t_{m}"]
    E[f"er_pl_{m}"]=E[f"m{m}in_tot_1"]; E[f"er_ac_{m}"]=E[f"m{m}in_tot_2"]; E[f"er_run_{m}"]=erun; E[f"er_sv_{m}"]=sv
    E[f"er_rate_{m}"]=sv/E[f"m{m}in_tot_2"]*100 if E[f"m{m}in_tot_2"]>0 else 0
    for j,src in enumerate(["inc","spent","left","saved","nscount"]): E[f"yr_{m}_{j}"]=E[f"m{m}_{src}"] if src!="saved" else sv
E["er_sofar"]=erun; E["er_tot_pl"]=sum(E[f"er_pl_{m}"] for m in range(12)); E["er_tot_ac"]=erun; E["er_tot_sv"]=sum(E[f"er_sv_{m}"] for m in range(12))
E["er_tot_rate"]=E["er_tot_sv"]/E["er_tot_ac"]*100 if E["er_tot_ac"] else 0
for j in range(5): E[f"yr_tot_{j}"]=sum(E[f"yr_{m}_{j}"] for m in range(12))
E["yr_goalpct"]=E["tr_r_11"]/t*100; E["yr_nw"]=E["nw_chg"]
calc=[k for k,v in F.items() if v["calc"]]
uncovered=[k for k in calc if k not in E]
TEXT={"goal_flag"}
sh=E["goal_share"]
E_text={"goal_flag":"Add your take-home pay to check this goal." if pay<=0 else ("More than you earn each month. Stretch the timeline or grow income first." if sh>100 else ("Over half your pay. Very ambitious: plan big cuts or extra income." if sh>50 else ("A stretch, but doable on a tight budget." if sh>20 else "Comfortable. You could aim higher.")))}
E.update({k:0 for k in TEXT})
bad=[(k,round(E[k],4),V.get(k)) for k in calc if k in E and k not in TEXT and abs(n(k)-E[k])>0.005]+[(k,E_text[k],V.get(k)) for k in TEXT if V.get(k)!=E_text[k]]
print(f"passes={passes}: {len(calc)} calculated boxes, {len(calc)-len(uncovered)} checked, {len(bad)} wrong, not covered: {uncovered}")
for b_ in bad[:12]: print("  WRONG", b_)
groups={}
for k,_,_ in bad: groups.setdefault(k.split('_')[0],0); groups[k.split('_')[0]]+=1
print("  wrong by group:", groups)
json.dump(dict(E={k:E[k] for k in calc if k in E},D=D),open("expected.json","w"))
