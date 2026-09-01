// Une echelle figee par glissement doit se voir et se defaire facilement.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

console.log('== Ce qui fige l echelle ==');
t('glisser le corps d un sous-panneau la fige',
  /state\.subScale\[mk\]=\{auto:false/.test(src));
t('   glisser la graduation aussi', /state\.subScale\[key\]=\{auto:false/.test(src));

console.log('\n== Comment la defaire ==');
t('double-clic dans le corps la rend automatique',
  /const figes=membres\.filter\(mk=>state\.subScale\[mk\] && state\.subScale\[mk\]\.auto===false\)/.test(src));
t('   il n ouvre les reglages que si rien n est fige',
  /for\(const mk of figes\) delete state\.subScale\[mk\];[\s\S]{0,200}return;\s*\}\s*openCfg\(k\); return;/.test(src));
t('   double-clic sur la graduation, comme avant', /z\.startsWith\('sub:'\)\)\{delete state\.subScale/.test(src));
t('   et un clic sur le repere', /act==='auto_scale'/.test(src));

console.log('\n== Le repere est visible ==');
t('un marqueur FIGE est dessine', /const et='FIGÉ'/.test(src));
t('   seulement quand l echelle est figee',
  /state\.subScale\[mk\]\.auto===false\)\{[\s\S]{0,120}const et='FIGÉ'/.test(src));
t('   il est cliquable', /act:'auto_scale'/.test(src));
t('   il ne recouvre pas le titre', /x0 \+= lw \+ 6;/.test(src));

console.log('\n== Le flux ==');
const tick=src.slice(src.indexOf('function applyTickPrice'), src.indexOf('function applyTickPrice')+1200);
t('les transactions vident le cache', /state\.cache = \{\};/.test(tick));

console.log('\n'+(ko===0?'Une echelle figee se voit et se defait en un clic.':ko+' probleme(s).'));
