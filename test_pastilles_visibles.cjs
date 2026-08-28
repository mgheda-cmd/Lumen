// Pourquoi aucune pastille MM n'apparait : la cause doit etre nommee.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

console.log('== Les options masquables ==');
const opts=['opt1','opt2','opt3','opt4','opt5','opt6','opt15m','base','opt15m2','fmc_conf'];
const manquantes=opts.filter(k=>!src.includes("optKey === '"+k+"'"));
t('les dix options ont leur case', manquantes.length===0, manquantes.join(', ')||'toutes');
t('   opt15m2 rattachee a son reglage', /sig\.optKey === 'opt15m2' && ind\.showOpt15mZone === false/.test(src));
t('   fmc_conf rattachee au sien', /sig\.optKey === 'fmc_conf' && ind\.showOptFmc === false/.test(src));

console.log('\n== Le filtre de confluence ==');
t('valeur par defaut : toutes', /confluenceFilter:'all'/.test(src));
t('   son effet reel est documente', /n'est pas une confluence mais un filtre d'option unique/.test(src.replace(/\u2014/g,'-')) || /filtre d'option unique/.test(src));

console.log('\n== Diagnostic ==');
t('les pastilles produites sont comptees', /produites: res\.signals\.length/.test(src));
t('   celles qui passent les filtres', /affichables: displaySignals\.length/.test(src));
t('   consignes et renforts separes', /consignes: displaySignals\.filter/.test(src) && /renforts: displaySignals\.filter/.test(src));
t('   celles dans la vue', /window\.__diagPastilles\.dansLaVue\+\+/.test(src));

console.log('\n== Bandeau ==');
t('affiche seulement si rien n apparait', /g\.dansLaVue === 0 && g\.produites > 0/.test(src));
t('   nomme le filtre fautif', /le filtre « ' \+ g\.filtre \+ ' » masque tout/.test(src));
t('   ou les options masquees', /toutes les options sont masquées/.test(src));
t('   ou le defilement', /hors de la vue/.test(src));

console.log('\n'+(ko===0?'La cause sera nommee a l ecran.':ko+' probleme(s).'));
