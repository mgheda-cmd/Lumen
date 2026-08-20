// Ajouts Squeeze Pro sur l'indicateur existant, chacun debrayable.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const sc=src.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const grad={addColorStop(){}};
const ecrits=[]; const remplis=[];
const faux=()=>new Proxy({measureText:()=>({width:30}),createLinearGradient:()=>grad,
 createRadialGradient:()=>grad,fillText:(t)=>{if(typeof t==='string')ecrits.push(t);},
 arc(){ remplis.push(this.fillStyle); }},
 {get:(t,k)=>(k in t)?t[k]:(typeof k==='string'?()=>{}:undefined),set:(t,k,v)=>{t[k]=v;return true;}});
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
eval('var state;'+sc.replace('const state =','state =')+';global.__calc=calc;global.__g=getInd;');
const tout=JSON.parse(fs.readFileSync('candles_ok.json','utf8')).slice(0,6000);
state.data=tout;state.symbol='BTCUSDT';state.tf=1;state.cache={};

let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

console.log('== Intensite ==');
const r=__calc.sqzMom(tout,{});
t('le rapport de largeurs est calcule', Array.isArray(r.ratio)&&r.ratio.length===tout.length);
t('   valeurs plausibles', r.ratio.every(x=>isFinite(x)&&x>0),
  'min '+Math.min(...r.ratio).toFixed(2)+' max '+Math.max(...r.ratio).toFixed(2));
t('le niveau est calcule', Array.isArray(r.niveau));
const rep={0:0,1:0,2:0,3:0};
for(const n of r.niveau) rep[n]++;
/* Le niveau 3 exige un rapport sous 0,50. Mesuré sur cet échantillon : le
   rapport descend au minimum à 0,55 pendant les compressions, médiane 0,87.
   Le niveau 3 n'apparaît donc jamais ici — c'est le marché, pas un défaut.
   On vérifie que l'échelle fonctionne, pas qu'elle sature. */
t('   les niveaux se repartissent', rep[1]>0&&rep[2]>0,
  'n1 '+rep[1]+', n2 '+rep[2]+', n3 '+rep[3]+', hors compression '+rep[0]);
let coherent=true;
for(let i=0;i<tout.length;i++){
  if(r.sqzOn[i] && r.niveau[i]===0) coherent=false;
  if(!r.sqzOn[i] && r.niveau[i]!==0) coherent=false;
  if(r.niveau[i]===3 && !(r.ratio[i]<0.5)) coherent=false;
  if(r.niveau[i]===1 && !(r.ratio[i]>=0.8)) coherent=false;
}
t('   niveau coherent avec le rapport', coherent);

console.log('\n== Statistiques ==');
const sansStats=__calc.sqzMom(tout,{});
t('absentes si non demandees', sansStats.stats===null);
const avec=__calc.sqzMom(tout,{showStats:true});
t('presentes si demandees', !!avec.stats);
if(avec.stats){
  const st=avec.stats;
  t('   nombre de compressions', st.nombre>=0, st.nombre+' sur '+st.fenetre+' bougies');
  t('   duree moyenne', st.dureeMoy>=0, st.dureeMoy.toFixed(1)+' bougies');
  t('   part haussiere entre 0 et 100', st.partHaussiere>=0&&st.partHaussiere<=100,
    Math.round(st.partHaussiere)+' %');
  t('   ampleur en ATR', st.ampliMoy>=0, st.ampliMoy.toFixed(2)+' ATR');
}
/* Une fenêtre plus large voit forcément plus de compressions. */
const p200=__calc.sqzMom(tout,{showStats:true,statsLookback:200}).stats;
const p6000=__calc.sqzMom(tout,{showStats:true,statsLookback:6000}).stats;
t('la fenetre agit', p6000.nombre>p200.nombre,
  p200.nombre+' sur 200 -> '+p6000.nombre+' sur 6000');
t('   defaut assez large pour dire quelque chose',
  __calc.sqzMom(tout,{showStats:true}).stats.nombre>0,
  __calc.sqzMom(tout,{showStats:true}).stats.nombre+' compressions au reglage par defaut');

console.log('\n== Debrayable ==');
t('interrupteur intensite au panneau', /k:'showSqzLevels'/.test(src));
t('interrupteur statistiques au panneau', /k:'showStats'/.test(src));
t('fenetre reglable au panneau', /k:'statsLookback'/.test(src));
t('intensite active par defaut', /showSqzLevels:true/.test(src));
t('statistiques eteintes par defaut', /showStats:false/.test(src));
t('le dessin respecte l interrupteur', /ind\.showSqzLevels !== false/.test(src));
t('   les pastilles aussi', /if \(showSqzLevels && on1 && res1\.niveau\)/.test(src));
t('   les statistiques aussi', /ind\.showStats === true/.test(src));

console.log('\n== Rien de casse ==');
t('sorties d origine conservees',
  ['val','sqzOn','sqzOff','noSqz','colorKey'].every(k=>r[k]!==undefined));
const t0=Date.now(); __calc.sqzMom(tout,{}); const ms=Date.now()-t0;
t('cout inchange sans statistiques', ms<200, ms+' ms');

console.log('\n'+(ko===0?'Les ajouts Pro sont en place et debrayables.':ko+' probleme(s).'));
