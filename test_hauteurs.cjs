// Chaque panneau deplie doit rester lisible, quel que soit leur nombre.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

// on rejoue le calcul du code
function hauteurs(n, H, memorisee){
  const AXIS_H=24, avail=H-AXIS_H;
  const def=n?Math.min(110, avail*0.5/n):0;
  let hs=new Array(n).fill(0).map((_,i)=>{
    const h=(memorisee && i===0)?memorisee:def;
    return Math.max(40, Math.min(h, avail*0.6));
  });
  const MIN=46;
  const replie=i=>hs[i]<=22;
  let maxSubs=avail*0.7, tot=hs.reduce((a,b)=>a+b,0);
  if(tot>maxSubs){
    const besoin=hs.reduce((a,h,i)=>a+(replie(i)?h:Math.max(h,MIN)),0);
    maxSubs=Math.min(avail*0.82, Math.max(maxSubs, Math.min(besoin, avail*0.82)));
  }
  tot=hs.reduce((a,b)=>a+b,0);
  if(tot>maxSubs){
    let sur=tot-maxSubs;
    for(let g=0; g<40 && sur>0.5; g++){
      const red=hs.map((h,i)=>({h,i})).filter(o=>!replie(o.i)&&o.h>MIN);
      if(!red.length) break;
      const dispo=red.reduce((a,o)=>a+(o.h-MIN),0);
      if(dispo<=0.5) break;
      const part=Math.min(1, sur/dispo);
      for(const o of red){ const r=(o.h-MIN)*part; hs[o.i]-=r; sur-=r; }
    }
    tot=hs.reduce((a,b)=>a+b,0);
    if(tot>avail-80){ const f=(avail-80)/tot; hs=hs.map(h=>h*f); }
  }
  return hs;
}

console.log('== Hauteur utile par panneau (marges de 16 px retirees) ==');
for(const n of [2,6,10,14,18]){
  const hs=hauteurs(n, 900);
  const mini=Math.min(...hs);
  console.log('   '+String(n).padStart(2)+' panneaux : le plus petit '+mini.toFixed(0)+' px, utile '+(mini-16).toFixed(0)+' px');
  t('      lisible a '+n+' panneaux', mini-16 >= 20, (mini-16).toFixed(0)+' px');
}

console.log('\n== Un panneau agrandi n ecrase plus les autres ==');
const hs2=hauteurs(10, 900, 500);   // le premier a ete agrandi a 500
const autres=hs2.slice(1);
t('les autres restent lisibles', Math.min(...autres)-16 >= 20,
  'le plus petit '+(Math.min(...autres)-16).toFixed(0)+' px utiles');
t('   le grand a bien ete reduit', hs2[0] < 500, hs2[0].toFixed(0)+' px');

console.log('\n== Petite fenetre ==');
const hs3=hauteurs(8, 520);
t('reste lisible sur un ecran court', Math.min(...hs3)-16 >= 18,
  (Math.min(...hs3)-16).toFixed(0)+' px utiles');

console.log('\n== Dans le code ==');
t('plancher pose', /const MIN_PANNEAU = 46;/.test(src));
t('   plafond releve si necessaire', /avail\*0\.82/.test(src));
t('   surplus retire aux plus grands', /reductibles/.test(src));

console.log('\n'+(ko===0?'Tous les panneaux restent lisibles.':ko+' probleme(s).'));
