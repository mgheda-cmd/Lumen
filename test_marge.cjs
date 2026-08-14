// Verifie le renforcement de marge de bout en bout, sans toucher a MEXC.
const fs=require('fs');
const html=fs.readFileSync('index.html','utf8');
const sc=html.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
let script="var state;\n"+sc.replace('const state =','state =');

const el={getContext:()=>({measureText:()=>({width:10}),fillRect(){},clearRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},fill(){},arc(){},save(){},restore(){},translate(){},rotate(){},scale(){}}),
 width:1000,height:600,style:{},dataset:{},value:'',classList:{add(){},remove(){},contains:()=>false,toggle(){}},
 addEventListener(){},querySelectorAll:()=>[],querySelector:()=>null,closest:()=>null,appendChild(){},removeChild(){},
 insertBefore(){},remove(){},setAttribute(){},getAttribute:()=>null,innerHTML:'',textContent:'',scrollIntoView(){},focus(){},click(){},children:[],childNodes:[],parentNode:null};

const champs={'live-ex-marginpct':{value:'50'},'live-ex-token':{value:'jeton'},
 'live-ex-apikey':{value:''},'live-ex-apisecret':{value:''}};
global.window=global; global.requestAnimationFrame=()=>{}; global.cancelAnimationFrame=()=>{};
global.addEventListener=()=>{}; global.removeEventListener=()=>{};
global.document={documentElement:el,getElementById:id=>champs[id]||el,querySelector:()=>el,
 querySelectorAll:()=>[el],addEventListener(){},createElement:()=>el,body:{appendChild(){},classList:el.classList}};
global.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
global.navigator={userAgent:'node'}; global.confirm=()=>true; global.alert=()=>{};
global.getComputedStyle=()=>({getPropertyValue:()=>''});
eval(script);
console.log('1. Chargement : OK');

// Etat du compte simule
window.__mexcEquityUsdt = 100;   // capital total
window.__mexcAvailUsdt  = 90;    // disponible

const scenarios=[
 {nom:'position isolee, marge 6,45 -> cible 50', pos:{symbol:'BTC_USDT',openType:1,positionId:'P1',im:6.45}, dispo:90},
 {nom:'marge deja a 60, rien a faire',            pos:{symbol:'BTC_USDT',openType:1,positionId:'P2',im:60},   dispo:90},
 {nom:'position en croisee -> refus',             pos:{symbol:'BTC_USDT',openType:2,positionId:'P3',im:6.45}, dispo:90},
 {nom:'disponible faible -> plafonnement',        pos:{symbol:'BTC_USDT',openType:1,positionId:'P4',im:6.45}, dispo:10},
 {nom:'position absente -> refus',                pos:null,                                                   dispo:90},
];

(async()=>{
 for(const sc of scenarios){
  window.__mexcAvailUsdt = sc.dispo;
  window.getRealMexcFuturesOpenPositions = async()=> sc.pos? [sc.pos] : [];
  let envoye=null;
  global.fetch=async(u,o)=>{ envoye=JSON.parse(o.body);
    return {ok:true,status:200,json:async()=>({success:true,data:{code:0}})}; };
  const r=await window.renforcerMargeIsolee({serviceUrl:'https://x/api',lumenToken:'t',
    symbol:'BTC_USDT',margeCible:100*0.5});
  const p=envoye?envoye.params:null;
  console.log('   '+sc.nom.padEnd(42)+' -> '+(r.success?'ok':'refus')+
    (p?('  ADD '+p.amount+' $ sur '+p.positionId):(r.error?('  ('+r.error+')'):'  (aucun appel)')));
 }
})();
