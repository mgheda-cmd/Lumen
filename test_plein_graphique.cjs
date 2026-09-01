// Le mode plein graphique doit se voir, et les indicateurs revenir en le quittant.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

console.log('== Ce que fait le mode ==');
t('il ne renvoie que le panneau du prix',
  /if\(state\.fullChart\)\{[\s\S]{0,600}return \[p\];/.test(src));
t('   il est signale par un drapeau', /window\.__pleinGraphique = true;/.test(src));
t('   remis a faux sinon', /window\.__pleinGraphique = false;/.test(src));

console.log('\n== L avertissement ==');
t('un bandeau apparait', /Plein graphique actif/.test(src));
t('   il nomme le bouton fautif', /bouton « Pleine page »/.test(src));
t('   il explique les indicateurs escamotes', /indicateurs du bas escamotés/.test(src));
t('   affiche seulement dans ce mode', /if\(window\.__pleinGraphique\)\{[\s\S]{0,200}Plein graphique actif/.test(src));

console.log('\n== L Impulse MACD est bien branche ==');
t('present dans la liste des panneaux', /if\(vis\('imp'\)\) subs\.push\('imp'\)/.test(src));
t('   et sa seconde unite', /if\(vis\('imp2'\)\) subs\.push\('imp2'\)/.test(src));
const i=src.indexOf('const DR={rsi:drawRSI');
const table=src.slice(i, src.indexOf('};', i));
t('   rattache a drawImp', /\bimp:drawImp/.test(table) && /\bimp2:drawImp/.test(table));

console.log('\n== Les pointilles ==');
t('ils descendent jusqu au bas du graphique', /const basV = H - AXIS_H;/.test(src));
t('   traces apres tous les panneaux', src.indexOf('members.forEach') < src.indexOf('for(const v of window.__zzVerticales)'));

console.log('\n'+(ko===0?'Le mode plein graphique ne passera plus inapercu.':ko+' probleme(s).'));
