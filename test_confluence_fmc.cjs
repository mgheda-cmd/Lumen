// Option Confluence FMC : pastille propre, sans toucher aux entrees MM.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

console.log('== Branchement ==');
t('option creee dans la strategie', /optKey: 'fmc_conf'/.test(src));
t('   elle ne filtre rien, elle ajoute', /for \(const nv of nouvelles\) signals\.push\(nv\);/.test(src));
t('   les entrees existantes sont intactes', !/signals\.splice\(q, 1\)/.test(src.slice(src.indexOf('OPTION CONFLUENCE FMC'), src.indexOf('OPTION CONFLUENCE FMC')+3000)));
t('libelle de pastille', /fmc_conf: '\u{1F52E} Confluence FMC'/u.test(src));
t('   et pour le backtest', /mm_fmc_conf: '\u{1F52E} Confluence FMC'/u.test(src));
t('choix dans le menu du backtest', /value="mm_fmc_conf"/.test(src));
t('   filtre correspondant', /mEnt === 'mm_fmc_conf'/.test(src));

console.log('\n== Reglages ==');
for(const [k,att] of [['showOptFmc','true'],['fmcSource',"'base'"],['fmcSens','true'],
                      ['fmcConfluenceMin','3'],['fmcScoreMin','0']])
  t('   '+k, new RegExp(k+':'+att.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).test(src));
t('   tous reglables au panneau',
  ["showOptFmc","fmcSource","fmcSens","fmcConfluenceMin","fmcScoreMin"]
    .every(k=>new RegExp("k:'"+k+"'").test(src)));

console.log('\n== Conditions de confluence ==');
t('structure et flux dans le sens', /fmc\.trend\[i\] === \(versHaut \? 1 : -1\)/.test(src));
t('   modules d accord minimum', /conf < minConf/.test(src));
t('   score minimum', /sc < minScore/.test(src));
t('   alternance respectee', /if \(alternateSignals && etatFmc === sg\.dir\) continue;/.test(src));
t('   les renforts sont ignores', /if \(sg\.renfort > 0\) continue;/.test(src));

console.log('\n== Rendu resistant ==');
t('chaque panneau est isole', /Un indicateur qui plante ne doit pas emporter tout le rendu/.test(src));
t('   le fautif est signale', /Panneau « '\+mk\+' » en erreur/.test(src));
t('   et affiche a l ecran', /'\u26A0 '\+mk\+' : '/u.test(src));

console.log('\n'+(ko===0?'La confluence FMC est une option a part entiere.':ko+' probleme(s).'));
