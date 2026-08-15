// Deux lancements identiques donnent-ils le meme resultat ?
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
window.chargerHistorique=async()=>{};

const empreinte=(r)=>r? [r.trades,r.pnl.toFixed(4),r.liq,r.dd.toFixed(4),r.wr.toFixed(2)].join(' | '):'nul';

(async()=>{
  console.log('A. Donnees strictement identiques, trois lancements');
  const res=[];
  for(let k=0;k<3;k++){
    state.data=tout.slice(); state.symbol='BTCUSDT'; state.tf=1; state.cache={};
    await window.__runBtInterne();
    res.push(empreinte(window.__btDernier));
    console.log('   lancement '+(k+1)+' : '+res[k]);
  }
  console.log('   -> '+(res[0]===res[1]&&res[1]===res[2] ? 'IDENTIQUES' : 'DIFFERENTS'));

  console.log('\nB. Sans vider le cache entre les lancements');
  const res2=[];
  state.data=tout.slice(); state.symbol='BTCUSDT'; state.tf=1; state.cache={};
  for(let k=0;k<2;k++){
    await window.__runBtInterne();
    res2.push(empreinte(window.__btDernier));
    console.log('   lancement '+(k+1)+' : '+res2[k]);
  }
  console.log('   -> '+(res2[0]===res2[1] ? 'IDENTIQUES' : 'DIFFERENTS'));

  console.log('\nC. La fenetre glisse : meme duree, debut et fin decales');
  const N=8000;
  for(const dec of [0,5,15,60,240]){
    state.data=tout.slice(dec,dec+N-240); state.cache={};
    await window.__runBtInterne();
    const r=window.__btDernier;
    console.log('   decalage '+String(dec).padStart(4)+' min : '+empreinte(r));
  }

  console.log('\nD. La periode chargee varie en longueur');
  for(const n of [7600,7800,8000]){
    state.data=tout.slice(0,n); state.cache={};
    await window.__runBtInterne();
    console.log('   '+n+' bougies : '+empreinte(window.__btDernier));
  }
})();
