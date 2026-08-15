// La seconde unite de temps produit-elle vraiment des sorties differentes ?
const fs=require('fs');
const sc=fs.readFileSync('index.html','utf8').match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const vals={'bta-ent':'classique','bta-sens':'tel','bta-dir':'both','bta-modeap':'chrono',
 'bta-sor':'toutes','bta-rang':'1','bta-marge':'0.02','bta-unite':'BASE','bta-lev':'200',
 'bta-tp':'0','bta-frais':'0.02','bta-jours':'7','bta-capital':'100','bta-mmode':'croise',
 'bta-mpct':'50','bta-mbonus':'20','bta-opp':'toujours'};
const el=(v)=>({value:v,style:{},textContent:'',innerHTML:'',dataset:{},checked:false,
 classList:{add(){},remove(){},contains:()=>false,toggle(){}},
 getContext:()=>({measureText:()=>({width:10}),fillRect(){},clearRect(){},beginPath(){},moveTo(){},
  lineTo(){},stroke(){},fill(){},arc(){},save(){},restore(){},translate(){},rotate(){},scale(){},
  setLineDash(){},closePath(){},strokeRect(){},fillText(){}}),
 width:1000,height:600,addEventListener(){},querySelectorAll:()=>[],querySelector:()=>null,
 closest:()=>null,appendChild(){},removeChild(){},insertBefore(){},remove(){},setAttribute(){},
 getAttribute:()=>null,scrollIntoView(){},focus(){},click(){},children:[],childNodes:[],parentNode:null});
const c={}; for(const k in vals) c[k]=el(vals[k]);
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

const tout=JSON.parse(fs.readFileSync('candles_ok.json','utf8')).slice(0,8000);
state.data=tout; state.symbol='BTCUSDT'; state.tf=1;
state.indicators=state.indicators||{};
window.chargerHistorique=async()=>{};

const emp=(r)=>r?[r.trades,r.pnl.toFixed(2),r.liq].join('|'):'nul';

(async()=>{
  let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };
  const kk=state.indicators.kk_bis;

  console.log('A. Mode d origine : tf2 change, resultat identique ?');
  const a=[];
  for(const b of ['3','15','60']){
    kk.tf='1'; kk.tf2=b; kk.fusionTf2='off'; state.cache={};
    await window.__runBtInterne(); a.push(emp(window.__btDernier));
    console.log('   1m x '+b+'m : '+a[a.length-1]);
  }
  t('sans fusion, tf2 sans effet (comportement constate)', a[0]===a[1]&&a[1]===a[2]);

  console.log('\nB. Mode fusion union : tf2 doit changer le resultat');
  const u=[];
  for(const b of ['3','15','60']){
    kk.tf='1'; kk.tf2=b; kk.fusionTf2='union'; state.cache={};
    await window.__runBtInterne(); u.push(emp(window.__btDernier));
    console.log('   1m x '+b+'m : '+u[u.length-1]);
  }
  t('avec fusion, les resultats different', !(u[0]===u[1]&&u[1]===u[2]));
  t('au moins une combinaison differe du mode d origine', u.some((v,k)=>v!==a[k]),
    u.filter((v,k)=>v!==a[k]).length+' / '+u.length+' differentes');

  console.log('\nC. Nombre de sorties kk bis');
  for(const mode of ['off','union','accord']){
    kk.tf='1'; kk.tf2='15'; kk.fusionTf2=mode; state.cache={};
    const kb=getInd('kk_bis');
    console.log('   '+mode.padEnd(7)+' : '+((kb&&kb.exits)?kb.exits.length:0)+' sorties');
  }

  console.log('\n'+(ko===0?'La fusion fonctionne.':ko+' probleme(s).'));
})();
