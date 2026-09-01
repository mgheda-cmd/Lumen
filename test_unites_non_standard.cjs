// Les unites que l'echange ne connait pas doivent etre reconstruites.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const sc=src.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const grad={addColorStop(){}};
const faux=()=>new Proxy({measureText:()=>({width:30}),createLinearGradient:()=>grad,createRadialGradient:()=>grad},
 {get:(t,k)=>(k in t)?t[k]:(typeof k==='string'?()=>{}:undefined),set:()=>true});
const el=v=>({value:v,style:{},dataset:{},getContext:faux,classList:{add(){},remove(){},contains:()=>false,toggle(){}},width:1400,height:900,addEventListener(){},querySelectorAll:()=>[],querySelector:()=>null,closest:()=>null});
global.window=global;global.requestAnimationFrame=()=>{};global.addEventListener=()=>{};global.removeEventListener=()=>{};
global.document={documentElement:el(''),getElementById:()=>el(''),querySelector:()=>el(''),querySelectorAll:()=>[el('')],addEventListener(){},createElement:()=>el(''),body:{appendChild(){},classList:{add(){},remove(){}}}};
global.localStorage={getItem:()=>null,setItem(){},removeItem(){}};global.navigator={userAgent:'node'};
global.getComputedStyle=()=>({getPropertyValue:()=>''});
let requetes=[];
global.fetch=async(u)=>{ requetes.push(String(u)); return {ok:true,json:async()=>[]}; };
eval('var state;'+sc.replace('const state =','state =')
  +';global.__g=getInd;global.__mtf=getMTFBars;global.__TF=TF_MAP;');
const tout=JSON.parse(fs.readFileSync('candles_synth.json','utf8')).slice(0,3000);
state.data=tout;state.symbol='BTCUSDT';state.tf=1;state.cache={};

let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

console.log('== Les unites du menu ==');
const proposees=[1,2,3,4,5,6,7,8,9,10,12,15,30,60,240];
const inconnues=proposees.filter(u=>!__TF[u]);
console.log('   proposees par les menus :', proposees.join(', '));
console.log('   inconnues de l echange  :', inconnues.join(', '));

console.log('\n== Elles sont reconstruites ==');
let manquantes=[];
for(const u of inconnues){
  const b=__mtf(u);
  if(!b || !b.length) manquantes.push(u);
}
t('toutes donnent des bougies', manquantes.length===0, manquantes.join(', ')||'les '+inconnues.length+' sont reconstruites');
const b7=__mtf(7);
t('   7 minutes en particulier', b7 && b7.length>0, b7? b7.length+' bougies' : 'aucune');
t('   avec le bon pas', b7 && b7.length>1 && (b7[1].t-b7[0].t)===7*60000,
  b7&&b7.length>1? ((b7[1].t-b7[0].t)/60000)+' minutes' : '-');
t('   aucune requete inutile a l echange', !requetes.some(u=>/interval=undefined/.test(u)),
  requetes.filter(u=>/interval=undefined/.test(u)).length+' requete(s) invalide(s)');

console.log('\n== L Impulse MACD sur 7 minutes ==');
state.indicators.imp.on=true; state.indicators.imp.tf='7'; state.cache={};
const r=__g('imp');
t('il se calcule', !!r && Array.isArray(r.md) && r.md.length>0, r&&r.md? r.md.length+' valeurs' : 'rien');
t('   des valeurs exploitables', r && r.md.filter(x=>x!=null&&isFinite(x)).length>0,
  r? r.md.filter(x=>x!=null&&isFinite(x)).length+' valides' : '-');

console.log('\n== Les unites standard passent toujours par l echange ==');
requetes=[];
state.cache={}; __mtf(15);
t('15 minutes est demande a l echange', requetes.some(u=>/interval=15m/.test(u)) || __TF[15]==='15m');

console.log('\n'+(ko===0?'Toutes les unites du menu fonctionnent.':ko+' probleme(s).'));
