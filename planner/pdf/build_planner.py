"""Build the fillable 'Financial Planner 2027' PDF (A4 and US Letter).

Usage:  python3 build_planner.py            -> writes both sizes next to this script
Needs:  reportlab, pypdf
Totals auto-calculate in Adobe Acrobat Reader and most desktop PDF apps (PDF JavaScript).
"""
import calendar, os, sys
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4, LETTER
from reportlab.lib.colors import HexColor, white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pypdf import PdfReader, PdfWriter
from pypdf.generic import NameObject, NumberObject, DictionaryObject, ArrayObject, TextStringObject, BooleanObject

YEAR = 2027
BRAND = "The Nicheless Niche"
TAGLINE = "Honest tools for work, wellbeing and life"
SHOP = "topmate.io/the_nicheless_niche"
HERE = os.path.dirname(os.path.abspath(__file__))

# ---------- brand ----------
# The Nicheless Niche house style: dark cover, cream pages, Georgia-style serif, gold accents
INK = HexColor("#1F1D1A"); MUTED = HexColor("#6E665A"); LINE = HexColor("#E2D7C2")
VAULT = HexColor("#121318"); VAULT_SOFT = HexColor("#FFFDF8"); GOLD = HexColor("#A57A30")
GOLD_SOFT = HexColor("#F1E5CC"); FIELD = HexColor("#FFFDF7"); CALC = HexColor("#F3E6CB"); PAPER = HexColor("#FFFDF7")
CREAM = HexColor("#F8F2E7"); GOLD_BRIGHT = HexColor("#D2A85C"); NIGHT_FIELD = HexColor("#1E2026")
NOTE_NAME = "Ulka"
LOGO = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets", "tnn-logo.png")   # signs the tip boxes, as in the other TNN kits

def reg(name, path, fallback):
    try:
        pdfmetrics.registerFont(TTFont(name, path)); return name
    except Exception:
        return fallback
FD = os.path.join(HERE, "fonts")   # Gelasio: Georgia-metric serif (SIL OFL)
F_DISP = reg("Gelasio-Bold", os.path.join(FD, "Gelasio-Bold.ttf"), "Times-Bold")
F_DISP_I = reg("Gelasio-Italic", os.path.join(FD, "Gelasio-Italic.ttf"), "Times-Italic")
F_BODY = reg("Gelasio", os.path.join(FD, "Gelasio-Regular.ttf"), "Times-Roman")
F_BOLD = F_DISP
F_MONO = F_BODY

MONTHS = [calendar.month_name[i] for i in range(1, 13)]
MON = [calendar.month_abbr[i] for i in range(1, 13)]


class Planner:
    def __init__(self, path, size):
        self.path = path
        self.W, self.H = size
        self.M = 40  # margin
        self.c = canvas.Canvas(path, pagesize=size)
        self.c.setTitle(f"Financial Planner {YEAR}")
        self.c.setAuthor(BRAND)
        self.series = f"FINANCIAL PLANNER {YEAR}"
        self.docname = f"Financial Planner {YEAR}"
        self.c.setSubject("Fillable personal finance planner")
        self.meta = {}       # field name -> dict(num, dec, calc)
        self.order = []      # calculation order
        self.page_no = 0

    # ---------- primitives ----------
    def text(self, x, y, s, font=None, size=10, color=INK, align="left"):
        c = self.c; c.setFont(font or F_BODY, size); c.setFillColor(color)
        cs = 1.3 if (size <= 9 and any(ch.isalpha() for ch in s) and s.upper() == s) else 0
        if cs and align != "left":
            w = pdfmetrics.stringWidth(s, font or F_BODY, size) + cs * (len(s) - 1)
            x = x - w if align == "right" else x - w / 2
        if cs:
            c.drawString(x, y, s, charSpace=cs)
        else:
            {"left": c.drawString, "right": c.drawRightString, "center": c.drawCentredString}[align](x, y, s)

    def wrap(self, x, y, s, width, font=None, size=10, color=MUTED, lead=None):
        font = font or F_BODY; lead = lead or size * 1.35
        words, line = s.split(), ""
        for w in words:
            t = (line + " " + w).strip()
            if pdfmetrics.stringWidth(t, font, size) > width:
                self.text(x, y, line, font, size, color); y -= lead; line = w
            else:
                line = t
        if line:
            self.text(x, y, line, font, size, color); y -= lead
        return y

    def field(self, name, x, y, w, h, num=False, dec=0, calc=None, value="", multiline=False, size=9.5, tip=None):
        assert name not in self.meta, name
        fill = CALC if calc else FIELD
        flags = "multiline" if multiline else ""
        self.c.acroForm.textfield(name=name, tooltip=tip or name, x=x, y=y, width=w, height=h, value=str(value),
                                  fontName="Helvetica", fontSize=size, borderStyle="underlined", borderWidth=0.6,
                                  borderColor=LINE, fillColor=fill, textColor=INK, forceBorder=True, fieldFlags=flags)
        self.meta[name] = dict(num=num or bool(calc), dec=dec, calc=calc)
        if calc:
            self.order.append(name)

    def check(self, name, x, y, s=10, tip=None, checked=False):
        assert name not in self.meta, name
        self.c.acroForm.checkbox(name=name, tooltip=tip or name, x=x, y=y, size=s, buttonStyle="check", checked=checked,
                                 borderColor=VAULT, fillColor=PAPER, textColor=VAULT, borderWidth=0.8, forceBorder=True)
        self.meta[name] = dict(check=True)

    # ---------- page furniture ----------
    def page(self, title, kicker, intro=None):
        if self.page_no:
            self.c.showPage()
        self.page_no += 1
        c, W, H, M = self.c, self.W, self.H, self.M
        c.setFillColor(CREAM); c.rect(0, 0, W, H, stroke=0, fill=1)
        if getattr(self, "logo_top", False):
            c.drawImage(LOGO, W - M - 46, H - M - 40, 46, 46, mask="auto")
        self.text(M, H - M - 2, kicker.upper(), F_BOLD, 7.5, GOLD)
        self.text(M, H - M - 28, title, F_DISP, 24, INK)
        y = H - M - 46
        if intro:
            y = self.wrap(M, y, intro, W - 2 * M, font=F_DISP_I, size=10.5) + 4
        c.setFillColor(GOLD_BRIGHT); c.rect(M, y - 6, 46, 2.2, stroke=0, fill=1)
        y -= 14
        # footer
        c.setStrokeColor(LINE); c.setLineWidth(0.5); c.line(M, 32, W - M, 32)
        c.drawImage(LOGO, M, 15.5, 14, 14, mask="auto")
        self.text(M + 19, 20, BRAND.upper(), F_BOLD, 7, INK)
        bw = 19 + pdfmetrics.stringWidth(BRAND.upper(), F_BOLD, 7) + 1.3 * len(BRAND) + 6
        self.text(M + bw, 20, f"·  {self.docname}  ·  Get your own copy: {SHOP}", F_BODY, 7, MUTED)
        self.text(W - M, 20, str(self.page_no), F_BODY, 7.5, MUTED, "right")
        return y

    def note(self, x, y, w, body):
        """Ulka's note: beige box, gold bold lead-in, italic body. Returns y below."""
        lead = f"{NOTE_NAME}'s note: "
        size = 9.5; ld = size * 1.4
        lw = pdfmetrics.stringWidth(lead, F_BOLD, size)
        words, lines, line, avail = body.split(), [], "", w - 24 - lw
        for wd in words:
            t = (line + " " + wd).strip()
            if pdfmetrics.stringWidth(t, F_DISP_I, size) > avail:
                lines.append(line); line = wd; avail = w - 24
            else:
                line = t
        lines.append(line)
        h = 16 + ld * len(lines)
        self.c.setFillColor(GOLD_SOFT); self.c.roundRect(x, y - h, w, h, 5, stroke=0, fill=1)
        ty = y - 15
        self.text(x + 12, ty, lead, F_BOLD, size, GOLD)
        for i, ln in enumerate(lines):
            self.text(x + 12 + (lw if i == 0 else 0), ty, ln, F_DISP_I, size, INK); ty -= ld
        return y - h - 10

    def section(self, x, y, label, w=None):
        self.text(x, y, label.upper(), F_BOLD, 7.5, GOLD)
        c = self.c; c.setStrokeColor(LINE); c.setLineWidth(0.6)
        c.line(x, y - 4, x + (w or (self.W - 2 * self.M)), y - 4)
        return y - 16

    def box(self, x, y, w, h, fill=VAULT_SOFT, r=5):
        c = self.c
        if fill == VAULT_SOFT:   # white card with a gold left edge, like the kits' step cards
            c.setFillColor(fill); c.setStrokeColor(LINE); c.setLineWidth(0.6)
            c.roundRect(x, y, w, h, r, stroke=1, fill=1)
            c.setFillColor(GOLD_BRIGHT); c.rect(x, y, 3, h, stroke=0, fill=1)
        else:
            c.setFillColor(fill); c.roundRect(x, y, w, h, r, stroke=0, fill=1)

    def table(self, x, y, cols, rows, prefix, rh=17, defaults=None, total=None, checked=()):
        """cols: list of (header, width, kind, extra). kind: text|num|calc|check.
        calc extra: function(row_prefix) -> js expression. Returns y below table."""
        hx = x
        for head, w, kind, *_ in cols:
            al = "left" if kind == "text" else ("center" if kind == "check" else "right")
            tx = hx + 2 if al == "left" else (hx + w / 2 if al == "center" else hx + w - 3)
            self.text(tx, y, head, F_BOLD, 7.5, MUTED, al)
            hx += w + 4
        y -= 6
        for r in range(rows):
            y -= rh
            hx = x
            for ci, (head, w, kind, *extra) in enumerate(cols):
                n = f"{prefix}_{r+1}_{ci}"
                if kind == "check":
                    self.check(n, hx + w / 2 - 5, y + 3, 10, checked=(r + 1, ci) in checked)
                elif kind == "text":
                    dv = defaults[r] if (defaults and ci == 0 and r < len(defaults)) else ""
                    self.field(n, hx, y, w, rh - 3, value=dv)
                elif kind == "num":
                    dec = extra[0] if extra else 0
                    self.field(n, hx, y, w, rh - 3, num=True, dec=dec)
                elif kind == "calc":
                    fn, *rest = extra
                    self.field(n, hx, y, w, rh - 3, calc=fn(f"{prefix}_{r+1}_"), dec=rest[0] if rest else 0)
                hx += w + 4
        if total:
            y -= rh + 2
            hx = x
            for ci, (head, w, kind, *extra) in enumerate(cols):
                if ci in total:
                    names = [f"{prefix}_{r+1}_{ci}" for r in range(rows)]
                    self.field(f"{prefix}_tot_{ci}", hx, y, w, rh - 3, calc=SUM(names), dec=extra[1] if kind == "calc" and len(extra) > 1 else (extra[0] if kind == "num" and extra else 0))
                elif ci == 0:
                    self.text(hx + 2, y + 4, "Total", F_BOLD, 9, INK)
                hx += w + 4
        return y - 10

    def save(self):
        self.c.showPage(); self.c.save()
        postprocess(self.path, self.meta, self.order)


# ---------- JS helpers ----------
PRE = 'var d=this;function N(n){var f=d.getField(n);if(!f)return 0;var v=String(f.value).replace(/,/g,"");if(v==="")return 0;v=Number(v);return isNaN(v)?0:v;}function C(n){var f=d.getField(n);return f&&f.value!=="Off"&&f.value!==""?1:0;}'
def SUM(names): return "+".join(f'N("{n}")' for n in names) or "0"
def calc_js(expr): return PRE + f"var r=({expr});event.value=(isFinite(r)&&Math.abs(r)>0.0001)?r:\"\";"


def calc_order(meta, order):
    """Order calculations so every box is worked out after the boxes it reads (Acrobat runs /CO once, top to bottom)."""
    import re
    deps = {n: [d for d in re.findall(r'[NC]\("([^"]+)"\)', meta[n]["calc"]) if meta.get(d, {}).get("calc")] for n in order}
    done, out = set(), []
    def visit(n, stack=()):
        if n in done: return
        assert n not in stack, f"circular formula at {n}"
        for d in deps[n]: visit(d, stack + (n,))
        done.add(n); out.append(n)
    for n in order: visit(n)
    return out


def postprocess(path, meta, order):
    reader = PdfReader(path)
    w = PdfWriter(clone_from=reader)
    refs = {}
    for page in w.pages:
        for a in page.get("/Annots", []) or []:
            obj = a.get_object()
            name = obj.get("/T")
            if name is None or name not in meta:
                continue
            m = meta[name]; refs[name] = a
            if m.get("check"):
                continue
            if m.get("num"):
                obj[NameObject("/Q")] = NumberObject(2)
                aa = DictionaryObject()
                dec = m.get("dec", 0)
                if is_money(name):
                    aa[NameObject("/F")] = js(f'var s=(typeof CUR=="string")?CUR:(this.getField("cur")?String(this.getField("cur").value):"");if(s&&s!=="No symbol"&&s.length<=3&&!/[$€£¥]/.test(s))s=s+" ";if(s==="No symbol")s="";AFNumber_Format({dec},0,0,0,s,true);')
                else:
                    aa[NameObject("/F")] = js(f'AFNumber_Format({dec},0,0,0,"",false);')
                aa[NameObject("/K")] = js(f'AFNumber_Keystroke({dec},0,0,0,"",false);')
                if m.get("calc"):
                    aa[NameObject("/C")] = js(calc_js(m["calc"]))
                    obj[NameObject("/Ff")] = NumberObject(int(obj.get("/Ff", 0)) | 1)  # read-only
                obj[NameObject("/AA")] = aa
    # currency picker: re-format every number when it changes
    for page in w.pages:
        for a in page.get("/Annots", []) or []:
            obj = a.get_object()
            if obj.get("/T") == "cur":
                aa = DictionaryObject()
                aa[NameObject("/V")] = js('CUR=event.value;for(var i=0;i<this.numFields;i++){var n=this.getNthFieldName(i);if(n=="cur")continue;var f=this.getField(n);if(f&&f.type=="text"){var v=f.value;f.value=v;}}')
                obj[NameObject("/AA")] = aa
    af = w._root_object["/AcroForm"]
    af[NameObject("/CO")] = ArrayObject([refs[n] for n in calc_order(meta, order) if n in refs])
    af[NameObject("/NeedAppearances")] = BooleanObject(False)  # keep stored appearances so checkbox borders show in Chrome/Edge
    w._root_object[NameObject("/PageMode")] = NameObject("/UseNone")
    with open(path, "wb") as f:
        w.write(f)

NON_MONEY = ("og_", "tax_rate", "best_rate", "tr_p_", "_nscount", "yr_goalpct", "er_rate_", "er_tot_rate")
def is_money(n):
    if n.startswith("og_") and n.endswith("_2"): return False   # months away
    if n.startswith("ac_") and n.endswith("_2"): return False   # rate %
    if n.startswith("yr_") and n.endswith("_4"): return False   # no-spend days
    return not any(k in n for k in NON_MONEY if k != "og_")

def js(code):
    d = DictionaryObject(); d[NameObject("/S")] = NameObject("/JavaScript"); d[NameObject("/JS")] = TextStringObject(code)
    return d


# ======================================================================
def build(path, size):
    P = Planner(path, size)
    c, W, H, M = P.c, P.W, P.H, P.M
    CW = W - 2 * M

    # ---------------- 1. COVER ----------------
    P.page_no = 1
    cover(P, "THE MONEY PLANNER", ["Financial Planner", str(YEAR)],
          "Know where every bit of money goes. Save more, waste less, and collect what you're owed.",
          [("THIS PLANNER BELONGS TO", "owner"), (f"MY MONEY WORD FOR {YEAR}", "word")])

    # ---------------- 2. HOW TO USE ----------------
    y = P.page("How to use this planner", "Start here",
               "Type straight into any box. Shaded gold boxes work themselves out: totals, monthly targets, running balances. Save the file after each session so your numbers stay put.")
    steps = [
        ("Set your goal", "Pick one big savings number for the year. The planner splits it into a monthly, weekly and daily target."),
        ("Take a snapshot", "Write down what you own and owe in January. Do it again in December and see the change."),
        ("Audit your subscriptions", "List every repeat charge. Tick the ones you didn't use last month and decide: keep or cancel."),
        ("Plug spending leaks", "Shopping, takeaways, impulse buys. Set a target you can live with and watch the yearly saving add up."),
        ("Wake up idle money", "Cash earning almost nothing? Compare rates and give each pot of money a job."),
        ("Collect what you're owed", "Track every IOU. Use the ready-made reminder scripts so asking feels easy."),
        ("Budget every month", "Add your earnings (tick any with no tax taken out), plan your spending, then track actuals. Your earnings and savings pages fill in by themselves."),
    ]
    y -= 10
    for i, (h, d) in enumerate(steps):
        P.text(M + 2, y - 15, str(i + 1), F_DISP, 13, GOLD)
        P.text(M + 26, y - 13, h, F_BOLD, 11.5, INK)
        P.wrap(M + 26, y - 28, d, CW - 26, font=F_DISP_I, size=9.5)
        y -= 46
    y -= 4
    y = P.note(M, y, CW, "totals work in the free Adobe Acrobat Reader and most desktop PDF apps. In some browsers and phone apps you can still type in every box, but totals may not update until you open the file in Acrobat Reader.")
    y -= 8
    P.box(M, y - 58, CW, 58, VAULT_SOFT)
    P.text(M + 14, y - 22, "Choose your currency", F_BOLD, 11, INK)
    P.text(M + 14, y - 38, "Pick from the list or type your own (e.g. S$, RM, Rs). Every amount updates.", F_BODY, 9.5, MUTED)
    currency_picker(P, W - M - 116, y - 42)
    y -= 70
    P.box(M, y - 70, CW, 70, VAULT_SOFT)
    P.text(M + 14, y - 22, "Set aside for tax on side income", F_BOLD, 11, INK)
    P.wrap(M + 14, y - 38, "Freelance, side-hustle and rental income usually has no tax taken out. Enter the % you want to put aside (check your local rules). Each month, tick 'Untaxed' next to that income and the planner reserves it for you.", CW - 180, size=9.5)
    P.field("tax_rate", W - M - 130, y - 46, 80, 24, num=True, dec=0, size=12, tip="Percent to set aside, e.g. 20")
    P.text(W - M - 44, y - 39, "%", F_BOLD, 12, INK)
    y -= 92
    P.text(M, y, "Tip: save the file after every session so your numbers stay put.", F_DISP_I, 11, MUTED)

    # ---------------- 3. MY GOAL ----------------
    y = P.page(f"My {YEAR} savings goal", "Goal",
               "One clear number beats five vague wishes. Write it, price it, and break it into bites you can actually hit.")
    y = P.section(M, y - 6, "The goal")
    P.text(M, y - 2, "I'm saving for", F_BODY, 9, MUTED)
    P.field("goal_name", M, y - 24, CW * 0.62, 20, size=12, tip="What you're saving for")
    P.text(M + CW * 0.66, y - 2, "Target amount", F_BODY, 9, MUTED)
    P.field("goal_target", M + CW * 0.66, y - 24, CW * 0.34, 20, num=True, size=12, tip="How much you want to save in the year")
    y -= 44
    P.text(M, y - 2, "Already saved toward it on 1 January", F_BODY, 9, MUTED)
    P.field("goal_start", M, y - 24, CW * 0.31, 20, num=True, size=11)
    P.text(M + CW * 0.35, y - 2, "Why this matters to me", F_BODY, 9, MUTED)
    P.field("goal_why", M + CW * 0.35, y - 24, CW * 0.65, 20, size=10)
    y -= 46
    # breakdown band
    P.box(M, y - 70, CW, 70, VAULT_SOFT)
    labs = [("Still to save", '(N("goal_target")-N("goal_start"))', "goal_left"),
            ("Per month", '(N("goal_target")-N("goal_start"))/12', "goal_pm"),
            ("Per week", '(N("goal_target")-N("goal_start"))/52', "goal_pw"),
            ("Per day", '(N("goal_target")-N("goal_start"))/365', "goal_pd")]
    bw = (CW - 28 - 3 * 10) / 4
    for i, (l, expr, n) in enumerate(labs):
        bx = M + 14 + i * (bw + 10)
        P.text(bx, y - 20, l.upper(), F_BOLD, 7.5, VAULT)
        P.field(n, bx, y - 52, bw, 24, calc=expr, size=13, dec=0 if n != "goal_pd" else 2)
    y -= 92
    y = P.section(M, y, "Milestones and rewards")
    P.wrap(M, y, "Small wins keep you going. Pick a reward for each milestone that costs little or nothing.", CW, size=9.5)
    y -= 22
    for i, p in enumerate([25, 50, 75, 100]):
        P.text(M, y - 12, f"{p}%", F_MONO, 13, GOLD)
        P.field(f"ms_amt_{p}", M + 48, y - 16, 100, 18, calc=f'N("goal_start")+(N("goal_target")-N("goal_start"))*{p/100}')
        P.text(M + 160, y - 11, "Reward:", F_BODY, 9, MUTED)
        P.field(f"ms_rew_{p}", M + 200, y - 16, CW - 200 - 70, 18)
        P.check(f"ms_done_{p}", W - M - 12, y - 14, 12, tip="Reached")
        y -= 26
    P.text(W - M - 6, y + 112, "Done", F_BOLD, 7.5, MUTED, "right")
    y -= 10
    y = P.section(M, y, "Other goals this year")
    y = P.table(M, y, [("Goal", CW - 4 * 84 - 16, "text"), ("Target", 84, "num"), ("Months away", 84, "num"),
                       ("Saved so far", 84, "num"),
                       ("Per month", 84, "calc", lambda p: f'(N("{p}1")-N("{p}3"))/Math.max(1,N("{p}2"))')],
                5, "og", rh=19)

    # ---------------- 4. SNAPSHOT ----------------
    y = P.page("Money snapshot", "Net worth",
               "What you own minus what you owe. Fill January now and December at year end. The change is your real scorecard.")
    cw = [CW - 2 * 100 - 2 * 90 - 16, 100, 100, 90]
    y = P.section(M, y - 6, "What I own")
    y = P.table(M, y, [("Asset", CW - 2 * 110 - 8, "text"), (f"Jan {YEAR}", 110, "num"), (f"Dec {YEAR}", 110, "num")], 9, "as", rh=19,
                defaults=["Everyday bank account", "Savings account", "Term / fixed deposits", "Investments and funds",
                          "Retirement / pension", "Home or property", "Vehicle", "Other", ""], total={1, 2})
    y = P.section(M, y - 4, "What I owe")
    y = P.table(M, y, [("Debt", CW - 2 * 110 - 8, "text"), (f"Jan {YEAR}", 110, "num"), (f"Dec {YEAR}", 110, "num")], 6, "li", rh=19,
                defaults=["Credit cards", "Personal loan", "Car loan", "Home loan / mortgage", "Student loan", ""], total={1, 2})
    P.box(M, y - 76, CW, 70, VAULT)
    xs = [M + 16, M + CW / 3 + 8, M + 2 * CW / 3]
    for i, (l, expr, n) in enumerate([("Net worth, January", 'N("as_tot_1")-N("li_tot_1")', "nw_jan"),
                                     ("Net worth, December", 'N("as_tot_2")-N("li_tot_2")', "nw_dec"),
                                     ("Change this year", 'N("nw_dec")-N("nw_jan")', "nw_chg")]):
        P.text(xs[i], y - 26, l.upper(), F_BOLD, 7.5, HexColor("#B9B2A3"))
        P.field(n, xs[i], y - 60, CW / 3 - 28, 24, calc=expr, size=13)

    # ---------------- 5. SUBSCRIPTIONS ----------------
    y = P.page("Subscription audit", "Cut the waste",
               "Go through your bank and card statements for the last two months and list every repeat charge. Ask one question of each: would I sign up for this again today?")
    sw = CW - 4 * 70 - 2 * 52 - 24
    y = P.table(M, y - 8, [("Service", sw, "text"), ("Per month", 70, "num", 2), ("Per year", 70, "calc", lambda p: f'N("{p}1")*12', 2),
                           ("Used it last month?", 70, "check"), ("Cancel", 52, "check"),
                           ("Saves / year", 70, "calc", lambda p: f'C("{p}4")?N("{p}1")*12:0', 2), ("Done", 52, "check")],
                16, "sub", rh=19, total={1, 2, 5})
    P.note(M, y - 6, CW, "cancel anything you didn't use last month. Swap yearly plans for monthly ones you can pause. Put free-trial end dates in your phone calendar the day you sign up.")

    # ---------------- 6. SPENDING LEAKS ----------------
    y = P.page("Spending leaks", "Find the money",
               "These are the categories where money slips out quietly. Write what you usually spend in a month, then a target you can stick to without feeling deprived.")
    lw = CW - 4 * 88 - 16
    y = P.table(M, y - 8, [("Category", lw, "text"), ("Usually / month", 88, "num"), ("Target / month", 88, "num"),
                           ("Saves / month", 88, "calc", lambda p: f'Math.max(0,N("{p}1")-N("{p}2"))'),
                           ("Saves / year", 88, "calc", lambda p: f'Math.max(0,N("{p}1")-N("{p}2"))*12')],
                12, "lk", rh=21, total={1, 2, 3, 4},
                defaults=["Online shopping", "Eating out and delivery", "Coffee and snacks", "Clothes and shoes", "Impulse buys",
                          "Taxis and ride-hailing", "Entertainment and nights out", "Gadgets and gaming", "Beauty and grooming",
                          "Alcohol", "", ""])
    y -= 4
    y = P.section(M, y, "Habits that help")
    tips = ["Wait 48 hours before any non-essential purchase over a set amount.",
            "Delete saved cards from shopping apps so every buy takes effort.",
            "Unsubscribe from sale emails. Fewer prompts, fewer purchases.",
            "Set a weekly cash or card limit for flexible spending."]
    for t in tips:
        P.check(f"habit_{tips.index(t)}", M, y - 10, 10)
        P.text(M + 18, y - 8, t, F_BODY, 10, INK)
        y -= 20

    # ---------------- BIG YEARLY COSTS ----------------
    y = P.page("Big yearly costs", "No more surprises",
               "Holidays, premiums, festivals, school fees. They don't come every month, so they ambush the months they do. Spread each one across the year and it stops being a shock.")
    bw_ = CW - 90 - 3 * 86 - 16
    y = P.table(M, y - 8, [("Cost", bw_, "text"), ("Due in", 90, "text"), ("Yearly amount", 86, "num"),
                           ("Set aside / month", 86, "calc", lambda q: f'N("{q}2")/12'),
                           ("Saved so far", 86, "num")],
                14, "by", rh=21, total={2, 3, 4},
                defaults=["Holidays and travel", "Insurance premiums", "Medical check-ups and dental", "Festivals and celebrations",
                          "Birthdays and weddings", "School fees and books", "Car servicing and registration", "Home repairs and maintenance",
                          "Yearly subscriptions", "Professional fees and courses", "Gadgets and replacements", "", "", ""])
    P.box(M, y - 58, CW, 52)
    P.text(M + 16, y - 26, "MOVE THIS INTO A SEPARATE POT EVERY PAYDAY", F_BOLD, 7.5, GOLD)
    P.field("by_pm", M + 16, y - 50, 160, 18, calc='N("by_tot_3")', size=11)
    P.text(M + 186, y - 45, "a month", F_DISP_I, 10, MUTED)
    P.text(W - M - 160, y - 26, "STILL TO SAVE THIS YEAR", F_BOLD, 7.5, GOLD)
    P.field("by_left", W - M - 160, y - 50, 144, 18, calc='Math.max(0,N("by_tot_2")-N("by_tot_4"))', size=11)
    y -= 72
    P.note(M, y, CW, "when the holiday or the premium arrives, the money is already sitting there. That's the whole trick. In the month you pay, log it under 'Travel and holidays' or 'Insurance' on that month's page.")

    # ---------------- 7. IDLE MONEY ----------------
    y = P.page("Idle money check", "Make it work",
               "Money in an account paying close to nothing loses value to inflation every year. Keep a safety net you can reach fast, then give the rest a job.")
    y = P.section(M, y - 6, "My accounts")
    P.text(M, y - 4, "Best rate I can get on easy-access savings (%)", F_BODY, 9.5, MUTED)
    P.field("best_rate", M + 230, y - 9, 60, 17, num=True, dec=2)
    y -= 24
    aw = CW - 5 * 76 - 20
    y = P.table(M, y, [("Account", aw, "text"), ("Balance", 76, "num"), ("Rate %", 76, "num", 2),
                       ("Earns / year", 76, "calc", lambda p: f'N("{p}1")*N("{p}2")/100'),
                       ("Could earn", 76, "calc", lambda p: f'N("{p}1")*Math.max(N("{p}2"),N("best_rate"))/100'),
                       ("Extra / year", 76, "calc", lambda p: f'N("{p}1")*Math.max(0,N("best_rate")-N("{p}2"))/100')],
                7, "ac", rh=19, total={1, 3, 4, 5},
                defaults=["Everyday account", "Savings account", "", "", "", "", ""])
    y = P.section(M, y - 2, "My safety net")
    P.text(M, y - 4, "Essential spending per month", F_BODY, 9.5, MUTED)
    P.field("ef_month", M + 150, y - 9, 90, 17, num=True)
    P.text(M + 262, y - 4, "x 6 months = my safety net", F_BODY, 9.5, MUTED)
    P.field("ef_target", W - M - 100, y - 9, 100, 17, calc='N("ef_month")*6')
    y -= 34
    y = P.section(M, y, "Match the money to when you need it")
    cols3 = [("Within a year", "High-yield savings", "Instant access, very low risk. Home for your safety net and short goals."),
             ("In 1 to 3 years", "Term or fixed deposit", "Locked for a set time at a fixed rate. Ladder a few so one matures every few months."),
             ("5+ years away", "Diversified index fund", "Grows more over time but the value moves up and down. Invest a set amount monthly.")]
    bw3 = (CW - 20) / 3
    for i, (when, what, why) in enumerate(cols3):
        bx = M + i * (bw3 + 10)
        P.box(bx, y - 104, bw3, 98, VAULT_SOFT if i != 1 else GOLD_SOFT)
        P.text(bx + 10, y - 22, when.upper(), F_BOLD, 7.5, GOLD if i == 1 else VAULT)
        P.text(bx + 10, y - 40, what, F_DISP, 13, INK)
        P.wrap(bx + 10, y - 56, why, bw3 - 20, size=9, color=INK)
    y -= 122
    P.text(M, y, "Quarterly check-in:", F_BOLD, 10, INK)
    for i, q in enumerate(["Mar", "Jun", "Sep", "Dec"]):
        P.check(f"idle_q{i+1}", M + 110 + i * 70, y - 3, 11)
        P.text(M + 126 + i * 70, y, q, F_BODY, 10, INK)
    y -= 20
    P.wrap(M, y, "Rates and products differ by country. Compare offers from licensed banks and fund providers, and speak to a licensed adviser before investing. This planner is educational, not financial advice.", CW, size=8.5)

    # ---------------- 8. OWED TO ME ----------------
    y = P.page("Owed to me", "Collect it",
               "Small loans to friends and family add up, and the longer they sit the harder they are to raise. Log them here and follow up kindly and clearly.")
    ow = CW - 120 - 3 * 70 - 2 * 52 - 28
    y = P.table(M, y - 8, [("Who", ow, "text"), ("What for", 120, "text"), ("Amount", 70, "num"), ("Due by", 70, "text"),
                           ("Reminded", 52, "check"), ("Paid", 52, "check"),
                           ("Still owed", 70, "calc", lambda p: f'C("{p}5")?0:N("{p}2")')],
                12, "iou", rh=19, total={2, 6})
    y = P.section(M, y - 2, "Reminder scripts: copy, tweak, send")
    scripts = [("Gentle", "Hi [name], hope you're well! Just a friendly nudge about the [amount] for [what]. Whenever suits you this week works for me. Thanks so much!"),
               ("Clear", "Hi [name], I'm getting my finances organised this month and noticed the [amount] for [what] is still open. Could you send it by [date]? Happy to take it in two parts if that's easier."),
               ("Firm", "Hi [name], following up again on the [amount] for [what]. I'd like to settle this by [date]. Can you let me know today when you'll send it? I value our friendship and don't want money to get in the way.")]
    for lab, s in scripts:
        P.text(M, y - 6, lab.upper(), F_BOLD, 8, GOLD)
        y = P.wrap(M + 56, y - 6, s, CW - 56, size=9.5, color=INK) - 6

    # ---------------- 9. SAVINGS TRACKER ----------------
    y = P.page(f"Savings tracker {YEAR}", "Progress",
               "The Saved column fills in from your monthly pages. Watch the running total climb toward your goal.")
    y -= 4
    P.text(M, y, "Goal", F_BODY, 9.5, MUTED); P.field("tr_goal", M + 32, y - 5, 110, 17, calc='N("goal_target")')
    P.text(M + 162, y, "Monthly target", F_BODY, 9.5, MUTED); P.field("tr_pm", M + 240, y - 5, 100, 17, calc='N("goal_pm")')
    y -= 28
    tw = (CW - 5 * 4) / 6
    heads = ["Month", "Target", "Saved", "Running total", "% of goal", "On track?"]
    for i, h in enumerate(heads):
        P.text(M + i * (tw + 4) + (2 if i == 0 else tw - 3), y, h, F_BOLD, 7.5, MUTED, "left" if i == 0 else "right")
    y -= 6
    for m in range(12):
        y -= 22
        P.text(M + 2, y + 5, MONTHS[m], F_BODY, 10.5, INK)
        x = M + tw + 4
        P.field(f"tr_t_{m}", x, y, tw, 18, calc=f'N("goal_pm")*{m+1}'); x += tw + 4
        P.field(f"tr_s_{m}", x, y, tw, 18, calc=f'N("m{m}_saved")'); x += tw + 4
        P.field(f"tr_r_{m}", x, y, tw, 18, calc=f'N("goal_start")+' + "+".join(f'N("m{k}_saved")' for k in range(m + 1))); x += tw + 4
        P.field(f"tr_p_{m}", x, y, tw, 18, calc=f'N("goal_target")>0?N("tr_r_{m}")/N("goal_target")*100:0', dec=0); x += tw + 4
        # on track: running - start >= target cumulative
        P.field(f"tr_ok_{m}", x, y, tw, 18, calc=f'(N("tr_r_{m}")-N("goal_start"))-N("tr_t_{m}")')
    y -= 18
    P.text(M, y, "On track? shows how far ahead (+) or behind (-) your cumulative target you are.", F_BODY, 8.5, MUTED)
    y -= 26
    y = P.section(M, y, "Colour it in: tick a box for every 5% of your goal")
    bs = (CW - 19 * 6) / 20
    for i in range(20):
        P.check(f"tr_box_{i}", M + i * (bs + 6), y - bs, bs, tip=f"{(i+1)*5}%")
        if (i + 1) % 5 == 0:
            P.text(M + i * (bs + 6) + bs / 2, y - bs - 12, f"{(i+1)*5}%", F_MONO, 7.5, MUTED, "center")

    # ---------------- EARNINGS ----------------
    y = P.page(f"My earnings {YEAR}", "Income",
               "Everything you earn, month by month. Actual figures fill in from the income box on each monthly page, so you only type them once.")
    y -= 4
    P.text(M, y, f"My earnings goal for {YEAR}", F_BODY, 9.5, MUTED); P.field("er_goal", M + 140, y - 5, 110, 17, num=True)
    P.text(M + 270, y, "Earned so far", F_BODY, 9.5, MUTED); P.field("er_sofar", M + 340, y - 5, 110, 17, calc=SUM([f"m{k}in_tot_2" for k in range(12)]))
    y -= 30
    tw = (CW - 5 * 4) / 6
    heads = ["Month", "Planned", "Earned", "Running total", "Saved", "% saved"]
    for i, h in enumerate(heads):
        P.text(M + i * (tw + 4) + (2 if i == 0 else tw - 3), y, h, F_BOLD, 7.5, MUTED, "left" if i == 0 else "right")
    y -= 6
    for m in range(12):
        y -= 22
        P.text(M + 2, y + 5, MONTHS[m], F_BODY, 10.5, INK)
        x = M + tw + 4
        P.field(f"er_pl_{m}", x, y, tw, 18, calc=f'N("m{m}in_tot_1")'); x += tw + 4
        P.field(f"er_ac_{m}", x, y, tw, 18, calc=f'N("m{m}in_tot_2")'); x += tw + 4
        P.field(f"er_run_{m}", x, y, tw, 18, calc="+".join(f'N("m{k}in_tot_2")' for k in range(m + 1))); x += tw + 4
        P.field(f"er_sv_{m}", x, y, tw, 18, calc=f'N("m{m}_saved")'); x += tw + 4
        P.field(f"er_rate_{m}", x, y, tw, 18, calc=f'N("m{m}in_tot_2")>0?N("m{m}_saved")/N("m{m}in_tot_2")*100:0')
    y -= 24
    P.text(M + 2, y + 5, "Total", F_BOLD, 10.5, INK)
    P.field("er_tot_pl", M + (tw + 4), y, tw, 18, calc=SUM([f"er_pl_{k}" for k in range(12)]))
    P.field("er_tot_ac", M + 2 * (tw + 4), y, tw, 18, calc=SUM([f"er_ac_{k}" for k in range(12)]))
    P.field("er_tot_sv", M + 4 * (tw + 4), y, tw, 18, calc=SUM([f"er_sv_{k}" for k in range(12)]))
    P.field("er_tot_rate", M + 5 * (tw + 4), y, tw, 18, calc='N("er_tot_ac")>0?N("er_tot_sv")/N("er_tot_ac")*100:0')
    y -= 34
    P.note(M, y, CW, "saving has a floor; earning doesn't. Each quarter, pick one move: ask for a raise with evidence (the Appraisal Season Kit helps), take a paid side project, or sell what you no longer use.")

    # ---------------- 10-21. MONTHLY PAGES ----------------
    INC = ["Salary / main income", "Bonus or commission", "Side income / freelance", "Interest and dividends", "Rental income", "Other"]
    EXP = ["Rent or mortgage", "Utilities and phone", "Groceries", "Transport", "Insurance", "Debt repayments",
           "Medical and health", "Kids and education", "Home and repairs", "Subscriptions", "Eating out", "Shopping",
           "Personal care", "Entertainment", "Travel and holidays", "Gifts", "Charity and festivals", "Other"]
    for m in range(12):
        p = f"m{m}"
        y = P.page(f"{MONTHS[m]} {YEAR}", f"Month {m+1} of 12")
        y -= 8
        leftw = CW * 0.62
        # income
        P.text(M, y, "INCOME", F_BOLD, 8, GOLD)
        yi = P.table(M, y - 10, [("Source", leftw - 2 * 62 - 40 - 12, "text"), ("Planned", 62, "num"), ("Actual", 62, "num"), ("Untaxed", 40, "check")],
                     6, f"{p}in", rh=18, defaults=INC, total={1, 2}, checked={(3, 3), (5, 3)})
        # calendar on right
        cx = M + leftw + 20; cwid = CW - leftw - 20
        P.text(cx, y, "NO-SPEND DAYS", F_BOLD, 8, GOLD)
        cell = cwid / 7
        for i, dname in enumerate(["M", "T", "W", "T", "F", "S", "S"]):
            P.text(cx + i * cell + cell / 2, y - 16, dname, F_BOLD, 7.5, MUTED, "center")
        weeks = calendar.Calendar(0).monthdayscalendar(YEAR, m + 1)
        ch = 22 if len(weeks) < 6 else 18.5
        days = []
        for wi, wk in enumerate(weeks):
            for di, dd in enumerate(wk):
                if dd:
                    bx = cx + di * cell; by = y - 22 - (wi + 1) * ch
                    P.text(bx + cell / 2, by + 14, str(dd), F_MONO, 6.5, MUTED, "center")
                    P.check(f"{p}_ns_{dd}", bx + cell / 2 - 5, by + 2, 10, tip=f"{MONTHS[m]} {dd}: no spending")
                    days.append(f"{p}_ns_{dd}")
        yc = y - 22 - len(weeks) * ch - 14
        P.text(cx, yc, "No-spend days", F_BODY, 9, MUTED)
        P.field(f"{p}_nscount", cx + cwid - 44, yc - 5, 44, 16, calc="+".join(f'C("{d}")' for d in days))
        y = min(yi, yc - 10) - 8
        # expenses
        P.text(M, y, "SPENDING", F_BOLD, 8, GOLD)
        ew = CW - 3 * 90 - 12
        y = P.table(M, y - 10, [("Category", ew, "text"), ("Planned", 90, "num"), ("Actual", 90, "num"),
                                ("Left (+) / over (-)", 90, "calc", lambda q: f'N("{q}1")-N("{q}2")')],
                    len(EXP), f"{p}ex", rh=16, defaults=EXP, total={1, 2, 3})
        # summary band
        P.box(M, y - 54, CW, 50, VAULT_SOFT)
        taxexpr = "(" + "+".join(f'(C("{p}in_{r}_3")?N("{p}in_{r}_2"):0)' for r in range(1, 7)) + ')*N("tax_rate")/100'
        sx = [(f"Income", f'N("{p}in_tot_2")', f"{p}_inc"), ("Spent", f'N("{p}ex_tot_2")', f"{p}_spent"),
              ("Tax pot", taxexpr, f"{p}_tax"),
              ("Left over", f'N("{p}in_tot_2")-N("{p}ex_tot_2")-N("{p}_tax")', f"{p}_left")]
        sw4 = (CW - 28 - 40) / 5
        for i, (l, e, n) in enumerate(sx):
            bx = M + 14 + i * (sw4 + 10)
            P.text(bx, y - 18, l.upper(), F_BOLD, 7.5, VAULT)
            P.field(n, bx, y - 44, sw4, 20, calc=e, size=11)
        bx = M + 14 + 4 * (sw4 + 10)
        P.text(bx, y - 18, "TO SAVINGS", F_BOLD, 7.5, GOLD)
        P.field(f"{p}_saved", bx, y - 44, sw4, 20, num=True, size=11, tip="What you moved to savings this month")
        y -= 70
        # checklist + notes
        P.text(M, y, "THIS MONTH I", F_BOLD, 8, GOLD)
        cl = ["Moved savings on payday", "Paid every bill on time", "Checked subscriptions", "Followed up on IOUs"]
        for i, t in enumerate(cl):
            P.check(f"{p}_cl_{i}", M, y - 18 - i * 17, 10)
            P.text(M + 16, y - 16 - i * 17, t, F_BODY, 9.5, INK)
        nx = M + CW * 0.42; nw = CW - CW * 0.42
        P.text(nx, y, "MY WIN THIS MONTH", F_BOLD, 8, GOLD)
        P.field(f"{p}_win", nx, y - 26, nw, 20, size=9.5)
        P.text(nx, y - 40, "NEXT MONTH I'LL", F_BOLD, 8, GOLD)
        P.field(f"{p}_next", nx, y - 66, nw, 20, size=9.5)
        assert y - 72 > 40, (path, MONTHS[m], y)

    # ---------------- 22. YEAR IN REVIEW ----------------
    y = P.page("Year in review", f"December {YEAR}",
               "Pour a cup of something nice. Look at what you did, not just what you didn't.")
    tw = (CW - 5 * 4) / 6
    heads = ["Month", "Income", "Spent", "Left over", "Saved", "No-spend days"]
    y -= 6
    for i, h in enumerate(heads):
        P.text(M + i * (tw + 4) + (2 if i == 0 else tw - 3), y, h, F_BOLD, 7.5, MUTED, "left" if i == 0 else "right")
    y -= 4
    for m in range(12):
        y -= 19
        P.text(M + 2, y + 4, MONTHS[m], F_BODY, 10, INK)
        for j, src in enumerate(["inc", "spent", "left", "saved", "nscount"]):
            P.field(f"yr_{m}_{j}", M + (j + 1) * (tw + 4), y, tw, 16, calc=f'N("m{m}_{src}")')
    y -= 22
    P.text(M + 2, y + 4, "Total", F_BOLD, 10, INK)
    for j in range(5):
        P.field(f"yr_tot_{j}", M + (j + 1) * (tw + 4), y, tw, 16, calc=SUM([f"yr_{m}_{j}" for m in range(12)]))
    y -= 30
    P.box(M, y - 56, CW, 52, VAULT)
    P.text(M + 16, y - 22, "GOAL REACHED", F_BOLD, 7.5, HexColor("#B9B2A3"))
    P.field("yr_goalpct", M + 16, y - 46, 90, 20, calc='N("goal_target")>0?N("tr_r_11")/N("goal_target")*100:0', size=12)
    P.text(M + 110, y - 40, "%", F_BOLD, 12, white)
    P.text(M + CW / 2, y - 22, "NET WORTH CHANGE", F_BOLD, 7.5, HexColor("#B9B2A3"))
    P.field("yr_nw", M + CW / 2, y - 46, 140, 20, calc='N("nw_chg")', size=12)
    y -= 74
    for lab, n in [("My proudest money move this year", "rv_proud"), ("The biggest leak I fixed", "rv_leak"),
                   ("What I'll do differently", "rv_diff"), (f"My savings goal for {YEAR+1}", "rv_next")]:
        P.text(M, y, lab.upper(), F_BOLD, 8, GOLD)
        P.field(n, M, y - 26, CW, 20, size=10)
        y -= 40

    P.save()


def cover(P, kicker, title_lines, sub, fields):
    """Dark cover in the TNN kit style."""
    c, W, H, M = P.c, P.W, P.H, P.M
    CW = W - 2 * M
    c.setFillColor(VAULT); c.rect(0, 0, W, H, stroke=0, fill=1)
    c.drawImage(LOGO, W - M - 64, H - M - 58, 64, 64, mask="auto")
    y = H - M - 6
    P.text(M, y, f"{BRAND.upper()}  ·  {kicker}", F_BOLD, 7.5, GOLD_BRIGHT)
    y -= 50
    for ln in title_lines:
        P.text(M, y, ln, F_DISP, 40, HexColor("#F5EFE3")); y -= 44
    c.setFillColor(GOLD_BRIGHT); c.rect(M, y + 18, 60, 2.6, stroke=0, fill=1)
    y = P.wrap(M, y - 6, sub, CW * 0.72, font=F_DISP_I, size=13, color=HexColor("#CFC8BA"), lead=19)
    y -= 46
    for lab, name in fields:
        P.text(M, y, lab, F_BOLD, 7.5, GOLD_BRIGHT)
        c.acroForm.textfield(name=name, tooltip=lab.title(), x=M, y=y - 30, width=CW * 0.68, height=22, value="",
                             fontName="Helvetica", fontSize=12, borderStyle="underlined", borderWidth=0.6,
                             borderColor=HexColor("#4A4D57"), fillColor=NIGHT_FIELD, textColor=white, forceBorder=True)
        P.meta[name] = {}
        y -= 62
    c.setStrokeColor(HexColor("#2E3038")); c.setLineWidth(0.5); c.line(M, 32, W - M, 32)
    c.drawImage(LOGO, M, 15.5, 14, 14, mask="auto")
    P.text(M + 19, 20, BRAND.upper(), F_BOLD, 7, HexColor("#F5EFE3"))
    P.text(W - M, 20, "Fill it on your phone or print it", F_BODY, 7.5, HexColor("#B9B2A3"), "right")


def currency_picker(P, x, y):
    P.c.acroForm.choice(name="cur", tooltip="Currency symbol", value="$", options=["$", "€", "£", "¥", "No symbol", "A$", "S$", "NZ$", "HK$", "C$", "Rs", "INR", "RM", "Rp", "PHP", "THB", "AED", "SAR", "ZAR", "CHF", "KRW"],
                        fieldFlags="combo edit", x=x, y=y, width=96, height=20, fontName="Helvetica", fontSize=11,
                        borderColor=VAULT, fillColor=PAPER, textColor=INK, borderWidth=0.8, forceBorder=True)
    P.meta["cur"] = {}


def build_leak_check(path, size):
    """Free lead magnet: one-page subscription leak check."""
    P = Planner(path, size)
    P.c.setTitle("The Subscription Leak Check")
    P.series = "FREE TOOL"
    P.docname = "Subscription Leak Check"
    c, W, H, M = P.c, P.W, P.H, P.M
    CW = W - 2 * M
    P.logo_top = True
    y = P.page("The Subscription Leak Check", "Free tool  ·  10 minutes",
               "Grab your last two bank or card statements. List every charge that repeats. Be honest about what you actually used. The totals add themselves up.")
    P.text(W - M - 104, y - 4, "Currency", F_BODY, 9, MUTED, "right")
    currency_picker(P, W - M - 96, y - 10)
    y -= 26
    sw = CW - 4 * 70 - 2 * 56 - 24
    y = P.table(M, y, [("Service", sw, "text"), ("Per month", 70, "num", 2), ("Per year", 70, "calc", lambda p: f'N("{p}1")*12', 2),
                       ("Used it last month?", 70, "check"), ("Cancel", 56, "check"),
                       ("Saves / year", 70, "calc", lambda p: f'C("{p}4")?N("{p}1")*12:0', 2), ("Done", 56, "check")],
                12, "lc", rh=20, total={1, 2, 5},
                defaults=["Video streaming", "Music", "Gym or fitness app", "Cloud storage", "News or magazines", "Shopping membership", "", "", "", "", "", ""])
    # result band
    P.box(M, y - 86, CW, 80, VAULT)
    cols = [("You pay every year", 'N("lc_tot_2")', "lc_year"), ("Cancelling saves", 'N("lc_tot_5")', "lc_save"),
            ("That's back each month", 'N("lc_tot_5")/12', "lc_month")]
    bw = (CW - 28 - 20) / 3
    for i, (l, e, n) in enumerate(cols):
        bx = M + 14 + i * (bw + 10)
        P.text(bx, y - 26, l.upper(), F_BOLD, 7.5, HexColor("#B9B2A3"))
        P.c.acroForm.textfield(name=n, tooltip=l, x=bx, y=y - 70, width=bw, height=30, value="", fontName="Helvetica", fontSize=16,
                               borderStyle="underlined", borderWidth=0.6, borderColor=HexColor("#B9B2A3"), fillColor=HexColor("#2B2B2B"),
                               textColor=white, forceBorder=True)
        P.meta[n] = dict(num=True, dec=2, calc=e); P.order.append(n)
    y -= 106
    P.text(M, y, "THREE RULES FOR KEEP OR CANCEL", F_BOLD, 8, GOLD)
    rules = ["Didn't use it last month? Cancel. You can rejoin in two minutes if you miss it.",
             "Would you sign up again today at this price? If not, cancel or downgrade.",
             "Two services doing the same job? Keep the one you open most."]
    y -= 18
    for r in rules:
        P.c.setFillColor(GOLD); P.c.circle(M + 4, y + 3, 2.2, stroke=0, fill=1)
        y = P.wrap(M + 14, y, r, CW - 14, size=10, color=INK) - 3
    y -= 8
    P.box(M, y - 82, CW, 82, GOLD_SOFT)
    P.text(M + 16, y - 24, "Found a leak? There are usually more.", F_DISP, 15, INK)
    P.wrap(M + 16, y - 42, f"Financial Planner {YEAR} runs this check across your whole budget: a savings goal that splits itself into monthly targets, spending leaks, idle money, money people owe you, and 12 monthly budgets that add themselves up.", CW - 32, size=9.5, color=INK)
    P.text(M + 16, y - 72, f"Get it at {SHOP}", F_BOLD, 10, VAULT)
    P.c.linkURL(f"https://{SHOP}", (M + 16, y - 76, M + 260, y - 62), relative=0)
    P.save()


if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else HERE
    build(os.path.join(out, f"Financial-Planner-{YEAR}-A4.pdf"), A4)
    build(os.path.join(out, f"Financial-Planner-{YEAR}-US-Letter.pdf"), LETTER)
    build_leak_check(os.path.join(out, "Subscription-Leak-Check-A4.pdf"), A4)
    build_leak_check(os.path.join(out, "Subscription-Leak-Check-US-Letter.pdf"), LETTER)
    print("built")
