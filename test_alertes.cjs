// Une alerte ne doit jamais partir sur une bougie encore en formation.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

t('le garde-fou est present', /const idxEnCours = d\.length - 1;/.test(src));
t('   il compare par index', /if\(iSig === idxEnCours/.test(src));
t('   et par horodatage', /tSig === tEnCours\)\) continue;/.test(src));
t('   il agit avant les filtres', src.indexOf('const idxEnCours') < src.indexOf("const isDirect = (sig.tag === 'DIRECT')"));
// le bloc d initialisation doit lui aussi epargner la bougie en cours
t("l initialisation epargne la bougie en cours", /const iForm = d\.length - 1;/.test(src));
t('   elle ne l inscrit pas comme deja vue',
  /if\(sigIdx === iForm \|\| \(tForm != null && sigTime === tForm\)\) continue;/.test(src));
// on borne au bloc d initialisation, en le delimitant proprement
const iI=src.indexOf('const iForm = d.length - 1');
const finI=src.indexOf('return;', iI);
const blocInit=src.slice(iI, finI);
t('   le filtre precede l inscription',
  blocInit.indexOf('if(sigIdx === iForm') < blocInit.indexOf('seenSet.add(id)') &&
  blocInit.indexOf('seenSet.add(id)') > 0,
  'filtre a '+blocInit.indexOf('if(sigIdx === iForm')+', inscription a '+blocInit.indexOf('seenSet.add(id)'));

// simulation de la regle sur des donnees controlees
const d=[]; for(let i=0;i<50;i++) d.push({t:1786000000000+i*60000,c:100+i});
const idxEnCours=d.length-1, tEnCours=d[idxEnCours].t;
const garde=(sig)=>{
  const iSig=sig.i, tSig=sig.t||(d[iSig]?d[iSig].t:null);
  return !(iSig===idxEnCours || (tEnCours!=null && tSig===tEnCours));
};

t('signal sur bougie close : passe', garde({i:48,t:d[48].t}));
t('signal sur bougie en cours : bloque', !garde({i:49,t:d[49].t}));
t('   bloque meme sans index', !garde({i:null,t:tEnCours}));
t('   bloque meme sans horodatage', !garde({i:49,t:null}));
t('signal ancien : passe', garde({i:10,t:d[10].t}));

console.log('\n'+(ko===0?'Plus d alerte sur bougie non close.':ko+' probleme(s).'));
