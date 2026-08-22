// Panneau « stratégie du moment » : choix, affichage, historique.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const sc=src.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const grad={addColorStop(){}};
const faux=()=>new Proxy({measureText:()=>({width:30}),createLinearGradient:()=>grad,createRadialGradient:()=>grad},
 {get:(t,k)=>(k in t)?t[k]:(typeof k==='string'?()=>{}:undefined),set:()=>true});
const zone={innerHTML:''};
const el=(v)=>({value:v,style:{},dataset:{},getContext:faux,textContent:'',innerHTML:'',
 classList:{add(){},remove(){},contains:()=>false,toggle(){}},width:1000,height:800,
 addEventListener(){},querySelectorAll:()=>[],querySelector:()=>null,closest:()=>null,onclick:null});
global.window=global;global.requestAnimationFrame=()=>{};global.addEventListener=()=>{};global.removeEventListener=()=>{};
global.document={documentElement:el(''),
 getElementById:(i)=> i==='panneau-strat' ? zone : el(''),
 querySelector:()=>el(''),querySelectorAll:()=>[el('')],addEventListener(){},createElement:()=>el(''),
 body:{appendChild(){},classList:{add(){},remove(){}}}};
const store={};
global.localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;},removeItem:k=>{delete store[k];}};
global.navigator={userAgent:'node'};
global.getComputedStyle=()=>({getPropertyValue:()=>''});global.fetch=async()=>({ok:true,json:async()=>({})});
eval('var state;'+sc.replace('const state =','state =')+';');

let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

t('le panneau existe dans la page', /id="panneau-strat"/.test(src));
t('   en haut a droite', /position:absolute;top:8px;right:12px/.test(src));
t('   au-dessus du graphique', /z-index:40/.test(src));
t('lancement automatique', /window\.__stratLancee/.test(src));
t('   une seule fois', /if\(!window\.__stratLancee/.test(src));
t('bouton relancer', /id="strat-rebalayer"/.test(src));
t('bouton historique', /id="strat-basculer"/.test(src));

console.log('\n== Le choix : 3 premieres prudentes, puis meilleur PnL ==');
const jeu=[
 {entNom:'A',sorNom:'x',note:9.0,pnl: 50,pf:1.5,trades:40,wr:60,dd:10,liq:0},
 {entNom:'B',sorNom:'x',note:8.5,pnl:200,pf:1.3,trades:35,wr:55,dd:40,liq:0},
 {entNom:'C',sorNom:'x',note:8.0,pnl:120,pf:1.4,trades:30,wr:58,dd:20,liq:0},
 {entNom:'D',sorNom:'x',note:2.0,pnl:900,pf:3.0,trades:50,wr:70,dd:5, liq:0},
];
t('prend le meilleur PnL des 3 premieres', window.__choisirMeilleureStrat(jeu).entNom==='B', window.__choisirMeilleureStrat(jeu).entNom);
t('   ignore le gros PnL mal note', window.__choisirMeilleureStrat(jeu).entNom!=='D');

const avecLiq=jeu.concat([{entNom:'E',sorNom:'x',note:10,pnl:500,pf:2,trades:40,wr:65,dd:10,liq:2}]);
t('ecarte une combinaison liquidee', window.__choisirMeilleureStrat(avecLiq).entNom!=='E', window.__choisirMeilleureStrat(avecLiq).entNom);
const peu=[{entNom:'F',sorNom:'x',note:10,pnl:80,pf:2,trades:12,wr:70,dd:5,liq:0},
           {entNom:'G',sorNom:'x',note:6,pnl:60,pf:1.2,trades:25,wr:55,dd:10,liq:0}];
t('ecarte les echantillons sous 20 trades', window.__choisirMeilleureStrat(peu).entNom==='G', window.__choisirMeilleureStrat(peu).entNom+' (F a 12 trades ecartee)');
t('aucune combinaison : ne plante pas', window.__choisirMeilleureStrat([])===null && window.__choisirMeilleureStrat(null)===null);

console.log('\n== Affichage et historique ==');
window.__balayageMM=jeu;
window.majPanneauStrat();
t('le panneau se remplit', /La plus sûre/.test(zone.innerHTML));
t('   il nomme la combinaison retenue', /(^|>)[^<]*B[^<]*</.test(zone.innerHTML));
t('   il affiche PnL, PF, trades', /\+200 \$/.test(zone.innerHTML)&&/PF 1\.30/.test(zone.innerHTML)&&/35 tr\./.test(zone.innerHTML));
t('   et la note prudente', /note prudente 8\.5/.test(zone.innerHTML));

// historique
const h=[{quand:'21/08 03:10',ent:'A',sor:'x',pnl:50},{quand:'21/08 04:00',ent:'B',sor:'x',pnl:200}];
store['lumen_histo_meilleure_strat']=JSON.stringify(h);
window.__stratHistoOuvert=true;
window.majPanneauStrat();
t('historique affichable', /21\/08 04:00/.test(zone.innerHTML)&&/21\/08 03:10/.test(zone.innerHTML));
t('   plus recent en premier', zone.innerHTML.indexOf('04:00') < zone.innerHTML.indexOf('03:10'));
window.__stratHistoOuvert=false;
window.majPanneauStrat();
t('   masquable', !/21\/08 04:00/.test(zone.innerHTML));

window.__balayageMM=null;
window.majPanneauStrat();
t('sans balayage : message d attente', /attente/.test(zone.innerHTML));

console.log('\n== Les deux lignes ==');
window.__balayageMM=jeu;
window.__stratHistoOuvert=false;
window.majPanneauStrat();
t('la plus sure est annoncee', /La plus sûre/.test(zone.innerHTML));
t('le meilleur PnL est annonce', /Meilleur PnL/.test(zone.innerHTML));
t('   c est bien D, le plus gros PnL', /\+900 \$/.test(zone.innerHTML),
  'D a 900 $ malgre sa note de 2,0');
t('   et B reste la plus sure', /\+200 \$/.test(zone.innerHTML));
t('   les deux notes sont visibles', /note 2\.0/.test(zone.innerHTML));

// quand les deux coincident, on ne repete pas
const memeJeu=[{entNom:'X',sorNom:'y',note:9,pnl:300,pf:2,trades:40,wr:60,dd:10,liq:0},
               {entNom:'Y',sorNom:'y',note:8,pnl:100,pf:1.5,trades:30,wr:55,dd:20,liq:0}];
window.__balayageMM=memeJeu;
window.majPanneauStrat();
t('si la plus sure est aussi la plus rentable, pas de doublon',
  !/Meilleur PnL/.test(zone.innerHTML) && /aussi le meilleur PnL/.test(zone.innerHTML));

// le meilleur PnL ecarte aussi les liquidations
const avecLiq2=[{entNom:'L',sorNom:'y',note:5,pnl:9999,pf:5,trades:40,wr:80,dd:5,liq:3},
                {entNom:'M',sorNom:'y',note:7,pnl:120,pf:1.4,trades:30,wr:58,dd:20,liq:0}];
t('le meilleur PnL ignore les liquidees',
  window.__choisirMeilleurPnl(avecLiq2).entNom==='M', window.__choisirMeilleurPnl(avecLiq2).entNom);
t('   et les echantillons sous 20 trades',
  window.__choisirMeilleurPnl([{entNom:'P',note:9,pnl:800,pf:3,trades:8,wr:70,dd:5,liq:0,sorNom:'y'},
                               {entNom:'Q',note:5,pnl:100,pf:1.2,trades:22,wr:52,dd:15,liq:0,sorNom:'y'}]).entNom==='Q');

console.log('\n'+(ko===0?'Le panneau fonctionne.':ko+' probleme(s).'));
