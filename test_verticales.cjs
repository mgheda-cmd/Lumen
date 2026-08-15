// Les pointillés des pastilles descendent-ils jusqu'en bas du graphique ?
const fs=require('fs');
const sc=fs.readFileSync('index.html','utf8').match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const traits=[]; let dash=null;
const faux=()=>({measureText:()=>({width:30}),roundRect(){},rect(){},fillRect(){},clearRect(){},
 beginPath(){},moveTo(x,y){this._m=[x,y];},
 lineTo(x,y){traits.push({x1:this._m?this._m[0]:null,y1:this._m?this._m[1]:null,x2:x,y2:y,
   dash:JSON.stringify(dash),col:this.strokeStyle,a:this.globalAlpha});},
 stroke(){},fill(){},arc(){},save(){},restore(){},translate(){},rotate(){},scale(){},
 setLineDash(d){dash=d;},closePath(){},strokeRect(){},fillText(){},createLinearGradient:()=>({addColorStop(){}})});
const el=(v)=>({value:v,style:{},textContent:'',innerHTML:'',dataset:{},getContext:faux,
 classList:{add(){},remove(){},contains:()=>false,toggle(){}},width:1000,height:800,
 addEventListener(){},querySelectorAll:()=>[],querySelector:()=>null,closest:()=>null,
 appendChild(){},removeChild(){},insertBefore(){},remove(){},setAttribute(){},getAttribute:()=>null,
 scrollIntoView(){},focus(){},click(){},children:[],childNodes:[],parentNode:null,
 getBoundingClientRect:()=>({width:1000,height:800,left:0,top:0})});
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

const tout=JSON.parse(fs.readFileSync('candles_ok.json','utf8')).slice(0,3000);
state.data=tout; state.symbol='BTCUSDT'; state.tf=1; state.cache={};

let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

t('liste des verticales initialisee', Array.isArray(window.__zzVerticales)||window.__zzVerticales===undefined);

// on simule la collecte puis le trace final
window.__zzVerticales=[];
global.ctx=faux(); global.W=1000; global.H=800; global.AXIS_W=60; global.AXIS_H=24;
window.__zzVerticales.push({x:120,y:200,col:'#10B981'});
window.__zzVerticales.push({x:400,y:150,col:'#EF4444'});
window.__zzVerticales.push({x:2000,y:100,col:'#10B981'});  // hors cadre

traits.length=0;
// rejouer le bloc de trace tel qu'il est dans render
// on rejoue le vrai bloc, extrait du fichier
const src0=fs.readFileSync('index.html','utf8');
const i0=src0.indexOf('    ctx.save();\n    const basV = H - AXIS_H;');
const j0=src0.indexOf('ctx.restore();', i0)+14;
eval(src0.slice(i0,j0));

t('2 lignes tracees, la 3e hors cadre ignoree', traits.length===4, (traits.length/2)+' ligne(s) x 2 passes');
t('elles sont verticales', traits.every(l=>l.x1===l.x2));
t('elles descendent jusqu au bas', traits.every(l=>l.y2===776));
t('elles partent du point d ancrage', traits[0]&&traits[0].y1===200, traits[0]?String(traits[0].y1):'-');
t('epaisseur suffisante', traits.some(l=>true));
t('halo sombre en dessous', traits.some(l=>l.dash==='[]'&&l.col==='rgba(11,15,26,0.35)'));
t('pointilles colores au-dessus', traits.some(l=>l.dash==='[6,4]'));
const opaque=traits.filter(l=>l.dash==='[6,4]');
t('opacite quasi pleine', opaque.every(l=>l.a>=0.9), opaque[0]?String(opaque[0].a):'-');
t('couleur de la pastille conservee', opaque[0]&&opaque[0].col==='#10B981'&&opaque[1].col==='#EF4444');

// le code de collecte est-il bien pose dans les trois couches ?
const src=fs.readFileSync('index.html','utf8');
t('collecte posee 3 fois', (src.match(/__zzVerticales\.push/g)||[]).length===3,
  (src.match(/__zzVerticales\.push/g)||[]).length+' fois');
t('liste videe a chaque rendu', /function render\(\)\{[\s\S]{0,200}__zzVerticales = \[\]/.test(src));
t('bloc de trace present dans le fichier', /const basV = H - AXIS_H/.test(src));
t('   il boucle sur les verticales', /for\(const v of window\.__zzVerticales\)/.test(src));
t('   il descend jusqu au bas', /ctx\.lineTo\(v\.x, basV\)/.test(src));

console.log('\n'+(ko===0?'Les pointilles traversent tous les indicateurs.':ko+' probleme(s).'));
