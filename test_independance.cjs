// Les pastilles doivent continuer a fonctionner meme si les indicateurs
// dont elles se servent sont retires du graphique.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const sc=src.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const grad={addColorStop(){}};
const dessins=[];
const faux=()=>new Proxy({measureText:()=>({width:30}),createLinearGradient:()=>grad,
 createRadialGradient:()=>grad,fillText:(t)=>{if(typeof t==='string')dessins.push(t);}},
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
eval('var state;'+sc.replace('const state =','state ='));
const tout=JSON.parse(fs.readFileSync('candles_ok.json','utf8')).slice(0,6000);
state.data=tout;state.symbol='BTCUSDT';state.tf=1;

let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };
const cpt=(r)=>r&&r.signals?r.signals.length:(Array.isArray(r)?r.filter(x=>!x.isExit).length:0);
const mesure=()=>{ state.cache={}; const a=cpt(getInd('strat_mm'));
  state.cache={}; const b=cpt(getInd('strat_zz'));
  state.cache={}; const c=cpt(getInd('strat_zz2'));
  return [a,b,c]; };

const base=mesure();
t('avec tout allume', base.every(x=>x>0), 'MM '+base[0]+', Z.Z. '+base[1]+', Z.Z.2 '+base[2]);

for(const k of ['kk_bis2','imp','two_ind','kk_bis','rsi','macd'])
  if(state.indicators[k]) state.indicators[k].on=false;
const eteint=mesure();
t('avec tout eteint, memes signaux', JSON.stringify(base)===JSON.stringify(eteint),
  'MM '+eteint[0]+', Z.Z. '+eteint[1]+', Z.Z.2 '+eteint[2]);

// cas extreme : les reglages disparaissent completement
const sauve={};
for(const k of ['kk_bis2','imp','two_ind']){ sauve[k]=state.indicators[k]; delete state.indicators[k]; }
let survit=true, err='';
try{ state.cache={}; getInd('strat_mm'); }catch(e){ survit=false; err=e.message.slice(0,70); }
t('MM survit a la disparition des reglages', survit, err||'aucune exception');
for(const k in sauve) state.indicators[k]=sauve[k];

// Z.Z. 2 doit lire SES reglages, pas ceux de Z.Z.
t('Z.Z. 2 ne lit plus les reglages de Z.Z.',
  !/function computeZZ2Signals[\s\S]{0,20000}?state\.indicators\.strat_zz[^2]/.test(src));

// le dessin n'est conditionne qu'a son propre indicateur
t('dessin MM independant', /if\(vis\('strat_mm'\)\)/.test(src));
t('dessin Z.Z. independant', /if\(vis\('strat_zz'\)\) drawZZSignals/.test(src));
t('dessin Z.Z. 2 independant', /if\(vis\('strat_zz2'\)\) drawZZ2Signals/.test(src));

console.log('\n'+(ko===0?'Les pastilles vivent sans leurs indicateurs sources.':ko+' probleme(s).'));
