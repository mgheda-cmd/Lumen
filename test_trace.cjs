// Le tracé lit-il bien les trades du moteur, et dessine-t-il au bon endroit ?
const fs=require('fs');
const sc=fs.readFileSync('index.html','utf8').match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const vals={'bta-ent':'classique','bta-sens':'tel','bta-dir':'both','bta-modeap':'chrono',
 'bta-sor':'toutes','bta-rang':'1','bta-marge':'0.02','bta-unite':'BASE','bta-lev':'200',
 'bta-tp':'0','bta-frais':'0.02','bta-jours':'7','bta-capital':'100','bta-mmode':'croise',
 'bta-mpct':'50','bta-mbonus':'20','bta-opp':'toujours'};
const appels=[];
const faux=()=>({measureText:()=>({width:30}),roundRect(){},fillRect(){},clearRect(){},beginPath(){},
 moveTo(){},lineTo(){},stroke(){},fill(){},arc(){},save(){},restore(){},translate(){},
 rotate(){},scale(){},setLineDash(){},closePath(){},strokeRect(){},
 fillText:(t,x,y)=>appels.push({t,x,y})});
const el=(v)=>({value:v,style:{},textContent:'',innerHTML:'',dataset:{},checked:false,
 classList:{add(){},remove(){},contains:()=>false,toggle(){}},getContext:faux,
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
state.data=tout; state.symbol='BTCUSDT'; state.tf=1; state.cache={};
window.chargerHistorique=async()=>{};
global.toast=()=>{};

(async()=>{
  let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

  await window.__runBtInterne();
  const L=window.__btDernier.liste;
  t('le moteur expose ses trades', L && L.length>0, (L||[]).length+' trades');

  // contexte de dessin factice
  global.ctx = faux();
  global.xOf = (i)=> i*0.5;
  global.W = 1200; global.AXIS_W = 60; global.placeBadge = (x,w,y)=>y;
  const yOf = (p)=> 600 - (p-60000)/20;

  appels.length=0;
  window.__btMarks = true;
  window.drawMarquesBT(0, tout.length-1, yOf);

  const titresE = appels.filter(a=>/^BT (\u25b2 ACHAT|\u25bc VENTE) #/.test(a.t));
  const titresS = appels.filter(a=>/^BT SORTIE /.test(a.t));
  const pxE = appels.filter(a=>/^entree /.test(a.t));
  const pxS = appels.filter(a=>/^sortie /.test(a.t));
  const motifs = appels.filter(a=>/(Seuil \+ pente|Divergence|Entr\u00e9e oppos\u00e9e|TP \+|Liquidation)/.test(a.t));
  t('un titre d entrée avec numéro par trade', titresE.length===L.length, titresE.length+' / '+L.length);
  t('un titre de sortie avec PnL par trade', titresS.length===L.length, titresS.length+' / '+L.length);
  t('prix d entrée affiché', pxE.length===L.length, pxE.length+' / '+L.length);
  t('prix de sortie affiché', pxS.length===L.length, pxS.length+' / '+L.length);
  t('motif de sortie affiché', motifs.length===L.length, motifs.length+' / '+L.length);
  const pnl = titresS;

  // les valeurs affichees correspondent-elles aux nets du moteur ?
  let ecarts=0;
  L.forEach((tr,k)=>{
    const attendu='BT SORTIE '+(tr.net>=0?'+':'')+tr.net.toFixed(2)+' $';
    const trouve=pnl[k] ? pnl[k].t : '';
    if(trouve!==attendu) ecarts++;
  });
  t('les montants tracés = les nets du moteur', ecarts===0, ecarts+' écart(s)');

  // hors de la vue : rien ne doit etre dessine
  appels.length=0;
  window.drawMarquesBT(7990, 7999, yOf);
  t('trades hors vue non dessinés', appels.length < L.length, appels.length+' éléments');

  console.log('\n'+(ko===0?'Le tracé suit le moteur.':ko+' problème(s).'));
})();
