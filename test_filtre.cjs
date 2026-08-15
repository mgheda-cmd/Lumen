// Seules les notifications du module MEXC doivent partir.
const fs=require('fs');
const sc=fs.readFileSync('index.html','utf8').match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const el=(v)=>({value:v,style:{},textContent:'',innerHTML:'',dataset:{},checked:false,
 classList:{add(){},remove(){},contains:()=>false,toggle(){}},
 getContext:()=>({measureText:()=>({width:10}),fillRect(){},clearRect(){},beginPath(){},moveTo(){},
  lineTo(){},stroke(){},fill(){},arc(){},save(){},restore(){},translate(){},rotate(){},scale(){},
  setLineDash(){},closePath(){},strokeRect(){},fillText(){},roundRect(){}}),
 width:1000,height:600,addEventListener(){},querySelectorAll:()=>[],querySelector:()=>null,
 closest:()=>null,appendChild(){},removeChild(){},insertBefore(){},remove(){},setAttribute(){},
 getAttribute:()=>null,scrollIntoView(){},focus(){},click(){},children:[],childNodes:[],parentNode:null});
const c={'bta-marge':el('0.02'),'bta-lev':el('200'),'bta-unite':el('BASE'),'bta-sor':el('toutes')};
const store={'lumen-phone-notifs':JSON.stringify({telegramToken:'123:ABC',telegramChatId:'999'})};
global.window=global; global.requestAnimationFrame=()=>{}; global.cancelAnimationFrame=()=>{};
global.addEventListener=()=>{}; global.removeEventListener=()=>{};
global.document={documentElement:el(''),getElementById:(i)=>c[i]||el(''),querySelector:()=>el(''),
 querySelectorAll:()=>[el('')],addEventListener(){},createElement:()=>el(''),
 body:{appendChild(){},classList:{add(){},remove(){}}}};
global.localStorage={getItem:(k)=>store[k]??null,setItem:(k,v)=>{store[k]=v;},removeItem:(k)=>{delete store[k];}};
global.navigator={userAgent:'node'}; global.confirm=()=>true; global.alert=()=>{};
global.getComputedStyle=()=>({getPropertyValue:()=>''});
const partis=[];
global.fetch=async(url,opt)=>{
  if(String(url).includes('api.telegram.org')){
    try{ partis.push(JSON.parse(opt.body).text); }catch(e){}
    return {ok:true,status:200,json:async()=>({ok:true})};
  }
  return {ok:true,status:200,json:async()=>({})};
};
eval("var state;\n"+sc.replace('const state =','state ='));
global.toast=()=>{};
state.data=[]; state.symbol='BTCUSDT'; state.tf=1;

let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

(async()=>{
  partis.length=0;
  await sendTelegramNotification('message du compte démo');
  t('notification démo bloquée', partis.length===0, partis.length+' envoi(s)');

  partis.length=0;
  await sendTelegramNotification('alerte de zone');
  t('alerte de zone bloquée', partis.length===0, partis.length+' envoi(s)');

  partis.length=0;
  await sendTelegramNotification('signal du module', 'mexc');
  t('notification MEXC passée', partis.length===1, partis.length+' envoi(s)');

  partis.length=0;
  await sendTelegramNotification('test de connexion', 'test');
  t('test de connexion passé', partis.length===1, partis.length+' envoi(s)');

  // La veille doit passer
  partis.length=0;
  const d=[]; for(let i=0;i<60;i++) d.push({t:1786000000000+i*60000,o:100,h:101,l:99,c:100+i*0.1});
  state.data=d; state.indicators=state.indicators||{}; state.indicators.kk_bis={tf:'2',tf2:'3'};
  window.demarrerVeille(false);
  t('annonce de veille passée', partis.length===1, partis.length+' envoi(s)');

  // Si on remet mexcOnly a false, tout repasse
  store['lumen-phone-notifs']=JSON.stringify({telegramToken:'123:ABC',telegramChatId:'999',mexcOnly:false});
  partis.length=0;
  await sendTelegramNotification('message du compte démo');
  t('filtre désactivable', partis.length===1, partis.length+' envoi(s)');

  console.log('\n'+(ko===0?'Seul le module MEXC notifie.':ko+' problème(s).'));
})();
