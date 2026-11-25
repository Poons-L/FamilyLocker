import json, random, subprocess, sys, math
MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"]
def run_case(specfile, name, start="January", months=range(12), seed=1, extra=None, blank=False, verbose=True):
    random.seed(seed)
    spec=json.load(open(specfile)); F=spec["fields"]
    I={}
    def put(n,v): assert n in F, n; I[n]=v
    if not blank:
        put("cur","S$"); put("tax_rate","20"); put("start_month",start)
        put("goal_target","100000"); put("goal_start","22000"); put("goal_pay","15000")
        for r in range(1,6): put(f"og_{r}_1",str(random.randint(1000,9000))); put(f"og_{r}_2",str(random.randint(0,12))); put(f"og_{r}_3",str(random.randint(0,900)))
        for r in range(1,10):
            for c in (1,2,3): put(f"as_{r}_{c}",str(random.randint(0,90000)))
        for r in range(1,7):
            for c in (1,2,3): put(f"li_{r}_{c}",str(random.randint(0,40000)))
        for r in range(1,17):
            put(f"sub_{r}_1",f"{random.uniform(1,90):.2f}")
            if random.random()<.4: put(f"sub_{r}_4","Yes")
        for r in range(1,13): put(f"lk_{r}_1",str(random.randint(0,900))); put(f"lk_{r}_2",str(random.randint(0,1000)))
        for r in range(1,15): put(f"by_{r}_2",str(random.randint(0,5000))); put(f"by_{r}_4",str(random.randint(0,3000)))
        debts=[(4200,24.9,300),(1800,19.9,40),(12000,8.5,450),(9000,0,250),(3000,12,0),(0,0,0)]
        for r,(b,a,p) in enumerate(debts,1):
            if b: put(f"db_{r}_1",str(b)); put(f"db_{r}_2",str(a)); put(f"db_{r}_3",str(p))
        put("best_rate","4.25"); put("ef_month","5200")
        for r in range(1,8): put(f"ac_{r}_1",str(random.randint(0,60000))); put(f"ac_{r}_2",f"{random.uniform(0,7):.2f}")
        for r in range(1,13):
            put(f"iou_{r}_2",str(random.randint(0,2000)))
            if random.random()<.4: put(f"iou_{r}_5","Yes")
        for r in range(1,7): put(f"um_in_{r}_1",str(random.randint(0,9000)))
        for r in range(1,19):
            if r!=10: put(f"um_ex_{r}_1",str(random.randint(0,2000)))
        put("um_ex_3_0","Food shop")     # rename a category: should show on every month
        for m in months:
            p=f"m{m}"
            for r in range(1,7):
                put(f"{p}in_{r}_2",str(random.randint(0,9000))); put(f"{p}in_{r}_3","Yes" if random.random()<.4 else "Off")
            for r in range(1,19):
                if random.random()<.25: put(f"{p}ex_{r}_2",str(random.randint(-300,500)))
                if random.random()<.9: put(f"{p}ex_{r}_3",str(random.randint(0,3000)))
            put(f"{p}_saved",str(random.randint(0,7000)))
            for d in range(1,29):
                if random.random()<.3: put(f"{p}_ns_{d}","Yes")
    if extra: I.update(extra)
    json.dump(I,open("ti.json","w"))
    subprocess.run(["node","run.js",specfile,"ti.json","to.json","1"],check=True)
    out=json.load(open("to.json")); V=out["values"]; D=out["display"]
    def n(k):
        v=V.get(k,""); return 0.0 if v=="" else float(str(v).replace(",",""))
    def x(k):
        v=I.get(k,"");
        try: return float(v) if v!="" else 0.0
        except: return 0.0
    def chk(k): return 1 if I.get(k, "Yes" if F[k]["v"]=="/Yes" else "Off")=="Yes" else 0
    def has(k): return I.get(k,"")!=""
    E={}; TX={}
    sm=MONTHS.index(I.get("start_month","January")); ml=12-sm
    t,s=x("goal_target"),x("goal_start"); pay=x("goal_pay")
    E.update(goal_left=t-s,goal_pm=(t-s)/ml,goal_pw=(t-s)/(ml*52/12),goal_pd=(t-s)/(ml*365/12))
    E["goal_share"]=E["goal_pm"]/pay*100 if pay>0 else 0
    sh=E["goal_share"]
    TX["goal_flag"]="Add your take-home pay to check this goal." if (pay<=0 or E["goal_pm"]<=0) else ("More than you earn each month. Stretch the timeline or grow income first." if E["goal_pm"]>pay else ("Over half your pay. Very ambitious: plan big cuts or extra income." if sh>50 else ("A stretch, but doable on a tight budget." if sh>20 else "Comfortable. You could aim higher.")))
    for p in (25,50,75,100): E[f"ms_amt_{p}"]=s+(t-s)*p/100
    for r in range(1,6): E[f"og_{r}_4"]=(x(f"og_{r}_1")-x(f"og_{r}_3"))/max(1,x(f"og_{r}_2"))
    for c in (1,2,3):
        E[f"as_tot_{c}"]=sum(x(f"as_{r}_{c}") for r in range(1,10)); E[f"li_tot_{c}"]=sum(x(f"li_{r}_{c}") for r in range(1,7))
    E["nw_jan"]=E["as_tot_1"]-E["li_tot_1"]; E["nw_jun"]=E["as_tot_2"]-E["li_tot_2"]; E["nw_dec"]=E["as_tot_3"]-E["li_tot_3"]
    E["nw_chg"]=E["nw_dec"]-E["nw_jan"] if (has("as_1_3") or E["as_tot_3"]!=0 or E["li_tot_3"]!=0) else 0
    for r in range(1,17): E[f"sub_{r}_2"]=x(f"sub_{r}_1")*12; E[f"sub_{r}_5"]=x(f"sub_{r}_1")*12*chk(f"sub_{r}_4")
    E["sub_tot_1"]=sum(x(f"sub_{r}_1") for r in range(1,17))
    for c in (2,5): E[f"sub_tot_{c}"]=sum(E[f"sub_{r}_{c}"] for r in range(1,17))
    for r in range(1,13): E[f"lk_{r}_3"]=max(0,x(f"lk_{r}_1")-x(f"lk_{r}_2")); E[f"lk_{r}_4"]=E[f"lk_{r}_3"]*12
    for c in (1,2): E[f"lk_tot_{c}"]=sum(x(f"lk_{r}_{c}") for r in range(1,13))
    for c in (3,4): E[f"lk_tot_{c}"]=sum(E[f"lk_{r}_{c}"] for r in range(1,13))
    for r in range(1,15): E[f"by_{r}_3"]=x(f"by_{r}_2")/12
    E["by_tot_2"]=sum(x(f"by_{r}_2") for r in range(1,15)); E["by_tot_4"]=sum(x(f"by_{r}_4") for r in range(1,15)); E["by_tot_3"]=sum(E[f"by_{r}_3"] for r in range(1,15))
    E["by_pm"]=E["by_tot_3"]; E["by_left"]=max(0,E["by_tot_2"]-E["by_tot_4"])
    def sim(b,a,p):
        r=a/1200
        if b<=0: return (0,0)
        if p<=0: return (-1,0)
        if p<=b*r: return (-2,0)
        k=0; tt=0
        while b>0.005 and k<1200: i=b*r; tt+=i; b=b+i-p; k+=1
        return (k,tt)
    for r in range(1,9):
        k,tt=sim(x(f"db_{r}_1"),x(f"db_{r}_2"),x(f"db_{r}_3"))
        TX[f"db_{r}_4"]="" if k==0 else ("Add a payment" if k==-1 else ("Payment too low" if k==-2 else (f"{k} months" if k<12 else f"{k//12} yr {k%12} mo")))
        E[f"db_{r}_5"]=tt if k>0 else 0
    E["db_tot_1"]=sum(x(f"db_{r}_1") for r in range(1,9)); E["db_tot_3"]=sum(x(f"db_{r}_3") for r in range(1,9)); E["db_tot_5"]=sum(E[f"db_{r}_5"] for r in range(1,9))
    b=x("best_rate")
    for r in range(1,8):
        B,R=x(f"ac_{r}_1"),x(f"ac_{r}_2"); E[f"ac_{r}_3"]=B*R/100; E[f"ac_{r}_4"]=B*max(R,b)/100; E[f"ac_{r}_5"]=B*max(0,b-R)/100
    E["ac_tot_1"]=sum(x(f"ac_{r}_1") for r in range(1,8))
    for c in (3,4,5): E[f"ac_tot_{c}"]=sum(E[f"ac_{r}_{c}"] for r in range(1,8))
    E["ef_target"]=x("ef_month")*6
    for r in range(1,13): E[f"iou_{r}_6"]=0 if chk(f"iou_{r}_5") else x(f"iou_{r}_2")
    E["iou_tot_2"]=sum(x(f"iou_{r}_2") for r in range(1,13)); E["iou_tot_6"]=sum(E[f"iou_{r}_6"] for r in range(1,13))
    # usual month
    E["um_in_tot_1"]=sum(x(f"um_in_{r}_1") for r in range(1,7))
    E["um_ex_10_1"]=sum(0 if chk(f"sub_{k}_4") else x(f"sub_{k}_1") for k in range(1,17))
    um=lambda r: E["um_ex_10_1"] if r==10 else x(f"um_ex_{r}_1")
    E["um_ex_tot_1"]=sum(um(r) for r in range(1,19)); E["um_left"]=E["um_in_tot_1"]-E["um_ex_tot_1"]; E["um_goal"]=E["goal_pm"]
    names_in=[I.get(f"um_in_{r}_0",F[f"um_in_{r}_0"]["v"]) for r in range(1,7)]
    names_ex=[I.get(f"um_ex_{r}_0",F[f"um_ex_{r}_0"]["v"]) for r in range(1,19)]
    tax=x("tax_rate")
    for m in range(12):
        p=f"m{m}"
        for r in range(1,7): E[f"{p}in_{r}_1"]=x(f"um_in_{r}_1"); TX[f"{p}in_{r}_0"]=names_in[r-1]
        E[f"{p}in_tot_1"]=E["um_in_tot_1"]; E[f"{p}in_tot_2"]=sum(x(f"{p}in_{r}_2") for r in range(1,7))
        for r in range(1,19):
            E[f"{p}ex_{r}_1"]=um(r); TX[f"{p}ex_{r}_0"]=names_ex[r-1]
            E[f"{p}ex_{r}_4"]=um(r)+x(f"{p}ex_{r}_2")-x(f"{p}ex_{r}_3") if has(f"{p}ex_{r}_3") else 0
        E[f"{p}ex_tot_1"]=E["um_ex_tot_1"]
        for c in (2,3): E[f"{p}ex_tot_{c}"]=sum(x(f"{p}ex_{r}_{c}") for r in range(1,19))
        E[f"{p}ex_tot_4"]=sum(E[f"{p}ex_{r}_4"] for r in range(1,19))
        E[f"{p}_nscount"]=sum(chk(f"{p}_ns_{d}") for d in range(1,32) if f"{p}_ns_{d}" in F)
        E[f"{p}_inc"]=E[f"{p}in_tot_2"]; E[f"{p}_spent"]=E[f"{p}ex_tot_3"]
        E[f"{p}_tax"]=sum(x(f"{p}in_{r}_2")*chk(f"{p}in_{r}_3") for r in range(1,7))*tax/100
        E[f"{p}_left"]=E[f"{p}_inc"]-E[f"{p}_spent"]-E[f"{p}_tax"]
        E[f"{p}_spare"]=E[f"{p}_left"]-x(f"{p}_saved") if (has(f"{p}_saved") or E[f"{p}_left"]!=0) else 0
    E["tr_goal"]=t; E["tr_pm"]=E["goal_pm"]
    run=s; erun=0; filled=0; svt=0
    for m in range(12):
        sv=x(f"m{m}_saved"); hs=has(f"m{m}_saved"); run+=sv; svt+=sv; erun+=E[f"m{m}in_tot_2"]
        if m>=sm and hs: filled+=1
        E[f"tr_t_{m}"]=E["goal_pm"]*(m-sm+1) if m>=sm else 0; E[f"tr_s_{m}"]=sv
        E[f"tr_r_{m}"]=run if hs else 0
        E[f"tr_p_{m}"]=run/t*100 if (hs and t>0) else 0
        E[f"tr_ok_{m}"]=(run-s)-E[f"tr_t_{m}"] if hs else 0
        E[f"er_pl_{m}"]=E[f"m{m}in_tot_1"]; E[f"er_ac_{m}"]=E[f"m{m}in_tot_2"]; E[f"er_run_{m}"]=erun if E[f"m{m}in_tot_2"]!=0 else 0; E[f"er_sv_{m}"]=sv
        E[f"er_rate_{m}"]=sv/E[f"m{m}in_tot_2"]*100 if E[f"m{m}in_tot_2"]>0 else 0
        for j,src in enumerate(["inc","spent","left","saved","nscount"]): E[f"yr_{m}_{j}"]=sv if src=="saved" else E[f"m{m}_{src}"]
    E["er_sofar"]=erun; E["er_tot_pl"]=sum(E[f"er_pl_{m}"] for m in range(12)); E["er_tot_ac"]=erun; E["er_tot_sv"]=svt
    E["er_tot_rate"]=svt/erun*100 if erun>0 else 0
    for j in range(5): E[f"yr_tot_{j}"]=sum(E[f"yr_{m}_{j}"] for m in range(12))
    E["yr_goalpct"]=(s+svt)/t*100 if t>0 else 0; E["yr_nw"]=E["nw_chg"]
    E.update(dash_goal=t, dash_saved=s+svt, dash_reached=(s+svt)/t*100 if t>0 else 0, dash_left=max(0,t-(s+svt)),
             dash_need=max(0,t-(s+svt))/(ml-filled) if ml-filled>0 else 0,
             dash_in=erun, dash_out=sum(E[f"m{m}ex_tot_3"] for m in range(12)), dash_tax=sum(E[f"m{m}_tax"] for m in range(12)), dash_sv=svt,
             dash_subs=E["sub_tot_5"], dash_leaks=E["lk_tot_4"], dash_idle=E["ac_tot_5"], dash_owed=E["iou_tot_6"], dash_big=E["by_tot_3"],
             dash_nwj=E["nw_jan"], dash_nwd=E["nw_dec"], dash_nwc=E["nw_chg"], dash_nsd=sum(E[f"m{m}_nscount"] for m in range(12)), dash_debt=E["db_tot_1"])
    E["dash_rate"]=svt/erun*100 if erun else 0
    calc=[k for k,v in F.items() if v["calc"]]
    unc=[k for k in calc if k not in E and k not in TX]
    bad=[(k,round(E[k],2),V.get(k)) for k in calc if k in E and abs(n(k)-E[k])>0.005]
    bad+=[(k,TX[k],V.get(k)) for k in calc if k in TX and V.get(k)!=TX[k]]
    junk=[(k,v) for k,v in V.items() if str(v) in ("NaN","Infinity","-Infinity","undefined","null")]
    if verbose:
        print(f"[{name}] {len(calc)} automatic boxes: {len(calc)-len(unc)-len(bad)} correct, {len(bad)} wrong, {len(unc)} unchecked {unc[:5]}, junk {junk[:3]}")
        for b_ in bad[:8]: print("    WRONG", b_)
    return V,D,E,TX,bad
if __name__=="__main__":
    spec=sys.argv[1] if len(sys.argv)>1 else "planner.json"
    run_case(spec,"Anna: starts January, full year")
    V,D,E,TX,bad=run_case(spec,"Raj: starts April, Apr-Jun filled",start="April",months=[3,4,5],seed=2)
    print("    Raj sees: per month", D.get("goal_pm"), "| Jan-Mar target", [V[f"tr_t_{m}"] for m in range(3)], "| Apr target", D.get("tr_t_3"),
          "| needed from now", D.get("dash_need"), "| Jul-Dec running", set(V[f"tr_r_{m}"] for m in range(6,12)))
    print("    Raj's May names:", V["m4ex_3_0"], "/", V["m4ex_10_0"], "| May subscriptions plan", D.get("m4ex_10_1"), "| spare cash", D.get("m4_spare"))
    print("    Debts:", [V[f"db_{r}_4"] for r in range(1,7)], "interest", [D.get(f"db_{r}_5","") for r in range(1,6)])
    V,D,E,TX,bad=run_case(spec,"Blank copy, nothing typed",blank=True)
    print("    blank copy: non-empty boxes:", [(k,v) for k,v in V.items() if json.load(open(spec))["fields"][k]["calc"] and v not in ("",) and not k.endswith("_0") and k!="goal_flag"][:5],
          "| March names:", V["m2ex_1_0"], V["m2in_1_0"], "| flag:", V["goal_flag"])
    V,D,E,TX,bad=run_case(spec,"Your test: 500,000 goal + Jan salary",blank=True,extra={"goal_target":"500000","goal_pay":"12000","m0in_1_2":"12000"})
    print("    shows:", D.get("goal_pm"), V.get("goal_flag"), "| tracker Dec:", repr(V["tr_ok_11"]), "| earnings Feb:", repr(V["er_run_1"]))
