const { chromium } = require('playwright');
const D = __dirname, img = p => `file://${D}/${p}`;
const css = `
*{box-sizing:border-box;margin:0}
body{font-family:Gelasio,Georgia,serif;color:#F5EFE3;background:#111318;overflow:hidden}
.h{font-family:Gelasio,Georgia,serif;font-weight:700;color:#F5EFE3;letter-spacing:-.005em;line-height:1.08}
.k{font-family:Gelasio,Georgia,serif;font-weight:700;letter-spacing:.28em;text-transform:uppercase;color:#D2A85C}
.pg{background:#F8F2E7;border:5px solid #D2A85C;box-shadow:0 30px 60px -10px rgba(0,0,0,.6);display:block}
.badge{display:inline-flex;align-items:center;gap:12px;background:transparent;border:2px solid #D2A85C;border-radius:999px;padding:12px 26px;font-style:italic;font-size:30px;color:#F5EFE3}
.badge i{display:none}
.brand{position:absolute;bottom:44px;left:90px;font-weight:700;font-size:24px;color:#D2A85C;letter-spacing:.28em}
.callout{position:absolute;background:#1A1C22;color:#F5EFE3;border:3px solid #D2A85C;padding:26px 32px;box-shadow:0 20px 40px -10px rgba(0,0,0,.6)}
.callout b{display:block;font-family:Gelasio,Georgia,serif;font-size:60px;color:#D2A85C;line-height:1.05}
.callout span{font-size:28px;font-style:italic;color:#CFC8BA}
p{font-style:italic}
`;
const slides = {
hero: [2000,1600,`
<div style="position:absolute;left:90px;top:130px;width:860px">
 <div class="k" style="font-size:28px">Editable PDF planner</div>
 <div class="h" style="font-size:150px;margin-top:22px">Financial<br>Planner<br><span style="color:#D2A85C">2027</span></div>
 <p style="font-size:40px;line-height:1.35;margin-top:34px;color:#CFC8BA;max-width:760px">Hit your savings goal, cut waste, and see where every bit of money goes.</p>
 <div style="display:flex;flex-wrap:wrap;gap:16px;margin-top:46px;max-width:820px">
  <span class="badge"><i></i>Totals calculate for you</span><span class="badge"><i></i>Any currency</span>
  <span class="badge"><i></i>26 pages</span><span class="badge"><i></i>A4 + US Letter</span></div>
</div>
<img class="pg" src="${img('f11.png')}" style="position:absolute;width:760px;right:70px;top:250px;transform:rotate(4deg)">
<img class="pg" src="${img('f01.png')}" style="position:absolute;width:700px;right:430px;top:170px;transform:rotate(-5deg)">
<div class="brand"><span style="display:inline-flex;align-items:center;gap:16px"><img src="${img('logo.png')}" style="width:54px;height:54px">THE NICHELESS NICHE</span></div>`],
inside: [2000,1600,`
<div style="position:absolute;left:90px;top:80px"><div class="k" style="font-size:28px">What's inside</div>
<div class="h" style="font-size:96px;margin-top:14px">26 pages, one calm money system</div></div>
<div style="position:absolute;left:90px;right:90px;top:330px;display:grid;grid-template-columns:repeat(5,1fr);gap:34px 30px">
${[['f03','Savings goal + milestones'],['fdash','Year at a glance'],['f05','Subscriptions + leaks'],['fbig','Big yearly costs'],['fusual','My usual month'],
   ['f08','Owed to me + scripts'],['f09','Savings tracker'],['fdebt','Debt payoff plan'],['f11','12 monthly budgets'],['f23','Year in review']]
  .map(([f,l])=>`<div><img class="pg" src="${img(f+'.png')}" style="width:100%"><div style="font-size:26px;font-weight:700;margin-top:14px;color:#F5EFE3">${l}</div></div>`).join('')}
</div><div class="brand"><span style="display:inline-flex;align-items:center;gap:16px"><img src="${img('logo.png')}" style="width:54px;height:54px">THE NICHELESS NICHE</span></div>`],
subs: [2000,1600,`
<div style="position:absolute;left:90px;top:150px;width:780px">
 <div class="k" style="font-size:28px">Subscription audit</div>
 <div class="h" style="font-size:104px;margin-top:20px">Find the money hiding in your subscriptions</div>
 <p style="font-size:38px;line-height:1.4;margin-top:34px;color:#CFC8BA">Tick what you used last month. Tick what to cancel. The yearly saving adds itself up.</p>
</div>
<img class="pg" src="${img('f05.png')}" style="position:absolute;width:900px;right:90px;top:90px">
<div class="callout" style="left:560px;bottom:200px"><b>$1,373</b><span>a year back, in one evening</span></div>
<div class="brand"><span style="display:inline-flex;align-items:center;gap:16px"><img src="${img('logo.png')}" style="width:54px;height:54px">THE NICHELESS NICHE</span></div>`],
monthly: [2000,1600,`
<div style="position:absolute;left:90px;top:80px;width:1820px">
 <div class="k" style="font-size:28px">Set up once, then ten minutes a month</div>
 <div class="h" style="font-size:96px;margin-top:14px">Type it once. The rest adds up.</div></div>
<img class="pg" src="${img('f11.png')}" style="position:absolute;width:820px;left:90px;top:330px">
<img class="pg" src="${img('fusual.png')}" style="position:absolute;width:820px;right:90px;top:330px">
<div class="callout" style="left:770px;top:1150px;max-width:460px"><b>Side income?</b><span>Tick it as untaxed and the planner sets tax aside for you</span></div>
<div class="brand"><span style="display:inline-flex;align-items:center;gap:16px"><img src="${img('logo.png')}" style="width:54px;height:54px">THE NICHELESS NICHE</span></div>`],
owed: [2000,1600,`
<div style="position:absolute;left:90px;top:150px;width:800px">
 <div class="k" style="font-size:28px">Owed to me</div>
 <div class="h" style="font-size:104px;margin-top:20px">Get back what you're owed, kindly</div>
 <p style="font-size:38px;line-height:1.4;margin-top:34px;color:#CFC8BA">Log every IOU, tick when you've reminded and when you're paid. Three ready-made scripts, gentle, clear and firm, make asking easy.</p>
</div>
<img class="pg" src="${img('f08.png')}" style="position:absolute;width:900px;right:90px;top:90px">
<div class="brand"><span style="display:inline-flex;align-items:center;gap:16px"><img src="${img('logo.png')}" style="width:54px;height:54px">THE NICHELESS NICHE</span></div>`],
how: [2000,1600,`
<div style="position:absolute;left:90px;top:100px;right:90px">
 <div class="k" style="font-size:28px">How it works</div>
 <div class="h" style="font-size:104px;margin-top:14px">Instant download. Fill in on any computer.</div>
 <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:40px;margin-top:90px">
 ${[['1','Download','Get the A4 and US Letter files right after purchase.'],['2','Open in Adobe Acrobat Reader','Free on Windows, Mac, iPad and Android.'],['3','Type, tick and save','Pick your currency. Gold boxes total themselves.']]
  .map(([n,h,p])=>`<div style="background:#1A1C22;border:2px solid #3A3226;padding:50px 44px"><div style="width:84px;height:84px;border-radius:50%;background:#D2A85C;color:#111318;font-size:44px;font-weight:700;display:grid;place-items:center">${n}</div><div class="h" style="font-size:52px;margin-top:34px">${h}</div><p style="font-size:34px;line-height:1.4;margin-top:18px;color:#CFC8BA">${p}</p></div>`).join('')}
 </div>
 <div style="margin-top:70px;background:#1A1C22;border-left:6px solid #D2A85C;padding:40px 48px;color:#CFC8BA;font-size:32px;line-height:1.45">
  <b>Good to know:</b> automatic totals need a PDF app that supports form calculations, such as Adobe Acrobat Reader. In some browsers you can type in every box, but totals won't update. Digital product, no physical item ships. Educational tool, not financial advice.</div>
</div><div class="brand"><span style="display:inline-flex;align-items:center;gap:16px"><img src="${img('logo.png')}" style="width:54px;height:54px">THE NICHELESS NICHE</span></div>`],
cover_gumroad: [1280,720,`
<div style="position:absolute;left:60px;top:90px;width:600px">
 <div class="k" style="font-size:18px">Editable PDF planner</div>
 <div class="h" style="font-size:92px;margin-top:14px">Financial Planner <span style="color:#D2A85C">2027</span></div>
 <p style="font-size:26px;line-height:1.35;margin-top:22px;color:#CFC8BA">Savings goal, subscriptions, spending leaks, idle money, IOUs and 12 monthly budgets. Totals calculate for you.</p>
</div>
<img class="pg" src="${img('f11.png')}" style="position:absolute;width:400px;right:50px;top:110px;transform:rotate(4deg)">
<img class="pg" src="${img('f01.png')}" style="position:absolute;width:380px;right:270px;top:70px;transform:rotate(-5deg)">`],
square: [1080,1080,`
<div style="position:absolute;left:70px;top:80px;width:940px">
 <div class="k" style="font-size:24px">Editable PDF planner</div>
 <div class="h" style="font-size:104px;margin-top:16px">Financial Planner <span style="color:#D2A85C">2027</span></div>
 <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:30px">
  <span class="badge" style="font-size:24px;padding:10px 20px">Totals calculate for you</span><span class="badge" style="font-size:24px;padding:10px 20px">Any currency</span><span class="badge" style="font-size:24px;padding:10px 20px">26 pages</span></div>
</div>
<img class="pg" src="${img('f11.png')}" style="position:absolute;width:520px;right:60px;top:470px;transform:rotate(4deg)">
<img class="pg" src="${img('f05.png')}" style="position:absolute;width:500px;left:80px;top:500px;transform:rotate(-4deg)">`],
leak: [1080,1080,`

<div style="position:absolute;left:70px;top:80px;width:520px">
 <div class="k" style="font-size:22px;color:#D2A85C">Free tool · 10 minutes</div>
 <div class="h" style="font-size:84px;color:#fff;margin-top:16px">The Subscription Leak Check</div>
 <p style="font-size:30px;line-height:1.4;margin-top:26px;color:#CFC8BA">List every repeat charge. Tick what you didn't use. See what cancelling puts back in your pocket.</p>
 <div style="margin-top:34px;display:inline-block;background:#D2A85C;color:#111318;font-weight:700;font-size:26px;border-radius:999px;padding:12px 24px;white-space:nowrap">Example: $1,255 a year back</div>
</div>
<img class="pg" src="${img('fleak.png')}" style="position:absolute;width:470px;right:-30px;top:150px;transform:rotate(5deg)">
<div style="position:absolute;left:70px;bottom:50px;font-weight:700;font-size:20px;letter-spacing:.12em;color:#D2A85C"><span style="display:inline-flex;align-items:center;gap:16px"><img src="${img('logo.png')}" style="width:54px;height:54px">THE NICHELESS NICHE</span></div>`],
bundle: [1080,1080,`
<div style="position:absolute;left:70px;top:80px;width:940px">
 <div class="k" style="font-size:22px">Bundle · Best deal</div>
 <div class="h" style="font-size:96px;margin-top:16px">2027 Life Plan: <span style="color:#D2A85C">Career + Money</span></div>
 <p style="font-size:30px;line-height:1.4;margin-top:24px;color:#CFC8BA;max-width:860px">Decide your next career move and fund it. Two fillable planners that work together.</p>
</div>
<div style="position:absolute;left:70px;top:560px;width:400px;height:430px;background:#111318;border:5px solid #D2A85C;color:#fff;padding:40px 36px;transform:rotate(-4deg);box-shadow:0 30px 60px -20px rgba(20,20,20,.35)">
 <div class="k" style="font-size:18px;color:#D2A85C">Planner 1</div>
 <div class="h" style="font-size:56px;color:#fff;margin-top:14px">2027 Career Plan</div>
 <p style="font-size:26px;line-height:1.4;margin-top:18px;color:#CFC8BA">Stay, fix or go. Decide with evidence, then move.</p></div>
<img class="pg" src="${img('f01.png')}" style="position:absolute;width:380px;right:90px;top:470px;transform:rotate(4deg)">
<div style="position:absolute;left:70px;bottom:40px;font-weight:700;font-size:20px;letter-spacing:.12em;color:#D2A85C"><span style="display:inline-flex;align-items:center;gap:16px"><img src="${img('logo.png')}" style="width:54px;height:54px">THE NICHELESS NICHE</span></div>`],
thumb: [600,600,`

<img class="pg" src="${img('f11.png')}" style="position:absolute;width:300px;right:-40px;top:150px;transform:rotate(6deg)">
<div style="position:absolute;left:44px;top:60px"><img src="${img('logo.png')}" style="width:64px;height:64px;display:block;margin-bottom:18px"><div class="k" style="font-size:16px;color:#D2A85C">Editable PDF</div>
<div class="h" style="font-size:72px;color:#fff;margin-top:12px">Financial<br>Planner<br><span style="color:#D2A85C">2027</span></div></div>`]
};
(async()=>{
  const b=await chromium.launch();
  for(const [name,[w,h,body]] of Object.entries(slides)){
    const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:1});
    const f=`${D}/slide-${name}.html`; require('fs').writeFileSync(f,`<html><head><meta charset="utf-8"><style>${css}</style></head><body style="width:${w}px;height:${h}px;position:relative">${body}</body></html>`);
    await p.goto('file://'+f,{waitUntil:'load'});
    await p.screenshot({path:`${D}/out-${name}.png`}); await p.close();
  }
  await b.close(); console.log('done');
})();
