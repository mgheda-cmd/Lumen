// Les trades du moteur se chevauchent-ils ? On regarde les intervalles [iE, iS].
const fs=require('fs');
const sc=fs.readFileSync('index.html','utf8').match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const champs={'bta-ent':'classique','bta-sens':'tel','bta-dir':'both','bta-app':'chrono',
 'bta-sortie':'toutes','bta-rang':'1','bta-marge':'0.02','bta-unite':'BASE','bta-lev':'200',
 'bta-tp':'0','bta-frais':'0.02','bta-jours':'7','bta-capital':'100','bta-mmode':'croise',
 'bta-mpct':'50','bta-mbonus':'20'};
const el=(v)=>({value:v,style:{},textContent:'',innerHTML:'',dataset:{},
 classList:{add(){},remove(){},contains:()=>false,toggle(){}},
 getContext:()=>({measureText:()=>({width:10}),fillRect(){},clearRect(){},beginPath(){},moveTo(){},
  lineTo(){},stroke(){},fill(){},arc(){},save(){},restore(){},translate(){},rotate(){},scale(){}}),
 width:1000,height:600,addEventListener(){},querySelectorAll:()=>[],querySelector:()=>null,
 closest:()=>null,appendChild(){},removeChild(){},insertBefore(){},remove(){},setAttribute(){},
 getAttribute:()=>null,scrollIntoView(){},focus(){},click(){},children:[],childNodes:[],parentNode:null});
const c={}; for(const k in champs) c[k]=el(champs[k]);
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

const bougies=JSON.parse(fs.readFileSync('candles_ok.json','utf8')).slice(0,10000);
state.data=bougies; state.symbol='BTCUSDT'; state.tf=1; state.cache={};
window.chargerHistorique=async()=>{};

(async()=>{
  await window.__runBtInterne();
  const r=window.__btDernier;
  if(!r||!r.liste){ console.log('pas de resultat'); return; }
  const L=r.liste.slice().sort((a,b)=>a.iE-b.iE);
  console.log(r.trades+' trades sur '+bougies.length+' bougies  |  duree moyenne '+
    Math.round(L.reduce((a,t)=>a+(t.iS-t.iE),0)/L.length)+' min\n');

  let chevauche=0, pireSimul=1, exemples=[];
  for(let i=0;i<L.length;i++){
    let simul=1;
    for(let j=0;j<L.length;j++){
      if(i===j) continue;
      if(L[j].iE < L[i].iS && L[j].iS > L[i].iE) simul++;
    }
    if(simul>1){ chevauche++; if(simul>pireSimul) pireSimul=simul; }
  }
  for(let i=0;i+1<L.length;i++){
    if(L[i+1].iE < L[i].iS && exemples.length<3)
      exemples.push('#'+L[i].num+' ['+L[i].iE+'\u2192'+L[i].iS+'] et #'+L[i+1].num+' ['+L[i+1].iE+'\u2192'+L[i+1].iS+']');
  }
  console.log('trades impliques dans un chevauchement : '+chevauche+' / '+L.length);
  console.log('nombre maximal de positions simultanees : '+pireSimul);
  if(exemples.length){ console.log('\nexemples :'); exemples.forEach(e=>console.log('   '+e)); }
  // Les entrees alternent-elles bien de sens ?
  let memeSens=0, opposes=0;
  for(let i=0;i+1<L.length;i++){
    if(L[i+1].dir===L[i].dir) memeSens++;
    if(L[i+1].iE < L[i].iS){ if(L[i+1].dir!==L[i].dir) opposes++; }
  }
  console.log('\nentrees consecutives de MEME sens : '+memeSens+' (0 attendu)');
  console.log('chevauchements ou la 2e entree est de sens OPPOSE : '+opposes);

  console.log('\n'+(chevauche===0
    ? 'Aucun chevauchement : les trades se suivent bout a bout.'
    : 'Le moteur ouvre des positions avant d\'avoir ferme les precedentes.'));
})();
