// Verifie que les champs de marge isolee apparaissent et disparaissent bien.
const fs=require('fs');
const sc=fs.readFileSync('index.html','utf8').match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const el=(v)=>({value:v,style:{display:'none'},textContent:'',innerHTML:'',dataset:{},
 classList:{add(){},remove(){},contains:()=>false,toggle(){}},
 getContext:()=>({measureText:()=>({width:10}),fillRect(){},clearRect(){},beginPath(){},moveTo(){},
  lineTo(){},stroke(){},fill(){},arc(){},save(){},restore(){},translate(){},rotate(){},scale(){}}),
 width:1000,height:600,addEventListener(){},querySelectorAll:()=>[],querySelector:()=>null,
 closest:()=>null,appendChild(){},removeChild(){},insertBefore(){},remove(){},setAttribute(){},
 getAttribute:()=>null,scrollIntoView(){},focus(){},click(){},children:[],childNodes:[],parentNode:null});
const c={'bta-mmode':el('croise'),'bta-lbl-mpct':el(''),'bta-lbl-mbonus':el(''),
         'live-ex-margin':el('2'),'live-ex-marginpct-lbl':el(''),'live-ex-sl':el('0')};
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

let ko=0;
const test=(nom,cond)=>{ if(!cond) ko++; console.log((cond?'OK    ':'ECHEC ')+nom); };

c['bta-mmode'].value='croise'; window.majModeMargeBT();
test('backtest croisée : Marge % cap. cachée',   c['bta-lbl-mpct'].style.display==='none');
test('backtest croisée : Bonus % gain caché',    c['bta-lbl-mbonus'].style.display==='none');
c['bta-mmode'].value='isole'; window.majModeMargeBT();
test('backtest isolée : Marge % cap. visible',   c['bta-lbl-mpct'].style.display!=='none');
test('backtest isolée : Bonus % gain visible',   c['bta-lbl-mbonus'].style.display!=='none');
c['bta-mmode'].value='croise'; window.majModeMargeBT();
test('retour en croisée : tout se recache',      c['bta-lbl-mpct'].style.display==='none');

c['live-ex-margin'].value='2'; window.majModeMargeLive();
test('MEXC croisée : champ marge caché',         c['live-ex-marginpct-lbl'].style.display==='none');
c['live-ex-margin'].value='1'; window.majModeMargeLive();
test('MEXC isolée : champ marge visible',        c['live-ex-marginpct-lbl'].style.display==='block');

console.log('\n'+(ko===0?'Toutes les bascules fonctionnent.':ko+' échec(s).'));
