/* Chaque réglage déclaré doit être sauvegardé ET rechargé.
   Ce test existe parce que la même faute s'est produite trois fois :
   CHAMPS_BT oubliait 5 champs sur 17, savePhoneNotifUI en oubliait 2,
   et le schéma de kk bis 2 avait 3 champs sans valeur par défaut.
   À chaque fois, le réglage semblait fonctionner puis disparaissait. */
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

const bloc=(nom)=>{ const i=src.indexOf('function '+nom+'('); if(i<0) return '';
  const j=src.indexOf('\n}', i); return src.slice(i,j); };
const accolades=(depuis)=>{ let b=src.indexOf('{',depuis),p=0,k=b;
  while(k<src.length){ if(src[k]==='{')p++; else if(src[k]==='}'){p--; if(p===0)break;} k++; }
  return src.slice(depuis,k+1); };

console.log('== 1. Chaque champ de schema a une valeur par defaut ==');
const iS=src.indexOf('const SCHEMA');
const schemas=[...src.slice(iS).matchAll(/^\s*(\w+):\{title:/gm)].map(m=>m[1]);
t('schemas trouves', schemas.length>40, schemas.length+' indicateurs');
let sansDefaut=[];
for(const cle of schemas){
  const a=src.indexOf(cle+":{title:", iS);
  if(a<0) continue;
  const sc=accolades(a);
  const champs=[...new Set([...sc.matchAll(/k:'(\w+)'/g)].map(m=>m[1]))];
  /* S() retombe sur f.def du schéma quand la valeur initiale manque :
     un champ sans valeur dans state.indicators n'est donc pas un défaut.
     On ne signale que les champs sans valeur ET sans def dans le schéma. */
  const sansDef=new Set([...sc.matchAll(/\{k:'(\w+)'(?![^}]*\bdef:)[^}]*\}/g)].map(m=>m[1]));
  const d=src.indexOf('    '+cle+':{on:');
  if(d<0) continue;
  const ligne=src.slice(d, src.indexOf('\n', d));
  const ont=new Set([...ligne.matchAll(/(\w+):/g)].map(m=>m[1]));
  /* Certains champs n'ont ni valeur ni def volontairement : le code les
     rattrape en ligne. opt1Tf absent déclenche le calcul automatique de la
     seconde unité, et sr gère ses unités par tfs et non par tf. Vérifiés un
     par un ; on les écarte au lieu de crier à tort. */
  const tolerés = {strat_mm:['opt1Tf'], sr:['tf','fast','slow','sig']};
  const exempts = new Set(tolerés[cle] || []);
  const manque=champs.filter(c=>!ont.has(c) && sansDef.has(c) && !exempts.has(c));
  if(manque.length) sansDefaut.push(cle+' → '+manque.join(','));
}
t('   tous les champs ont un defaut', sansDefaut.length===0,
  sansDefaut.slice(0,4).join(' | ')||'aucun manquant');

console.log('\n== 2. Configuration du backtest ==');
const mBT=src.match(/const CHAMPS_BT\s*=\s*\[([^\]]*)\]/);
const champsBT=mBT?[...mBT[1].matchAll(/'([\w-]+)'/g)].map(m=>m[1]):[];
t('CHAMPS_BT lisible', champsBT.length>0, champsBT.length+' champs');
/* Seuls les champs de saisie sont des réglages : bta-res, bta-charge et les
   autres sont des zones d'affichage, elles n'ont rien à sauvegarder. */
const saisies=new Set([...src.matchAll(/<(?:input|select|textarea)[^>]*id="(bta-[\w-]+)"/g)].map(m=>m[1]));
const idsBT=[...saisies];
const oubliesBT=idsBT.filter(i=>!champsBT.includes(i));
t('   aucun champ du panneau oublie', oubliesBT.length===0,
  oubliesBT.join(', ')||'aucun');
const fantomesBT=champsBT.filter(c=>!idsBT.includes(c));
t('   aucun champ inexistant dans la liste', fantomesBT.length===0, fantomesBT.join(', ')||'aucun');

console.log('\n== 3. Notifications : sauvegarde et rechargement ==');
const def=accolades(src.indexOf('function getPhoneNotifConfig'));
const clesDef=[...new Set([...def.matchAll(/^\s{4}(\w+):/gm)].map(m=>m[1]))];
const save=bloc('savePhoneNotifUI'), load=bloc('loadPhoneNotifUI');
t('reglages par defaut lisibles', clesDef.length>5, clesDef.length+' reglages');
const nonSauves=clesDef.filter(c=>!save.includes(c+':'));
t('   tous sauvegardes', nonSauves.length===0, nonSauves.join(', ')||'aucun oubli');
// tout ce qui a un champ dans l interface doit etre recharge
const idsNotif=[...new Set([...src.matchAll(/getElementById\('(notif-[\w-]+)'\)/g)].map(m=>m[1]))];
const nonRecharges=idsNotif.filter(i=>save.includes(i) && !load.includes(i));
t('   tout ce qui est sauve est recharge', nonRecharges.length===0,
  nonRecharges.join(', ')||'aucun oubli');

console.log('\n'+(ko===0?'Aucun reglage ne peut disparaitre en silence.':ko+' probleme(s).'));
