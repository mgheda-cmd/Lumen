// Les reglages de notification doivent survivre a une sauvegarde.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

const bloc=(nom)=>{ const i=src.indexOf('function '+nom+'('); if(i<0) return '';
  const j=src.indexOf('\n}', i); return src.slice(i,j); };
const save=bloc('savePhoneNotifUI'), load=bloc('loadPhoneNotifUI');

console.log('== La sauvegarde n efface plus rien ==');
for(const c of ['enabled','mmBaseAlerts','mmOpt2Alerts','mmOpposeAlerts','mmPivotsAlerts',
                'mmPreavisAlerts','ntfyTopic','telegramToken','telegramChatId','sound','vibrate'])
  t('   '+c+' sauvegarde', save.includes(c+':'));

console.log('\n== Le rechargement remplit l interface ==');
for(const [c,id] of [['ntfyTopic','notif-ntfy-topic'],['mmPreavisAlerts','notif-type-mm-preavis'],
                     ['telegramToken','notif-tg-token'],['mmPivotsAlerts','notif-type-mm-pivots']])
  t('   '+c+' recharge', load.includes(id), id);
t('   le lien ntfy suit le sujet', /notif-ntfy-link'\)\.href = 'https:\/\/ntfy\.sh\/'/.test(load));

console.log('\n== Maintien en eveil ==');
t('wake lock demande', /navigator\.wakeLock\.request\('screen'\)/.test(src));
t('   repris au retour au premier plan', /visibilitychange[\s\S]{0,300}requestWakeLock\(\)/.test(src));
t('   son de maintien en eveil', /keepAliveAudio/.test(src));

console.log('\n== Canal qui survit a l app fermee ==');
t('ntfy envoie a chaque alerte', /sendNtfyPushNotification\(title, body, sig\)/.test(src));
t('   priorite urgente', /'Priority': 'urgent'/.test(src));
t('   sujet configurable', /id="notif-ntfy-topic"/.test(src));

console.log('\n'+(ko===0?'Les reglages tiennent.':ko+' probleme(s).'));
