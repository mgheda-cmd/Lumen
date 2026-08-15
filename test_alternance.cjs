// Deux entrees de meme sens qui se suivent : possible ou pas ?
const fs=require('fs');
const sc=fs.readFileSync('index.html','utf8').match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
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
global.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
global.navigator={userAgent:'node'};global.confirm=()=>true;global.alert=()=>{};
global.getComputedStyle=()=>({getPropertyValue:()=>''});
global.fetch=async()=>({ok:true,status:200,json:async()=>({})});
eval("var state;\n"+sc.replace('const state =','state ='));

const tout=JSON.parse(fs.readFileSync('candles_ok.json','utf8')).slice(0,8000);
state.data=tout; state.symbol='BTCUSDT'; state.tf=1; state.cache={};

const sigs=getInd('strat_zz')||[];
const ent=sigs.filter(x=>!x.isExit);
console.log('signaux bruts de computeZZSignals : '+ent.length+' entrees\n');

let suites=0, ex=[];
for(let i=0;i+1<ent.length;i++){
  if(ent[i+1].dir===ent[i].dir){
    suites++;
    if(ex.length<4) ex.push('#'+(ent[i].num||'?')+' et #'+(ent[i+1].num||'?')+
      ' — '+(ent[i].dir===1?'ACHAT':'VENTE')+' aux bougies '+ent[i].i+' et '+ent[i+1].i);
  }
}
console.log('entrees consecutives de MEME sens : '+suites+' / '+(ent.length-1));
ex.forEach(e=>console.log('   '+e));
console.log('\n'+(suites===0
  ? "L'alternance est respectee dans le moteur : l'affichage montre autre chose."
  : "Le moteur lui-meme produit des doublons de sens."));
