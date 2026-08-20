/* Aucun identifiant HTML en double, aucun écouteur attaché deux fois.
   Ce test existe parce que les deux se sont produits : les boutons de Z.Z. 2
   portaient les identifiants de Z.Z. et agissaient sur lui, et le bouton
   d'autorisation des notifications avait deux écouteurs qui s'ajoutaient. */
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

console.log('== Identifiants HTML ==');
const html=src.slice(src.indexOf('<body'), src.indexOf('<script'));
const ids={};
for(const m of html.matchAll(/\sid="([\w-]+)"/g)) ids[m[1]]=(ids[m[1]]||0)+1;
const dbl=Object.entries(ids).filter(([,n])=>n>1);
t('aucun identifiant en double', dbl.length===0,
  dbl.map(([i,n])=>i+' ×'+n).join(', ')||Object.keys(ids).length+' identifiants uniques');

console.log('\n== Ecouteurs ==');
const ecout={};
for(const m of src.matchAll(/getElementById\('([\w-]+)'\)\??\.addEventListener\('(\w+)'/g)){
  const c=m[1]+' / '+m[2];
  ecout[c]=(ecout[c]||0)+1;
}
const dblE=Object.entries(ecout).filter(([,n])=>n>1);
t('aucun ecouteur attache deux fois', dblE.length===0,
  dblE.map(([c,n])=>c+' ×'+n).join(', ')||Object.keys(ecout).length+' ecouteurs uniques');

console.log('\n== Fonctions ==');
/* Seules les fonctions de premier niveau peuvent entrer en collision. Une
   fonction déclarée à l'intérieur d'une autre est locale : plusieurs peuvent
   porter le même nom sans se gêner, et c'est courant pour des utilitaires
   comme fmt ou render. On ne regarde donc que l'indentation zéro. */
const fns={};
for(const l of src.split('\n')){
  const m=/^function\s+([A-Za-z_$][\w$]*)\s*\(/.exec(l);
  if(m) fns[m[1]]=(fns[m[1]]||0)+1;
}
const dblF=Object.entries(fns).filter(([,n])=>n>1);
t('aucune fonction globale declaree deux fois', dblF.length===0,
  dblF.map(([f,n])=>f+' ×'+n).join(', ')||Object.keys(fns).length+' fonctions globales uniques');

/* Un nom de fonction cassé dans un onclick : une chaîne comme
   toggleZ.Z. 2Entries() lève une erreur au clic sans rien dire au chargement. */
/* On cherche un espace À L'INTÉRIEUR d'un nom de fonction juste avant sa
   parenthèse : « toggleZ.Z. 2Entries( ». Un point suivi d'un chiffre est
   légitime (.value=0.02), on ne le retient pas. */
const mauvais=[...src.matchAll(/onclick="([^"]*)"/g)]
  .map(m=>m[1])
  .filter(x=>/[A-Za-z_$][\w$.]*\s+\d*[A-Za-z_$][\w$]*\s*\(/.test(x.replace(/\b(new|return|typeof|await)\s/g,'')));
t('   aucun appel malforme dans un onclick', mauvais.length===0,
  mauvais.slice(0,3).join(' | ')||'aucun');

console.log('\n== Cles d indicateur ==');
const cles={};
for(const m of src.matchAll(/^\s{4}(\w+):\{on:/gm)) cles[m[1]]=(cles[m[1]]||0)+1;
const dblC=Object.entries(cles).filter(([,n])=>n>1);
t('aucun indicateur declare deux fois', dblC.length===0,
  dblC.map(([c,n])=>c+' ×'+n).join(', ')||Object.keys(cles).length+' indicateurs uniques');

const menu={};
for(const m of html.matchAll(/data-ind="(\w+)"/g)) menu[m[1]]=(menu[m[1]]||0)+1;
const dblM=Object.entries(menu).filter(([,n])=>n>1);
t('   aucune entree de menu en double', dblM.length===0,
  dblM.map(([c,n])=>c+' ×'+n).join(', ')||Object.keys(menu).length+' entrees uniques');

console.log('\n'+(ko===0?'Aucun doublon.':ko+' famille(s) de doublons.'));
