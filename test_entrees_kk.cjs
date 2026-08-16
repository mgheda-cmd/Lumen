// Pastilles d'entree ACHAT de kk bis : creux sous le seuil puis passage au vert.
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

for(const cle of ['kk_bis','kk_bis2']){
  state.indicators[cle].tf='chart'; state.cache={};
  const r=getInd(cle);
  const E=r.entries||[];
  t(cle+' produit des entrees', E.length>0, E.length+' entree(s)');
  if(!E.length) continue;
  t('   toutes en achat', E.every(x=>x.dir===1&&x.type==='ENTREE_ACHAT'));

  // verifier chaque entree contre les donnees
  let mauvais=0, sansCreux=0, pasVert=0;
  const idx=new Map(); r.net.forEach((v,i)=>idx.set(tout[i]?tout[i].t:null,i));
  for(const en of E){
    const j=idx.get(en.t);
    if(j==null){ mauvais++; continue; }
    // au moment de l entree la ligne doit passer au-dessus du signal
    const vert = r.net[j]>r.signal[j];
    const vertAvant = r.signal[j-1]!=null && r.net[j-1]>r.signal[j-1];
    if(!(vert && !vertAvant)) pasVert++;
    // un creux sous le seuil doit preceder
    const jc=idx.get(en.creux);
    const L=+state.indicators[cle].pivotLen||3;
    if(jc==null || !(r.net[jc]<=r.lo[jc]) || j<=jc+L) sansCreux++;
  }
  t('   la ligne vire au vert a l entree', pasVert===0, pasVert+' ecart(s)');
  t('   un creux sous le seuil precede', sansCreux===0, sansCreux+' ecart(s)');
  t('   horodatages retrouves', mauvais===0);

  // le creux est-il recent ?
  const cool=+state.indicators[cle].cool||3;
  const fen=Math.max(20,cool*6);
  let tropVieux=0;
  for(const en of E){
    const j=idx.get(en.t), jc=idx.get(en.creux);
    if(j!=null&&jc!=null&&j-jc>fen) tropVieux++;
  }
  t('   creux dans la fenetre de '+fen+' bougies', tropVieux===0, tropVieux+' trop vieux');
}

t('le dessin des entrees existe', /S\(K,'showEntries'\) !== false && Array\.isArray\(res\.entries\)/.test(src));
t('   pastille verte sous la courbe',
  /const col = '#10B981';/.test(src) && /const by = cy \+ 8;/.test(src));
t('   creux confirme avant l entree', /j > creuxArme \+ L/.test(src));

console.log('\n'+(ko===0?'La regle d entree fonctionne.':ko+' probleme(s).'));
