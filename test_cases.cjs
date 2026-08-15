// Les cases a cocher des pastilles Z.Z. 2 : dessin, clic, memoire.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const sc=src.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const store={};
const el=(v)=>({value:v,style:{},textContent:'',innerHTML:'',dataset:{},
 classList:{add(){},remove(){},contains:()=>false,toggle(){}},
 getContext:()=>({measureText:()=>({width:10}),fillRect(){},clearRect(){},beginPath(){},moveTo(){},
  lineTo(){},stroke(){},fill(){},arc(){},save(){},restore(){},translate(){},rotate(){},scale(){},
  setLineDash(){},closePath(){},strokeRect(){},fillText(){},roundRect(){},rect(){}}),
 width:1000,height:600,addEventListener(){},querySelectorAll:()=>[],querySelector:()=>null,
 closest:()=>null,appendChild(){},removeChild(){},insertBefore(){},remove(){},setAttribute(){},
 getAttribute:()=>null,scrollIntoView(){},focus(){},click(){},children:[],childNodes:[],parentNode:null});
global.window=global;global.requestAnimationFrame=()=>{};global.cancelAnimationFrame=()=>{};
global.addEventListener=()=>{};global.removeEventListener=()=>{};
global.document={documentElement:el(''),getElementById:()=>el(''),querySelector:()=>el(''),
 querySelectorAll:()=>[el('')],addEventListener(){},createElement:()=>el(''),
 body:{appendChild(){},classList:{add(){},remove(){}}}};
global.localStorage={getItem:(k)=>store[k]??null,setItem:(k,v)=>{store[k]=v;},removeItem:(k)=>{delete store[k];}};
global.navigator={userAgent:'node'};global.confirm=()=>true;global.alert=()=>{};
global.getComputedStyle=()=>({getPropertyValue:()=>''});
global.fetch=async()=>({ok:true,status:200,json:async()=>({})});
eval("var state;\n"+sc.replace('const state =','state ='));
global.render=()=>{}; global.toast=()=>{};

let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

t('etat des rejets initialise', typeof window.__zz2Rejets==='object');
t('bascule disponible', typeof window.zz2BasculerRejet==='function');
t('remise a zero disponible', typeof window.zz2ViderRejets==='function');

const uid='B1786000000000';
window.zz2BasculerRejet(uid);
t('un clic ecarte l entree', window.__zz2Rejets[uid]===1);
t('   enregistre dans le navigateur', /B1786000000000/.test(store['lumen_zz2_rejets']||''));
window.zz2BasculerRejet(uid);
t('un second clic la remet', !window.__zz2Rejets[uid]);

window.zz2BasculerRejet('B1');window.zz2BasculerRejet('B2');window.zz2BasculerRejet('B3');
t('plusieurs entrees ecartees', Object.keys(window.__zz2Rejets).length===3);
window.zz2ViderRejets();
t('remise a zero', Object.keys(window.__zz2Rejets).length===0);

t('case dessinee dans les pastilles', /window\.__zz2Cases\.push/.test(src));
t('   zone de clic elargie', /w: cSz \+ 8, h: cSz \+ 8/.test(src));
t('clic teste avant le deplacement',
  src.indexOf('window.__zz2Cases.find') < src.indexOf('state.wantMode&&wantTapAt'));
t('liste videe a chaque rendu', /__zz2Cases = \[\]/.test(src));
t('entree ecartee estompee', /if\(ecarte\) ctx\.globalAlpha = 0\.45/.test(src));
t('repere sur l horodatage, pas l index', /const uid2 = 'B' \+ \(sig\.t != null/.test(src));

// La case ne doit pas ouvrir les reglages
t('le tactile teste les cases aussi',
  /if\(Array\.isArray\(window\.__zz2Cases\)\)\{[\s\S]{0,200}tx>=c\.x/.test(src));
t('   avant tout le reste au toucher',
  src.indexOf('tx>=c.x') < src.indexOf('state.wantMode&&wantTapAt(tx,ty)'));
t('la zone des reglages epargne la case', /x: x - bw \/ 2 \+ 26, y: by, w: bw - 26/.test(src));
(function(){
  const i0=src.indexOf('function drawZZ2Signals');
  let j0=src.indexOf('{',i0), prof=0, k0=j0;
  while(k0<src.length){ if(src[k0]==='{')prof++; else if(src[k0]==='}'){prof--; if(prof===0)break;} k0++; }
  const corps=src.slice(i0,k0+1);
  const cles=(corps.match(/key: '(strat_zz2?)'/g)||[]);
  t('les bulles Z.Z. 2 ouvrent LEURS reglages',
    cles.length===4 && cles.every(c=>/strat_zz2/.test(c)), cles.join(' '));
})();
t('Z.Z. 2 a son schema de reglages', /strat_zz2:\{/.test(src));

console.log('\n'+(ko===0?'Les cases fonctionnent.':ko+' probleme(s).'));
