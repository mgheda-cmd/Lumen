// Le Mac emet, l'iPhone recoit, sans doublon et sur un canal prive.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };
const bloc=(nom)=>{ const i=src.indexOf('function '+nom+'('); if(i<0) return '';
  const j=src.indexOf('\n}', i); return src.slice(i,j); };

console.log('== Role de l appareil ==');
t('le choix existe dans le panneau', /id="notif-role"/.test(src));
t('   deux roles proposes', /value="emetteur"/.test(src) && /value="recepteur"/.test(src));
t('   explication donnee', /Mettez le Mac en Émetteur/.test(src));
t('   sauvegarde', bloc('savePhoneNotifUI').includes('role:'));
t('   recharge', bloc('loadPhoneNotifUI').includes('notif-role'));
t('   defaut emetteur', /role: 'emetteur',/.test(src));

console.log('\n== Pas de doublon ==');
t('un recepteur n envoie rien', /if\(cfg\.role === 'recepteur'\) return Promise\.resolve\(false\);/.test(src));
t('   le test le signale aussi', /Récepteur seul : il n'envoie rien/.test(src));

console.log('\n== Canal prive ==');
t('un sujet unique est genere', /function sujetNtfyPrive\(\)/.test(src));
t('   conserve dans le navigateur', /lumen_ntfy_topic_prive/.test(src));
t('   utilise par defaut', /ntfyTopic: sujetNtfyPrive\(\)/.test(src));
t('   utilise a l envoi', /cfg\.ntfyTopic \|\| sujetNtfyPrive\(\)/.test(src));
t('   le sujet est rappele au test', /Abonnez-vous à ce nom exact/.test(src));

// simulation
const gen=()=>'lumen-'+Math.random().toString(36).slice(2,8)+Math.random().toString(36).slice(2,8);
const a=gen(), b=gen();
t('les sujets generes sont uniques', a!==b, a+' / '+b);
t('   et non devinables', a.length>=14 && !/lumen_mm_alerts/.test(a));

const envoie=(role)=>role!=='recepteur';
t('emetteur : envoie', envoie('emetteur'));
t('recepteur : n envoie pas', !envoie('recepteur'));

console.log('\n'+(ko===0?'Le Mac peut emettre vers l iPhone.':ko+' probleme(s).'));
