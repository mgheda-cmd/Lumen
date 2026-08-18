const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

console.log('== Backtest -> Compte Demo ==');
t('bouton present', /window\.envoyerVersDemo\(\)/.test(src));
t('   refuse sans backtest', /Lancez d\\'abord un backtest/.test(src));
t('   reporte entrees et sorties', /elEnt\.value = r\.mEnt/.test(src) && /elSor\.value = r\.mSor/.test(src));
t('   reporte montant, unite, levier', /elAmt\.value = r\.marge/.test(src) && /elLev\.value = String\(r\.lev\)/.test(src));
t('   reporte capital et mode de marge', /elCap\.value = /.test(src) && /elMmode\.value = /.test(src));
t('   reporte les frais', /elFee\.value = document\.getElementById\('bta-frais'\)/.test(src));
t('   memorise la strategie active', /lumen_active_demo_strategy/.test(src));
t('   active l auto-trade', /window\.paperAutoTrade = true/.test(src));

console.log('\n== Le compte Demo execute-t-il ? ==');
t('checkAutoTrade appele si actif', /if\(paperAutoTrade\)\{?\s*\n?\s*checkAutoTrade\(\)/.test(src) || /paperAutoTrade && typeof checkAutoTrade/.test(src));
t('   il lit la strategie active', /activeDemoStrategy/.test(src));
const iA=src.indexOf('function checkAutoTrade');
let jA=src.indexOf('{',iA),p=0,kA=jA;
while(kA<src.length){ if(src[kA]==='{')p++; else if(src[kA]==='}'){p--; if(p===0)break;} kA++; }
const ct=src.slice(iA,kA+1);
t('   il ouvre des positions', /paper\.pos|openPaper|paperOpen/.test(ct), ct.length+' caracteres');
t('   il applique les frais', /fee|frais/i.test(ct));
t('   verrou anti-boucle', /__lastAutoTradeActionTime/.test(ct), 'delai de 5 s entre deux actions');
t('   aucune pastille sur la derniere bougie : rien ne part', /if \(!sigT\) return;/.test(ct));
t('   le solde demo n est plus plancher a 100', !/Math\.max\(100, \(paper\.cash/.test(src));
t('   il ne peut pas devenir negatif', /Math\.max\(0, \(paper\.cash \|\| 0\)/.test(src));
t('   le nettoyage previent l utilisateur', /trades de rebouclage retir/.test(src));

console.log('\n== Demo -> module MEXC ==');
t('envoi reel depuis le bot', /sendRealMexcFuturesOrder/.test(src));
const iC=src.indexOf('function checkAutoTrade');
t('   le bot appelle l envoi reel', ct.includes('sendRealMexcFuturesOrder'),
  ct.includes('sendRealMexcFuturesOrder')?'oui':'non — le demo ne passe pas d ordre reel');
t('   openType transmis', /openType:/.test(ct) || /openType: Number/.test(src));

console.log('\n== Module MEXC ==');
t('ordre reel : cles declarees', /const apiKey = \(orderConfig\.apiKey/.test(src));
t('   confirmations avant envoi', (src.match(/CONFIRMER L'ENVOI DE L'ORDRE/g)||[]).length===2,
  (src.match(/CONFIRMER L'ENVOI DE L'ORDRE/g)||[]).length+' confirmation(s)');
t('   marge croisee par defaut', /openType \|\| 2\)/.test(src));
t('   plafond de securite', /maxUsdt/.test(src));
t('   journal des ordres', /logMexcClientOrder/.test(src));
t('   renfort de marge isolee', /renforcerMargeIsolee/.test(src));
t('   veille Telegram', /demarrerVeille/.test(src));

console.log('\n'+(ko===0?'La chaine complete est en place.':ko+' point(s) a verifier.'));
