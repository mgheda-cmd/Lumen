// Les unites de temps de kk bis et kk bis 2 doivent egaler celles de Google-.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

const bloc=(cle)=>{
  const i=src.indexOf('data-ind="'+cle+'"');
  if(i<0) return '';
  const d=src.lastIndexOf('<div',i);
  let p=0,k=d;
  while(k<src.length){
    if(src.startsWith('<div',k)) p++;
    else if(src.startsWith('</div>',k)){ p--; if(p===0){k+=6;break;} }
    k++;
  }
  return src.slice(d,k);
};
const ATTENDU_PRINCIPALE=['chart','1','2','3','5','15','20','30','60'];
const ATTENDU_SECONDE=['off','1','2','3','5','15','20','30','60'];

for(const [cle,att] of [['kk_bis','data-kkbis2'],['kk_bis2','data-kkbis2b']]){
  const b=bloc(cle);
  const p=[...b.matchAll(/data-tf="(\w+)"/g)].map(m=>m[1]);
  const s=[...b.matchAll(new RegExp(att+'="(\\w+)"','g'))].map(m=>m[1]);
  t(cle+' : unite principale complete',
    ATTENDU_PRINCIPALE.every(v=>p.includes(v)), p.join(' '));
  t('   seconde unite complete',
    ATTENDU_SECONDE.every(v=>s.includes(v)), s.join(' '));
  t('   1m present', p.includes('1') && s.includes('1'));
  t('   2m present', p.includes('2') && s.includes('2'));
  t('   1H present', p.includes('60') && s.includes('60'));
}

// les listes deroulantes des reglages
const sch=(cle)=>{ const i=src.indexOf(cle+":{title:"); if(i<0) return '';
  let j=src.indexOf('{',i),p=0,k=j;
  while(k<src.length){ if(src[k]==='{')p++; else if(src[k]==='}'){p--; if(p===0)break;} k++; }
  return src.slice(i,k+1); };
for(const cle of ['kk_bis','kk_bis2']){
  const m=sch(cle).match(/k:'tf2'[^\]]*opts:\[([^\]]*)\]/);
  const v=m?[...m[1].matchAll(/v:'(\w+)'/g)].map(x=>x[1]):[];
  t(cle+' : liste deroulante seconde unite', v.length>=10, v.join(' '));
}

console.log('\n'+(ko===0?'Les unites de temps sont completes.':ko+' probleme(s).'));
