// Les boutons Entrees / Sorties / Inverse changent-ils d'etat et de couleur ?
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const sc=src.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const boutons={};
const mkBtn=(id)=>({id,textContent:'',style:{},dataset:{},addEventListener(){}});
for(const id of ['btn-toggle-zz-entries','btn-toggle-zz-exits','btn-toggle-zz-invert',
                 'btn-toggle-zz2-entries','btn-toggle-zz2-exits','btn-toggle-zz2-invert'])
  boutons[id]=mkBtn(id);
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
global.document={documentElement:el(''),getElementById:(i)=>boutons[i]||el(''),
 querySelector:()=>el(''),querySelectorAll:()=>[el('')],addEventListener(){},createElement:()=>el(''),
 body:{appendChild(){},classList:{add(){},remove(){}}}};
global.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
global.navigator={userAgent:'node'};global.confirm=()=>true;global.alert=()=>{};
global.getComputedStyle=()=>({getPropertyValue:()=>''});
global.fetch=async()=>({ok:true,status:200,json:async()=>({})});
// on expose les fonctions internes pour pouvoir les appeler depuis le test
eval("var state;\n"+sc.replace('const state =','state =')+
  "\n;global.__t={toggleZZEntries,toggleZZExits,toggleZZInvert,"+
  "toggleZZ2Entries,toggleZZ2Exits,toggleZZ2Invert,updateZZToggleButtons};");
global.render=()=>{}; global.saveConfig=()=>{}; global.updateChips=()=>{};

let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

t('identifiants uniques dans la page',
  (src.match(/id="btn-toggle-zz-entries"/g)||[]).length===1 &&
  (src.match(/id="btn-toggle-zz2-entries"/g)||[]).length===1);

const paires=[
  ['zz','strat_zz',['toggleZZEntries','toggleZZExits','toggleZZInvert'],['showEntries','showExits','invertSignal']],
  ['zz2','strat_zz2',['toggleZZ2Entries','toggleZZ2Exits','toggleZZ2Invert'],['showEntries','showExits','invertSignal']],
];
for(const [pre,cle,fns,props] of paires){
  for(let k=0;k<3;k++){
    const b=boutons['btn-toggle-'+pre+'-'+['entries','exits','invert'][k]];
    __t.updateZZToggleButtons();
    const avantTxt=b.textContent, avantCol=b.style.color;
    __t[fns[k]]();
    const apresTxt=b.textContent, apresCol=b.style.color;
    t(pre.padEnd(4)+' '+['Entrées','Sorties','Inversé'][k].padEnd(8)+' change d etat',
      /OFF/.test(apresTxt)!==/OFF/.test(avantTxt), avantTxt+' -> '+apresTxt);
    t('     couleur differente', apresCol!==avantCol, avantCol+' -> '+apresCol);
    t('     gris quand eteint', !/OFF/.test(apresTxt) || apresCol==='#94A3B8', apresCol);
    __t[fns[k]]();  // remettre comme avant
  }
}
console.log('\n'+(ko===0?'Les boutons basculent et changent de couleur.':ko+' probleme(s).'));
