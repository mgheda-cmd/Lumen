// Unites de l'Impulse MACD et bascules rapides de kk bis 2.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };
const bloc=(cle)=>{
  const i=src.indexOf('data-ind="'+cle+'"'); if(i<0) return '';
  const d=src.lastIndexOf('<div',i); let p=0,k=d;
  while(k<src.length){ if(src.startsWith('<div',k))p++;
    else if(src.startsWith('</div>',k)){p--; if(p===0){k+=6;break;}} k++; }
  return src.slice(d,k);
};

const imp=bloc('imp');
const uImp=[...imp.matchAll(/data-tf="(\w+)"/g)].map(m=>m[1]);
const ATT=['chart','1','2','3','4','5','6','7','8','9','10','12','15','30','60','240'];
t('Impulse MACD : 16 unites', uImp.length===16, uImp.join(' '));
t('   toutes celles de Google', ATT.every(v=>uImp.includes(v)),
  ATT.filter(v=>!uImp.includes(v)).join(' ')||'aucune manquante');
t('   meme presentation', /class="srtf mtf"/.test(imp) && /data-ind2="imp"/.test(imp));

const k2=bloc('kk_bis2');
const basc=[...k2.matchAll(/data-kktoggle="(\w+)"/g)].map(m=>m[1]);
t('kk bis 2 : 3 bascules rapides', basc.length===3, basc.join(' '));
t('   elles visent kk_bis2', (k2.match(/data-kkind="kk_bis2"/g)||[]).length===3);
t('   potentiels achat/vente', basc.includes('showCrossOnPrice'));
t('   sommets et creux', basc.includes('showPivotsOnPrice'));
t('   lignes verticales', basc.includes('showVerticalLines'));

t('le clic est branche', /data-kktoggle\]'\)\.forEach\(el=>\{[\s\S]{0,400}addEventListener\('click'/.test(src));
t('   il ecrit sur le bon indicateur', /state\.indicators\[kind\]\[toggleKey\] = !cur/.test(src));
t('l aspect est rafraichi', /Potentiels A\/V: ON/.test(src));
t('   avec le reste du menu',
  src.indexOf("Potentiels A/V: ON") < src.indexOf("updateZZToggleButtons();"));

const uk=[...k2.matchAll(/data-tf="(\w+)"/g)].map(m=>m[1]);
const uk2=[...k2.matchAll(/data-kkbis2b="(\w+)"/g)].map(m=>m[1]);
t('kk bis 2 : unites principales completes', uk.length===9, uk.join(' '));
t('   secondes unites completes', uk2.length===9, uk2.join(' '));

console.log('\n'+(ko===0?'Tout est aligne sur Google-.':ko+' probleme(s).'));
