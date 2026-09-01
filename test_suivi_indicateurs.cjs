/* Les indicateurs du bas doivent suivre le prix, quel que soit le message
   du flux : bougie ou transaction. */
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

const corps=(nom)=>{ const a=src.indexOf('function '+nom); const b=src.indexOf('\n}', a); return src.slice(a,b); };

console.log('== Les deux chemins du flux ==');
const kline=corps('applyKline'), tick=corps('applyTickPrice');
t('applyKline vide le cache', /state\.cache\s*=\s*\{\}/.test(kline));
t('applyTickPrice vide le cache aussi', /state\.cache\s*=\s*\{\}/.test(tick));
t('   les deux redessinent', /scheduleRender\(\)/.test(kline) && /scheduleRender\(\)/.test(tick));
t('   les deux rafraichissent l en-tete', /updateHeader\(\)/.test(kline) && /updateHeader\(\)/.test(tick));

console.log('\n== Le cout reste maitrise ==');
t('le vidage est dans le bloc limite a 400 ms',
  /_lastHeavyTickTime > 400\)\{[\s\S]{0,900}state\.cache = \{\};/.test(src));
t('   il n est pas fait a chaque tick',
  !/if\(changed\)\{\s*state\.cache/.test(src));

console.log('\n== Les deux chemins sont bien branches au flux ==');
t('applyKline recoit les bougies', /if\(m\.k\)\{\s*applyKline\(/.test(src.replace(/\s+/g,' ')) || /applyKline\(\{t:m\.k\.t/.test(src));
t('   applyTickPrice recoit les transactions', /if\(px>0\) applyTickPrice\(px\)/.test(src));

console.log('\n'+(ko===0?'Le bas suivra le prix dans les deux cas.':ko+' probleme(s).'));
