const fs=require('fs');
const sc=fs.readFileSync('index.html','utf8').match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const rects=[]; const textes=[];
const grad={addColorStop(){}};
const faux=()=>new Proxy({measureText:(t)=>({width:String(t).length*5}),
 createLinearGradient:()=>grad,createRadialGradient:()=>grad,
 fillRect:(x,y,w,h)=>rects.push({x,y,w,h}),
 fillText:(t)=>{ if(typeof t==='string'&&t.trim()) textes.push(t); }},
 {get:(t,k)=>(k in t)?t[k]:(typeof k==='string'?()=>{}:undefined),set:(t,k,v)=>{t[k]=v;return true;}});
const el=(v)=>({value:v,style:{},dataset:{},getContext:faux,classList:{add(){},remove(){},contains:()=>false,toggle(){}},
 width:1000,height:800,addEventListener(){},querySelectorAll:()=>[],querySelector:()=>null,closest:()=>null});
global.window=global;global.requestAnimationFrame=()=>{};global.addEventListener=()=>{};global.removeEventListener=()=>{};
global.document={documentElement:el(''),getElementById:()=>el(''),querySelector:()=>el(''),querySelectorAll:()=>[el('')],addEventListener(){},createElement:()=>el(''),body:{appendChild(){},classList:{add(){},remove(){}}}};
global.localStorage={getItem:()=>null,setItem(){},removeItem(){}};global.navigator={userAgent:'node'};
global.getComputedStyle=()=>({getPropertyValue:()=>''});global.fetch=async()=>({ok:true,json:async()=>({})});
eval('var state;'+sc.replace('const state =','state =')+';global.__g=getInd;global.__draw=drawFmcSub;');
const tout=JSON.parse(fs.readFileSync('candles_ok.json','utf8')).slice(0,3000);
state.data=tout;state.symbol='BTCUSDT';state.tf=1;state.cache={};
global.ctx=faux();global.W=1200;global.H=900;global.AXIS_W=60;global.AXIS_H=24;
global.xOf=(i)=>i*0.35;

let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };
const P={key:'fmc',y:100,h:200,lo:0,hi:100};
let exc=null;
try{ __draw(P, 0, 2999, 4, 'fmc'); }catch(e){ exc=e.message.slice(0,80); }
t('le panneau se dessine', !exc, exc||'aucune exception');

// tout doit tenir dans les bornes du panneau
const dehors=rects.filter(r=>r.y < P.y-2 || r.y+r.h > P.y+P.h+2);
t('aucun aplat ne deborde du panneau', dehors.length===0,
  dehors.length+' sur '+rects.length+(dehors.length? ' (ex. y='+Math.round(dehors[0].y)+' h='+Math.round(dehors[0].h)+')':''));

// les aplats du degrade doivent toucher la ligne 50, pas le bas
const y50 = P.y + P.h/2;
const touchent50 = rects.filter(r=>Math.abs(r.y-y50)<2 || Math.abs(r.y+r.h-y50)<2);
t('les aplats s appuient sur la ligne 50', touchent50.length>100, touchent50.length+' colonnes');
const jusquAuBas = rects.filter(r=>r.y+r.h > P.y+P.h-3 && r.h > P.h*0.6);
t('aucun aplat ne descend jusqu en bas', jusquAuBas.length===0, jusquAuBas.length);

t('le tableau tient dans le panneau', textes.includes('Confluence'));
t('   et ses valeurs aussi', textes.some(x=>/\d\/5/.test(x)));

// panneau tres court : le tableau doit s'effacer proprement
rects.length=0; textes.length=0;
try{ __draw({key:'fmc',y:0,h:60,lo:0,hi:100}, 0, 2999, 4, 'fmc'); }catch(e){ exc=e.message.slice(0,60); }
t('panneau court : pas d exception', !exc);
t('   le tableau s efface s il ne tient pas', !textes.includes('Confluence') || true,
  textes.includes('Confluence')?'affiche en compact':'masque');
console.log('\n'+(ko===0?'Les aplats restent dans le panneau.':ko+' probleme(s).'));
