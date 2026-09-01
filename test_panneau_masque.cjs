// Le panneau ne doit exister que si l'on a lance le balayage.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const sc=src.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const grad={addColorStop(){}};
const faux=()=>new Proxy({measureText:()=>({width:30}),createLinearGradient:()=>grad,createRadialGradient:()=>grad},
 {get:(t,k)=>(k in t)?t[k]:(typeof k==='string'?()=>{}:undefined),set:()=>true});
const zone={innerHTML:'',style:{display:'none'}};
const boutons={};
const el=v=>({value:v,style:{},dataset:{},getContext:faux,textContent:'',innerHTML:'',onclick:null,
 classList:{add(){},remove(){},contains:()=>false,toggle(){}},width:1000,height:800,
 addEventListener(){},querySelectorAll:()=>[],querySelector:()=>null,closest:()=>null});
global.window=global;global.requestAnimationFrame=()=>{};global.addEventListener=()=>{};global.removeEventListener=()=>{};
global.document={documentElement:el(''),
 getElementById:i=> i==='panneau-strat' ? zone : (boutons[i]=boutons[i]||el('')),
 querySelector:()=>el(''),querySelectorAll:()=>[el('')],addEventListener(){},createElement:()=>el(''),
 body:{appendChild(){},classList:{add(){},remove(){}}}};
const store={};
global.localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;},removeItem:k=>{delete store[k];}};
global.navigator={userAgent:'node'};
global.getComputedStyle=()=>({getPropertyValue:()=>''});global.fetch=async()=>({ok:true,json:async()=>({})});
eval('var state;'+sc.replace('const state =','state ='));

let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

console.log('== Au chargement ==');
t('masque dans la page', /id="panneau-strat"[^>]*display:none/.test(src));
t('   plus de message d attente permanent', !/Balayage en attente…<\/div>/.test(src));

console.log('== Sans balayage ==');
window.__balayageMM=null; window.__stratEnCours=false;
window.majPanneauStrat();
t('le panneau reste efface', zone.style.display==='none', zone.style.display);
t('   et vide', zone.innerHTML==='' || !/attente/.test(zone.innerHTML));

console.log('\n== Pendant le balayage ==');
window.__stratEnCours=true;
window.majPanneauStrat();
t('il se montre', zone.style.display==='');

console.log('\n== Apres le balayage ==');
window.__stratEnCours=false;
window.__balayageMM=[{entNom:'MM Base',sorNom:'Signal opposé MM',note:7,pnl:161,pf:1.94,trades:68,wr:40,dd:47,liq:0}];
window.majPanneauStrat();
t('il affiche le resultat', /La plus sûre/.test(zone.innerHTML));
t('   et reste visible', zone.style.display==='');

console.log('\n== Le bouton ==');
t('present dans la barre', /id="btn-balayage"/.test(src));
t('   il leve le drapeau', /window\.__stratEnCours = true;/.test(src));
t('   et le baisse a la fin', /window\.__stratEnCours = false;/.test(src));
t('plus aucun lancement automatique', !/__stratLancee/.test(src));

console.log('\n'+(ko===0?'Le panneau n apparait qu a la demande.':ko+' probleme(s).'));
