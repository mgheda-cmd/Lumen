// Le montant du backtest suit-il la paire affichée ?
const fs=require('fs');
const sc=fs.readFileSync('index.html','utf8').match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const mkOpt=(t)=>({textContent:t});
const sel=(v,opts)=>({value:v,options:opts,style:{},textContent:'',innerHTML:''});
const inp=(v)=>({value:v,style:{},textContent:'',innerHTML:''});
const c={
 'bta-unite': sel('BASE',[mkOpt('BTC (taille)'), mkOpt('USDT (marge)')]),
 'bta-marge': inp('0.02'),
 'bta-lev':   inp('200'),
 'bta-paire-info': inp(''),
 'bta-mmode': inp('croise'), 'bta-lbl-mpct': {style:{}}, 'bta-lbl-mbonus': {style:{}}
};
const el=(v)=>({value:v,style:{},textContent:'',innerHTML:'',dataset:{},
 classList:{add(){},remove(){},contains:()=>false,toggle(){}},
 getContext:()=>({measureText:()=>({width:10}),fillRect(){},clearRect(){},beginPath(){},moveTo(){},
  lineTo(){},stroke(){},fill(){},arc(){},save(){},restore(){},translate(){},rotate(){},scale(){}}),
 width:1000,height:600,addEventListener(){},querySelectorAll:()=>[],querySelector:()=>null,
 closest:()=>null,appendChild(){},removeChild(){},insertBefore(){},remove(){},setAttribute(){},
 getAttribute:()=>null,scrollIntoView(){},focus(){},click(){},children:[],childNodes:[],parentNode:null});
global.window=global; global.requestAnimationFrame=()=>{}; global.cancelAnimationFrame=()=>{};
global.addEventListener=()=>{}; global.removeEventListener=()=>{};
global.document={documentElement:el(''),getElementById:(i)=>c[i]||el(''),querySelector:()=>el(''),
 querySelectorAll:()=>[el('')],addEventListener(){},createElement:()=>el(''),
 body:{appendChild(){},classList:{add(){},remove(){}}}};
global.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
global.navigator={userAgent:'node'}; global.confirm=()=>true; global.alert=()=>{};
global.getComputedStyle=()=>({getPropertyValue:()=>''});
global.fetch=async()=>({ok:true,status:200,json:async()=>({})});
eval("var state;\n"+sc.replace('const state =','state ='));

const PRIX={BTCUSDT:64500, ETHUSDT:3100, SOLUSDT:145, DOGEUSDT:0.21};
// livePrice interne lit state.data pour la paire courante et lastPrices sinon
function poser(paire){ state.symbol=paire; state.data=[{o:0,h:0,l:0,c:PRIX[paire],t:0}];
  try{ for(const k in PRIX) lastPrices[k]=PRIX[k]; }catch(e){} }

let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

poser('BTCUSDT');
window.majNotionnelRefBT();
t('notionnel de référence sur BTC', Math.abs(window.__btNotionnelRef-1290)<1, '$'+window.__btNotionnelRef);

for(const [paire, attenduLabel] of [['ETHUSDT','ETH'],['SOLUSDT','SOL'],['DOGEUSDT','DOGE']]){
  poser(paire);
  window.majPaireBT();
  const q=+c['bta-marge'].value;
  const notionnel=q*PRIX[paire];
  t('passage sur '+paire.padEnd(9)+' : unité renommée',
    c['bta-unite'].options[0].textContent.startsWith(attenduLabel),
    c['bta-unite'].options[0].textContent);
  t('   notionnel conservé ('+q+' '+attenduLabel+')',
    Math.abs(notionnel-1290)/1290 < 0.02, '$'+notionnel.toFixed(2));
}

// En USDT, le montant ne doit pas bouger
poser('BTCUSDT'); window.majPaireBT(true);
c['bta-unite'].value='USDT'; c['bta-marge'].value='50';
poser('ETHUSDT'); window.majPaireBT();
t('en mode USDT, le montant reste inchangé', c['bta-marge'].value==='50', c['bta-marge'].value);

console.log('\n'+(ko===0?'Le backtest suit la paire affichée.':ko+' problème(s).'));
