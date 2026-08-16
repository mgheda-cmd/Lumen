// Greffe de la strategie MM : elle fonctionne, et nos ajouts sont intacts.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const sc=src.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const el=(v)=>({value:v,style:{},textContent:'',innerHTML:'',dataset:{},
 classList:{add(){},remove(){},contains:()=>false,toggle(){}},
 getContext:()=>({measureText:()=>({width:10}),fillRect(){},clearRect(){},beginPath(){},moveTo(){},
  lineTo(){},stroke(){},fill(){},arc(){},save(){},restore(){},translate(){},rotate(){},scale(){},
  setLineDash(){},closePath(){},strokeRect(){},fillText(){},roundRect(){},rect(){},clip(){}}),
 width:1000,height:600,addEventListener(){},querySelectorAll:()=>[],querySelector:()=>null,
 closest:()=>null,appendChild(){},removeChild(){},insertBefore(){},remove(){},setAttribute(){},
 getAttribute:()=>null,scrollIntoView(){},focus(){},click(){},children:[],childNodes:[],parentNode:null});
global.window=global;global.requestAnimationFrame=()=>{};global.cancelAnimationFrame=()=>{};
global.addEventListener=()=>{};global.removeEventListener=()=>{};
global.document={documentElement:el(''),getElementById:()=>el(''),querySelector:()=>el(''),
 querySelectorAll:()=>[el('')],addEventListener(){},createElement:()=>el(''),
 body:{appendChild(){},classList:{add(){},remove(){}}}};
global.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
global.navigator={userAgent:'node'};global.confirm=()=>true;global.alert=()=>{};
global.getComputedStyle=()=>({getPropertyValue:()=>''});
global.fetch=async()=>({ok:true,status:200,json:async()=>({})});
eval("var state;\n"+sc.replace('const state =','state ='));
const tout=JSON.parse(fs.readFileSync('candles_ok.json','utf8')).slice(0,8000);
state.data=tout; state.symbol='BTCUSDT'; state.tf=1; state.cache={};

let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

t('reglages strat_mm presents', !!state.indicators.strat_mm);
t('   seuil a -75', state.indicators.strat_mm && state.indicators.strat_mm.oscThreshold===-75,
  String(state.indicators.strat_mm&&state.indicators.strat_mm.oscThreshold));
t('schema de reglages', /strat_mm:\{title:'Stratégie Ligne Principale/.test(src));
t('entree de menu', /data-ind="strat_mm"/.test(src));
t('calcul branche', /if\(key==='strat_mm'\)/.test(src));
t('dessin branche', /vis\('strat_mm'\)/.test(src));

const r=getInd('strat_mm');
t('la strategie calcule', !!r, r?Object.keys(r).join(', ').slice(0,70):'nul');
if(r){
  t('   des signaux', Array.isArray(r.signals), (r.signals||[]).length+' signaux');
  t('   une ligne principale', Array.isArray(r.line)&&r.line.some(v=>v!=null));
  t('   une direction', Array.isArray(r.dir));
  t('   creux et sommets', Array.isArray(r.creuxList)&&Array.isArray(r.sommetsList),
    (r.creuxList||[]).length+' creux, '+(r.sommetsList||[]).length+' sommets');
  const L=(r.signals||[]).filter(x=>x.dir===1).length;
  const S=(r.signals||[]).filter(x=>x.dir===-1).length;
  t('   longs et shorts', true, L+' longs, '+S+' shorts');
}

// nos ajouts sont-ils intacts ?
console.log();
for(const [nom,marq] of [['veille Telegram','demarrerVeille'],['filtre notifications','mexcOnly'],
  ['cases Z.Z. 2','__zz2Rejets'],['kk bis 2','kk_bis2:{'],['balayage fusionne','balayerKKFusion'],
  ['trace du backtest','drawMarquesBT'],['lignes verticales','__zzVerticales'],
  ['entrees sur creux','ENTREE_ACHAT'],['frais 0,02','BTC: 0.02'],['liquidations','liq: nbLiq'],
  ['adaptation paire','majPaireBT'],['renfort de marge','renforcerMargeIsolee']])
  t('conserve : '+nom, src.includes(marq));

console.log('\n'+(ko===0?'La strategie MM est greffee, rien de perdu.':ko+' probleme(s).'));
