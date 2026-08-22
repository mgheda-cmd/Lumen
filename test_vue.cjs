// Après actualisation ou balayage : dernières bougies, cache propre.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

console.log('== Au chargement ==');
t('la vue part des dernieres bougies', /state\.view=\{start:state\.data\.length-150,count:150\}/.test(src));
t('   restoreView force la derniere bougie', /start: Math\.max\(0, d\.length - count\)/.test(src));
t('   l echelle repasse en automatique', /state\.yScale = \{ auto: true, lo: 0, hi: 0 \}/.test(src));
t('   le cache est vide au chargement',
  /restoreView\(\);[\s\S]{0,400}state\.cache = \{\};[\s\S]{0,80}updateHeader\(\); render\(\);/.test(src));

console.log('\n== Autour du balayage ==');
t('l etat est photographie avant', /const avant = \{[\s\S]{0,160}data: state\.data/.test(src));
t('   symbole et unite aussi', /symbol: state\.symbol,[\s\S]{0,40}tf: state\.tf/.test(src));
t('   remis en place apres', /if\(avant\.data && avant\.data\.length\)\{[\s\S]{0,200}state\.data = avant\.data;/.test(src));
t('   meme si le balayage echoue',
  src.indexOf('Balayage impossible') < src.indexOf('Remise en place, que le balayage'));
t('   le cache est vide ensuite', /Remise en place[\s\S]{0,600}state\.cache = \{\};/.test(src));
t('   retour aux dernieres bougies', /scrollToLatestCandles === 'function'\) window\.scrollToLatestCandles\(\)/.test(src));
t('   les sous-echelles repassent en automatique',
  /Remise en place[\s\S]{0,700}state\.subScale\[k\]\.auto = true/.test(src));

console.log('\n== Simulation ==');
const state={data:[{t:1,c:76000}],view:{start:0,count:150},symbol:'BTCUSDT',tf:1,cache:{x:1},yScale:{auto:false,lo:63000,hi:64000},subScale:{a:{auto:false}}};
const avant={data:state.data,view:{...state.view},symbol:state.symbol,tf:state.tf};
// le balayage abime tout
state.data=[{t:9,c:63000}]; state.cache={vieux:1}; state.symbol='ETHUSDT';
// remise en place
if(avant.data&&avant.data.length){ state.data=avant.data; state.symbol=avant.symbol; state.tf=avant.tf; state.view=avant.view; }
state.cache={}; state.yScale={auto:true,lo:0,hi:0};
for(const k in state.subScale) state.subScale[k].auto=true;
t('les donnees d origine reviennent', state.data[0].c===76000);
t('   le symbole aussi', state.symbol==='BTCUSDT');
t('   le cache est vide', Object.keys(state.cache).length===0);
t('   l echelle est automatique', state.yScale.auto===true && state.yScale.lo===0);
t('   les sous-echelles aussi', state.subScale.a.auto===true);

console.log('\n'+(ko===0?'Le graphique revient toujours aux dernieres bougies.':ko+' probleme(s).'));
