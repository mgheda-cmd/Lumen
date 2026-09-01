// Le prix d'entree doit tenir DANS la pastille, aux trois tailles.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

console.log('== Mise a l echelle ==');
const i=src.indexOf('function drawMMSignals');
let j=src.indexOf('{',i), prof=0, k=j;
while(k<src.length){ if(src[k]==='{')prof++; else if(src[k]==='}'){prof--; if(prof===0)break;} k++; }
const c=src.slice(i,k+1);
const figees=[...c.matchAll(/by \+ \d+(?:\.\d+)?\)/g)].map(m=>m[0]);
t('aucune position figee', figees.length===0, figees.join(', ')||'toutes suivent le facteur');
t('   la ligne du prix 15 min aussi', /ctx\.fillText\(subTxt, bx \+ bw \/ 2, by \+ 37 \* kT\)/.test(src));

console.log('\n== Le prix tient dans la boite ==');
const tailles=[['normale',1,0.85],['compacte',0.65,0.55],['minimale',0.50,0.42]];
for(const [nom,kC,kR] of tailles){
  for(const [quoi,kT] of [['consigne',kC],['renfort',kR]]){
    const bh = Math.round(54*kT);          // hauteur des pastilles 15 min
    const yPrix = 37*kT;                   // ligne du prix
    const dedans = yPrix + 4 <= bh;        // 4 px pour la hauteur du texte
    t('   '+nom.padEnd(9)+quoi.padEnd(9)+'boite '+bh+' px, prix a '+Math.round(yPrix)+' px', dedans);
  }
}

console.log('\n== Le prix est bien renseigne ==');
t('la pastille 15 min porte un prix', /const priceStr = `\$\$\{fmt\(sig\.price, 1\)\}`/.test(src));
t('   et le niveau', /Niv: \$\{lvlStr\}/.test(src));
t('   la variante sortie de zone aussi', /sub: `\$\{reason\} \u00b7 \$\$\{fmt\(d\[chartI\]\.c, 1\)\}/.test(src) || /15 MIN @ \$\$\{fmt/.test(src));

console.log('\n'+(ko===0?'Le prix d entree tient dans la pastille aux trois tailles.':ko+' probleme(s).'));
