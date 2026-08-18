// Les notifications doivent fonctionner sur Mac, iPhone et iPad.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

console.log('== Socle commun ==');
t('service worker enregistre', /navigator\.serviceWorker\.register\('\.\/sw\.js'\)/.test(src));
const sw=fs.readFileSync('../repoLumen/sw.js','utf8');
t('   il ecoute push', /addEventListener\('push'/.test(sw));
t('   il ecoute notificationclick', /addEventListener\('notificationclick'/.test(sw));
t('   il affiche la notification', /registration\.showNotification/.test(sw));

console.log('\n== Mac et Chrome ==');
t('autorisation demandee au clic', /Notification\.requestPermission\(\)/.test(src));
t('   un seul ecouteur sur le bouton',
  (src.match(/getElementById\('btn-req-notif-perm'\)\?\.addEventListener/g)||[]).length===1,
  (src.match(/getElementById\('btn-req-notif-perm'\)\?\.addEventListener/g)||[]).length+' ecouteur(s)');
t('   test declenche apres accord', /triggerMobileNotification\('Test Notification Push'/.test(src));
t('   passage par le service worker si dispo', /navigator\.serviceWorker\.controller/.test(src));
t('   repli sur new Notification', /new Notification\(title/.test(src));

console.log('\n== iPhone et iPad ==');
const mf=JSON.parse(fs.readFileSync('../repoLumen/manifest.webmanifest','utf8'));
t('manifeste present', !!mf);
t('   lie dans la page', /rel="manifest" href="\.\/manifest\.webmanifest"/.test(src));
t('   display standalone', mf.display==='standalone', mf.display);
t('   start_url et scope', !!mf.start_url && !!mf.scope);
t('   icones 192 et 512', (mf.icons||[]).some(i=>i.sizes==='192x192') && (mf.icons||[]).some(i=>i.sizes==='512x512'));
t('   icone apple-touch liee', /apple-touch-icon/.test(src));
for(const f of ['icone-192.png','icone-512.png'])
  t('   fichier '+f, fs.existsSync('../repoLumen/'+f), fs.existsSync('../repoLumen/'+f)? fs.statSync('../repoLumen/'+f).size+' octets':'absent');
t('meta apple-mobile-web-app-capable', /apple-mobile-web-app-capable" content="yes"/.test(src));
t('detection iPad moderne (MacIntel + tactile)', /navigator\.maxTouchPoints > 1/.test(src));
t('   detection du mode installe', /display-mode: standalone/.test(src) && /navigator\.standalone === true/.test(src));
t('   marche a suivre expliquee', /Sur l'écran d'accueil/.test(src));
t('   avertit si ouvert dans Safari', /iOS refusera/.test(src));

console.log('\n== Canal sans installation ==');
t('ntfy present', /https:\/\/ntfy\.sh\//.test(src));
t('   priorite urgente', /'Priority': 'urgent'/.test(src));
t('Telegram present', /api\.telegram\.org/.test(src));

console.log('\n'+(ko===0?'Les trois appareils sont couverts.':ko+' probleme(s).'));
