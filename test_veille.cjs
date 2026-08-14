// Test de bout en bout : vrais signaux Z.Z. sur vraies bougies.
const fs=require('fs');
const sc=fs.readFileSync('index.html','utf8').match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const vals={'bta-ent':'classique','bta-sens':'tel','bta-dir':'both','bta-modeap':'chrono',
 'bta-sor':'toutes','bta-rang':'1','bta-marge':'0.02','bta-unite':'BASE','bta-lev':'200',
 'bta-tp':'0','bta-frais':'0.02','bta-jours':'7','bta-capital':'100','bta-mmode':'croise',
 'bta-mpct':'50','bta-mbonus':'20','bta-opp':'toujours'};
const el=(v)=>({value:v,style:{},textContent:'',innerHTML:'',dataset:{},checked:false,
 classList:{add(){},remove(){},contains:()=>false,toggle(){}},
 getContext:()=>({measureText:()=>({width:10}),fillRect(){},clearRect(){},beginPath(){},moveTo(){},
  lineTo(){},stroke(){},fill(){},arc(){},save(){},restore(){},translate(){},rotate(){},scale(){}}),
 width:1000,height:600,addEventListener(){},querySelectorAll:()=>[],querySelector:()=>null,
 closest:()=>null,appendChild(){},removeChild(){},insertBefore(){},remove(){},setAttribute(){},
 getAttribute:()=>null,scrollIntoView(){},focus(){},click(){},children:[],childNodes:[],parentNode:null});
const c={}; for(const k in vals) c[k]=el(vals[k]);
const store={'lumen-phone-notifs':JSON.stringify({telegramToken:'123:ABC',telegramChatId:'999'})};
global.window=global; global.requestAnimationFrame=()=>{}; global.cancelAnimationFrame=()=>{};
global.addEventListener=()=>{}; global.removeEventListener=()=>{};
global.document={documentElement:el(''),getElementById:(i)=>c[i]||el(''),querySelector:()=>el(''),
 querySelectorAll:()=>[el('')],addEventListener(){},createElement:()=>el(''),
 body:{appendChild(){},classList:{add(){},remove(){}}}};
global.localStorage={getItem:(k)=>store[k]??null,setItem:(k,v)=>{store[k]=v;},removeItem:(k)=>{delete store[k];}};
global.navigator={userAgent:'node'}; global.confirm=()=>true; global.alert=()=>{};
global.getComputedStyle=()=>({getPropertyValue:()=>''});
const envois=[];
global.fetch=async(url,opt)=>{
  if(String(url).includes('api.telegram.org')){
    try{ envois.push(JSON.parse(opt.body).text); }catch(e){}
    return {ok:true,status:200,json:async()=>({ok:true})};
  }
  return {ok:true,status:200,json:async()=>({})};
};
eval("var state;\n"+sc.replace('const state =','state ='));

const tout=JSON.parse(fs.readFileSync('candles_ok.json','utf8')).slice(0,8000);
state.data=tout; state.symbol='BTCUSDT'; state.tf=1; state.cache={};
window.chargerHistorique=async()=>{};

(async()=>{
  // 1. On demande au moteur ou sont les vrais signaux
  await window.__runBtInterne();
  const trades=(window.__btDernier&&window.__btDernier.liste)||[];
  if(!trades.length){ console.log('aucun trade, test impossible'); return; }
  console.log(trades.length+' trades reels reperes par le moteur\n');

  let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

  // 2. On rejoue la veille en avancant les bougies autour des 3 premiers trades
  envois.length=0;
  state.data=tout.slice(0,trades[0].iE);
  window.demarrerVeille(false);
  const annonce=envois.length; envois.length=0;
  t('annonce de demarrage envoyee', annonce===1);

  let entrees=0, sorties=0;
  for(const tr of trades.slice(0,3)){
    for(let k=tr.iE; k<=tr.iS+2 && k<tout.length; k++){
      state.data=tout.slice(0,k+1); state.cache={};
      window.verifierVeille();
    }
  }
  entrees=envois.filter(m=>/ENTR/.test(m)).length;
  sorties=envois.filter(m=>/SORTIE/.test(m)).length;

  t('entrees notifiees', entrees>=1, entrees+' entree(s)');
  t('sorties notifiees', sorties>=1, sorties+' sortie(s)');
  t('pas de deluge de doublons', envois.length<=12, envois.length+' message(s) au total');

  const ex=envois.find(m=>/ENTR/.test(m));
  if(ex){ console.log('\nExemple de message :\n'+ex.replace(/<[^>]+>/g,'')); }

  console.log('\n'+(ko===0?'La veille emet sur de vrais signaux.':ko+' probleme(s).'));
})();
