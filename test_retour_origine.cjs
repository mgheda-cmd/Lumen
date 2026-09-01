// Retour au comportement d'origine : cache et pastilles.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };
const corps=(n2)=>{ const a=src.indexOf('function '+n2); const b=src.indexOf('\n}', a); return src.slice(a,b); };

console.log('== Le cache ==');
const tick=corps('applyTickPrice'), kline=corps('applyKline');
t('les transactions ne vident PLUS le cache', !/state\.cache\s*=\s*\{\}/.test(tick));
t('   les bougies le vident, comme avant', /state\.cache=\{\}/.test(kline));
t('   la raison est ecrite', /sature le navigateur/.test(src));

console.log('\n== Les pastilles ajoutees ==');
t('Pastille FMC eteinte par defaut', /showFmcSolo:false/.test(src));
t('   Confluence FMC eteinte aussi', /showOptFmc:false/.test(src));
t('   mais toujours disponibles au panneau',
  /k:'showFmcSolo'/.test(src) && /k:'showOptFmc'/.test(src));
t('   source contrarien quand on l allume', /fmcSoloSource:'contrarien'/.test(src));

console.log('\n== Ce qui reste actif par defaut ==');
const actifs=[...src.matchAll(/show(Opt\d|Base|15m|Opt15mZone|Renforts)[a-zA-Z]*:(true|false)/g)]
  .map(m=>m[0]);
console.log('   ', actifs.join(', ')||'aucun repere');
t('les options d origine restent actives', /showOpt15mZone:true/.test(src));

console.log('\n'+(ko===0?'Comportement d origine retabli.':ko+' probleme(s).'));
