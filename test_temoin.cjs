// Le temoin de vie doit dire si la surveillance tourne ou dort.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

t('le temoin existe dans le panneau', /id="notif-heartbeat"/.test(src));
t('   mis a jour a chaque controle', /function checkAllAlerts\(\)\{[\s\S]{0,120}majTemoinVeille\(\)/.test(src));
t('   il affiche l heure du dernier controle', /dernier contrôle à/.test(src));
t('   et le nombre de controles', /depuis l\\'ouverture/.test(src));
t('   il avertit apres deux minutes sans controle', /ecart > 120000/.test(src));
t('   le message explique la mise en veille', /mise en veille par le système/.test(src));
t('   et dit quoi faire', /Gardez Lumen au premier plan/.test(src));
t('   surveillance verifiee toutes les 20 s', /\}, 20000\);/.test(src));

// simulation de la logique
const etat=(dernier, maintenant)=>{
  if(!dernier) return 'attente';
  return (maintenant-dernier > 120000) ? 'endormie' : 'active';
};
const now=1786000000000;
t('juste apres un controle : active', etat(now-5000, now)==='active');
t('une minute apres : active', etat(now-60000, now)==='active');
t('trois minutes apres : endormie', etat(now-180000, now)==='endormie');
t('jamais controle : attente', etat(0, now)==='attente');

console.log('\n'+(ko===0?'Le temoin repond a la question.':ko+' probleme(s).'));
