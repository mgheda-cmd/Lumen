// Les sommets, creux, sorties et divergences doivent se reporter sur le prix
// pour kk bis ET pour kk bis 2, chacun avec ses propres reglages.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

const i=src.indexOf("for(const KK of ['kk_bis', 'kk_bis2']){");
t('le report boucle sur les deux indicateurs', i>0);
let j=src.indexOf('{',i), p=0, k=j;
while(k<src.length){ if(src[k]==='{')p++; else if(src[k]==='}'){p--; if(p===0)break;} k++; }
const bloc=src.slice(i,k+1);

t('   il ignore un indicateur masque', /if\(!vis\(KK\)\) continue;/.test(bloc));
t('   il ignore un indicateur sans reglages', /if\(!state\.indicators\[KK\]\) continue;/.test(bloc));
t('   les donnees viennent du bon indicateur', /getInd\(KK\)/.test(bloc));
const enDur=(bloc.match(/'kk_bis'/g)||[]).length;
t('   plus aucune reference en dur', enDur===1, enDur+' (1 attendue : la liste)');

for(const [nom,cle] of [['sorties par seuil','showSeuilOnPrice'],['sorties','showExits'],
  ['croisements','showCrossOnPrice'],['divergences','showDivOnPrice'],
  ['sommets et creux','showPivotsOnPrice']])
  t('   reglage '+nom+' lu sur KK', bloc.includes("S(KK,'"+cle+"'"));

t('   les etiquettes pointent le bon panneau', /key:KK/.test(bloc));

// les deux indicateurs ont bien le reglage
const sch=(cle)=>{ const a=src.indexOf(cle+":{title:"); if(a<0) return '';
  let b=src.indexOf('{',a),q=0,c=b;
  while(c<src.length){ if(src[c]==='{')q++; else if(src[c]==='}'){q--; if(q===0)break;} c++; }
  return src.slice(a,c+1); };
for(const cle of ['kk_bis','kk_bis2'])
  t(cle+' : le reglage existe dans son panneau', /k:'showPivotsOnPrice'/.test(sch(cle)));

// et une valeur par defaut
for(const cle of ['kk_bis','kk_bis2']){
  const a=src.indexOf(cle+':{on:'); const b=src.indexOf('\n',a);
  t('   '+cle+' : valeur par defaut presente', /showPivotsOnPrice/.test(src.slice(a,b)));
}

console.log('\n'+(ko===0?'Le report sur le prix vaut pour les deux indicateurs.':ko+' probleme(s).'));
