// Aucun texte ne doit etre illisible : ni clair sur clair, ni sombre sur sombre.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const d=src.indexOf('<body'), f=src.indexOf('<script');
const html=src.slice(d,f);
let ko=0; const t=(n,ok,dd)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(dd?'  -> '+dd:'')); };

const lum=(h)=>{const r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);
  return 0.299*r+0.587*g+0.114*b;};

t('plus aucun texte blanc en dur sans fond',
  (html.match(/color:#[Ff]{3,6}\b/g)||[]).length===9,
  (html.match(/color:#[Ff]{3,6}\b/g)||[]).length+' restants (9 attendus sur fond vif)');
t('les titres suivent le theme', html.includes('color:var(--text)'),
  html.split('color:var(--text)').length-1+' occurrences');

// aucun texte de theme sur fond plein sombre
const mauvais=[];
for(const m of html.matchAll(/background:#([0-9A-Fa-f]{6})[^"]{0,80}color:var\(--text\)/g))
  if(lum(m[1])<150) mauvais.push(m[1]);
for(const m of html.matchAll(/color:var\(--text\)[^"]{0,80}background:#([0-9A-Fa-f]{6})/g))
  if(lum(m[1])<150) mauvais.push(m[1]);
t('aucun texte de theme sur fond sombre', mauvais.length===0, mauvais.join(', ')||'aucun');

// les 9 blancs restants sont bien sur fond sombre
const blancs=[];
for(const m of html.matchAll(/background:#([0-9A-Fa-f]{6})[^"]{0,80}color:#FFFFFF/g)) blancs.push(m[1]);
for(const m of html.matchAll(/color:#FFFFFF[^"]{0,80}background:#([0-9A-Fa-f]{6})/g)) blancs.push(m[1]);
t('le blanc restant est sur fond sombre', blancs.every(c=>lum(c)<150),
  blancs.map(c=>c+'('+Math.round(lum(c))+')').join(' '));

t('la strategie MM est dans le menu', /data-ind="strat_mm"/.test(html));
t('   son titre suit le theme',
  /data-ind="strat_mm"[\s\S]{0,700}color:var\(--text\)[^"]{0,40}">Stratégie MM/.test(html));

console.log('\n'+(ko===0?'Les titres sont lisibles dans les deux themes.':ko+' probleme(s).'));
