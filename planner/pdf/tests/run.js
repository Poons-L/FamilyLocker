// Acrobat-like engine: inputs are set, then the calculation order (/CO) runs once, then format scripts render display text.
const fs=require("fs");
const [,,specF,inputsF,outF]=process.argv;
const spec=JSON.parse(fs.readFileSync(specF)); const inputs=JSON.parse(fs.readFileSync(inputsF));
const F={};
for(const [n,x] of Object.entries(spec.fields)){ F[n]={name:n,type:x.ft==="/Btn"?"checkbox":(x.ft==="/Ch"?"combobox":"text"),value:x.ft==="/Btn"?(x.v.replace("/","")||"Off"):x.v,calc:x.calc,fmt:x.fmt,val:x.val}; }
for(const [n,v] of Object.entries(inputs)){ if(!F[n]) throw new Error("unknown input "+n); F[n].value=v; }
const doc={getField:n=>F[n]||null, get numFields(){return Object.keys(F).length}, getNthFieldName:i=>Object.keys(F)[i]};
function num(v){ if(v===""||v==null) return NaN; return Number(String(v).replace(/,/g,"")); }
global.AFNumber_Format=(nDec,sep,neg,cs,cur,pre)=>{ let v=num(event.value); if(isNaN(v)){event.value="";return;}
  const s=v<0?"-":""; v=Math.abs(v); const t=v.toLocaleString("en-US",{minimumFractionDigits:nDec,maximumFractionDigits:nDec});
  event.value=s+(pre?cur:"")+t+(pre?"":cur); };
global.AFNumber_Keystroke=()=>{};
const passes=+process.argv[5]||1;
for(let p=0;p<passes;p++) for(const n of spec.co){ const f=F[n]; global.event={value:f.value,target:f}; (function(){eval(f.calc)}).call(doc); f.value=event.value; }
const out={values:{},display:{}};
for(const [n,f] of Object.entries(F)){ out.values[n]=f.value; if(f.fmt&&f.value!==""){ global.event={value:f.value,target:f}; (function(){eval(f.fmt)}).call(doc); out.display[n]=event.value; } }
fs.writeFileSync(outF,JSON.stringify(out));
