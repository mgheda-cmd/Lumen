(async()=>{
// Alma SD SuperTrend : plusieurs unites de temps, dont 30 secondes.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const sc=src.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const requetes=[];
const grad={addColorStop(){}};
const faux=()=>new Proxy({measureText:()=>({width:30}),createLinearGradient:()=>grad,createRadialGradient:()=>grad},
 {get:(t,k)=>(k in t)?t[k]:(typeof k==='string'?()=>{}:undefined),set:()=>true});
const el=v=>({value:v,style:{},dataset:{},getContext:faux,classList:{add(){},remove(){},contains:()=>false,toggle(){}},width:1400,height:900,addEventListener(){},querySelectorAll:()=>[],querySelector:()=>null,closest:()=>null});
global.window=global;global.requestAnimationFrame=()=>{};global.addEventListener=()=>{};global.removeEventListener=()=>{};
global.document={documentElement:el(''),getElementById:()=>el(''),querySelector:()=>el(''),querySelectorAll:()=>[el('')],addEventListener(){},createElement:()=>el(''),body:{appendChild(){},classList:{add(){},remove(){}}}};
global.localStorage={getItem:()=>null,setItem(){},removeItem(){}};global.navigator={userAgent:'node'};
global.getComputedStyle=()=>({getPropertyValue:()=>''});
const brut=JSON.parse(fs.readFileSync('candles_synth.json','utf8'));
// on simule Binance : des bougies d'une seconde
global.fetch=async(u)=>{ requetes.push(String(u));
  const m=/limit=(\d+)/.exec(String(u)); const n=m?+m[1]:500;
  const e=/endTime=(\d+)/.exec(String(u)); let fin=e?+e[1]:Date.now();
  const rows=[];
  for(let i=n-1;i>=0;i--){ const t=fin-i*1000; const p=77000+Math.sin(t/60000)*80;
    rows.push([t,p,p+5,p-5,p+2,10]); }
  return {ok:true,json:async()=>rows}; };
eval('var state;'+sc.replace('const state =','state =')
  +';global.__g=getInd;global.__fine=getFineBars;global.__ram=ramenerSurGraphique;');
state.data=brut.slice(0,3000);state.symbol='BTCUSDT';state.market='futures';state.tf=1;state.cache={};
global.render=()=>{};

let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

console.log('== Le reglage ==');
t('champ unite de temps present', /almasd:\{title:'Alma SD SuperTrend',fields:\[\{k:'tf'/.test(src));
t('   30 secondes propose', /\{v:'0\.5',t:'30 secondes'\}/.test(src));
t('   et les unites superieures', /\{v:'240',t:'4 heures'\}/.test(src));
t('   defaut sur le graphique', /almasd:\{on:true,tf:'chart'/.test(src));

console.log('\n== Unite superieure ==');
state.indicators.almasd.tf='5'; state.cache={};
const r5=__g('almasd');
t('le calcul repond', !!(r5 && Array.isArray(r5.line)), r5&&r5.line? r5.line.length+' valeurs' : 'rien');
t('   ramene sur les bougies affichees', r5 && r5.line.length===state.data.length,
  r5? r5.line.length+'/'+state.data.length : '-');

console.log('\n== 30 secondes ==');
state.indicators.almasd.tf='0.5'; state.cache={};
const premier=__g('almasd');
t('premier appel : chargement lance', requetes.some(u=>/interval=1s/.test(u)),
  requetes.filter(u=>/interval=1s/.test(u)).length+' requete(s) de bougies d une seconde');
await new Promise(r=>setTimeout(r,300));
const fines=__fine(30);
t('les bougies de 30 s arrivent', Array.isArray(fines)&&fines.length>0, fines? fines.length+' bougies' : 'aucune');
t('   au bon pas', fines&&fines.length>1 && (fines[1].t-fines[0].t)===30000,
  fines&&fines.length>1? ((fines[1].t-fines[0].t)/1000)+' s' : '-');
state.cache={};
const r30=__g('almasd');
t('   l indicateur se calcule dessus', !!(r30&&Array.isArray(r30.line)&&r30.line.length===state.data.length),
  r30&&r30.line? r30.line.length+' valeurs' : 'rien');

console.log('\n== La remise sur le graphique ==');
const srcTest=[{t:0},{t:1000},{t:2000}];
const resTest={line:[10,20,30],dir:[1,1,-1]};
const dTest=[{t:0},{t:500},{t:1000},{t:1500},{t:2000},{t:2500}];
const out=__ram(srcTest,resTest,dTest);
t('une valeur par bougie affichee', out.line.length===6, JSON.stringify(out.line));
t('   la derniere valeur connue est reportee', out.line[1]===10 && out.line[3]===20 && out.line[5]===30);

console.log('\n'+(ko===0?'L Alma SD tourne sur l unite choisie, 30 secondes comprises.':ko+' probleme(s).'));
})();
