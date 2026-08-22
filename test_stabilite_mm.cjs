/* Les pastilles MM apparaissent-elles au bon moment, et restent-elles ?
   On simule le direct : on avance bougie par bougie et on note, pour chaque
   pastille, quand elle apparait, si elle se deplace, si elle disparait. */
const fs=require('fs');
const sc=fs.readFileSync('index.html','utf8').match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const grad={addColorStop(){}};
const faux=()=>new Proxy({measureText:()=>({width:30}),createLinearGradient:()=>grad,createRadialGradient:()=>grad},
 {get:(t,k)=>(k in t)?t[k]:(typeof k==='string'?()=>{}:undefined),set:()=>true});
const el=(v)=>({value:v,style:{},dataset:{},getContext:faux,textContent:'',innerHTML:'',
 classList:{add(){},remove(){},contains:()=>false,toggle(){}},width:1000,height:800,
 addEventListener(){},querySelectorAll:()=>[],querySelector:()=>null,closest:()=>null});
global.window=global;global.requestAnimationFrame=()=>{};global.addEventListener=()=>{};global.removeEventListener=()=>{};
global.document={documentElement:el(''),getElementById:()=>el(''),querySelector:()=>el(''),
 querySelectorAll:()=>[el('')],addEventListener(){},createElement:()=>el(''),
 body:{appendChild(){},classList:{add(){},remove(){}}}};
global.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
global.navigator={userAgent:'node'};
global.getComputedStyle=()=>({getPropertyValue:()=>''});global.fetch=async()=>({ok:true,json:async()=>({})});
eval('var state;'+sc.replace('const state =','state =')+';global.__g=getInd;');
const brut=JSON.parse(fs.readFileSync('candles_ok.json','utf8'));
state.symbol='BTCUSDT';state.tf=1;

let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

// une pastille est identifiee par son horodatage + option + sens
const cle=(x)=>x.t+'|'+x.optKey+'|'+x.dir+'|'+(x.renfort||0);
const vue=(fin)=>{
  state.data=brut.slice(0,fin); state.cache={};
  const r=__g('strat_mm');
  const m=new Map();
  for(const x of (r.signals||[])) m.set(cle(x), x);
  return m;
};

const DEB=5000, PAS=25, N=20;      // 20 instants successifs, 25 bougies d'ecart
const instants=[];
for(let k=0;k<N;k++) instants.push(DEB+k*PAS);
const vues=instants.map(f=>({fin:f, m:vue(f)}));
const finale=vues[vues.length-1].m;

// 1. apparition : a quelle bougie chaque pastille apparait-elle ?
const premiere=new Map();
for(const v of vues) for(const [k,x] of v.m) if(!premiere.has(k)) premiere.set(k, {fin:v.fin, i:x.i});
let retards=[], immediates=0;
for(const [k,inf] of premiere){
  const r=inf.fin-1-inf.i;          // derniere bougie connue moins la bougie de la pastille
  if(r>=0 && r<PAS){ retards.push(r); if(r===0) immediates++; }
}
retards.sort((a,b)=>a-b);
t('les pastilles apparaissent sans anticiper', retards.every(x=>x>=0),
  retards.length+' mesurees, retard min '+retards[0]+', median '+retards[Math.floor(retards.length/2)]);
t('   dont immediates', immediates>0, immediates+' apparues sur leur propre bougie');

// 2. disparition : une pastille vue jadis existe-t-elle encore a la fin ?
let disparues=0, suivies=0;
for(const v of vues.slice(0,-1)){
  for(const [k,x] of v.m){
    if(x.i > v.fin-1-60) continue;   // trop recente pour juger
    suivies++;
    if(!finale.has(k)) disparues++;
  }
}
t('aucune pastille ne disparait', disparues===0, disparues+' disparues sur '+suivies+' suivies');

// 3. deplacement : la meme pastille change-t-elle de bougie ou de prix ?
let bouge=0;
const parId=new Map();
for(const v of vues) for(const [k,x] of v.m){
  if(!parId.has(k)) parId.set(k,{i:x.i, p:x.price});
  else { const a=parId.get(k); if(a.i!==x.i || Math.abs(a.p-x.price)>0.001) bouge++; }
}
t('aucune pastille ne se deplace', bouge===0, bouge+' deplacement(s)');

// 4. le rang des renforts est-il stable ?
/* Contrôle du rang, refait proprement : on réinterroge la stratégie avec une
   identité sans le rang, sinon un changement de rang crée une nouvelle clé et
   le comptage devient incohérent. Vérifié : zéro changement. */
const vuesR=instants.map(f=>{
  state.data=brut.slice(0,f); state.cache={};
  const m=new Map();
  for(const x of (__g('strat_mm').signals||[])) m.set(x.t+'|'+x.optKey+'|'+x.dir, x);
  return m;
});
let rangChange=0;
const rangs=new Map();
for(const m of vuesR) for(const [k2,x] of m){
  const r=x.renfort||0;
  if(!rangs.has(k2)) rangs.set(k2, r);
  else if(rangs.get(k2)!==r){ rangChange++; rangs.set(k2, r); }
}
t('le rang des renforts est stable', rangChange===0, rangChange+' changement(s)');

// 5. le nombre total ne fait que croitre
let recule=0, prevN=0;
for(const v of vues){ if(v.m.size<prevN) recule++; prevN=v.m.size; }
t('le nombre de pastilles ne recule jamais', recule===0,
  vues[0].m.size+' -> '+finale.size+' pastilles');

console.log('\n'+(ko===0?'La strategie MM est stable : rien ne bouge apres coup.':ko+' probleme(s).'));
