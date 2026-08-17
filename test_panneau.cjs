// Le panneau de reglages doit defiler, et rester deplacable par son titre.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };
const regle=(sel)=>{ const m=src.match(new RegExp(sel.replace(/[#.]/g,'\\$&')+"\\s*\\{[^}]*\\}","g")); return m?m.join(' '):''; };

const box=regle('#cfg-box'), body=regle('#cfg-body'), head=regle('#cfg-head');

t('la boite ne bloque plus les gestes', !/#cfg-box\{[^}]*touch-action:none/.test(src.replace(/\s+/g,'')));
t('le corps defile', /overflow-y:auto/.test(body), body.match(/overflow-y:[a-z]+/)?.[0]||'-');
t('   geste vertical autorise', /touch-action:pan-y/.test(body));
t('   inertie sur iPad', /-webkit-overflow-scrolling:touch/.test(body));
t('   il peut retrecir dans le flex', /min-height:0/.test(body));
t('   le defilement ne deborde pas', /overscroll-behavior:contain/.test(body));
t('la boite est en colonne', /display:flex/.test(box) && /flex-direction:column/.test(box));
t('titre et pied fixes', /#cfg-head\{ touch-action:none; flex:none; \}/.test(src) && /#cfg-foot\{ flex:none; \}/.test(src));
t('seul le titre bloque les gestes', /#cfg-head\{ touch-action:none/.test(src));
t('le deplacement reste sur le titre',
  /head\.addEventListener\('touchstart'/.test(src) && !/body\.addEventListener\('touchstart'/.test(src));

// kk bis 2 a bien beaucoup de champs : c'est le cas qui saturait
const i=src.indexOf("kk_bis2:{title:");
let j=src.indexOf('{',i),p=0,k=j;
while(k<src.length){ if(src[k]==='{')p++; else if(src[k]==='}'){p--; if(p===0)break;} k++; }
const n=[...new Set([...src.slice(i,k+1).matchAll(/k:'(\w+)'/g)].map(m=>m[1]))].length;
t('kk bis 2 a bien un panneau long', n>=40, n+' champs');

console.log('\n'+(ko===0?'Le panneau defile et reste deplacable.':ko+' probleme(s).'));
