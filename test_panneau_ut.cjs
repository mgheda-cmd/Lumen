// Le champ Unite de temps du panneau doit proposer la serie complete.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

const i=src.indexOf("f.t==='tf'");
const seg=src.slice(i,i+900);
const opts=[...seg.matchAll(/\['(\w+)','([^']+)'\]/g)].map(m=>m[1]);
const ATT=['chart','1','2','3','4','5','6','7','8','9','10','12','15','20','30','60','240'];

t('le champ propose 17 unites', opts.length===17, opts.length+' : '+opts.join(' '));
t('   toutes celles de Google', ATT.every(v=>opts.includes(v)),
  ATT.filter(v=>!opts.includes(v)).join(' ')||'aucune manquante');
t('   1m et 2m presents', opts.includes('1')&&opts.includes('2'));
t('   minutes intermediaires', ['4','6','7','8','9','10','12'].every(v=>opts.includes(v)));
t('   le libelle suit le champ', /\$\{f\.lab \|\| "Unité de temps"\}/.test(seg));
t('   meme presentation que Google', /class="cfg-tf \$\{cur===o\[0\]\?'on':''\}"/.test(seg));

// les listes deroulantes de seconde unite
const sch=(cle)=>{ const j=src.indexOf(cle+":{title:"); if(j<0) return '';
  let a=src.indexOf('{',j),p=0,k=a;
  while(k<src.length){ if(src[k]==='{')p++; else if(src[k]==='}'){p--; if(p===0)break;} k++; }
  return src.slice(j,k+1); };
for(const cle of ['kk_bis','kk_bis2']){
  const m=sch(cle).match(/k:'tf2'[^\]]*opts:\[([^\]]*)\]/);
  const v=m?[...m[1].matchAll(/v:'(\w+)'/g)].map(x=>x[1]):[];
  t(cle+' : seconde unite complete', v.length===10, v.join(' '));
}

console.log('\n'+(ko===0?'Le panneau propose les memes unites que Google-.':ko+' probleme(s).'));
