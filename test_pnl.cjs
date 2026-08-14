// Verifie le calcul du prix repere estime a partir de equity - solde.
function estimer({equity, solde, vol, csz, entryPx, isLong, nbPos}){
  const taille = vol * csz;
  if(!(equity>0 && solde>0 && taille>0 && nbPos===1)) return null;
  const latent = equity - solde;
  const markPx = entryPx + (latent / taille) * (isLong ? 1 : -1);
  const pnl = (markPx - entryPx) * taille * (isLong ? 1 : -1);
  return { markPx, pnl, latent };
}
const cas = [
  { nom:'short en perte (ton cas)', equity:76.55, solde:146.24, vol:200, csz:0.0001, entryPx:58896.40, isLong:false, nbPos:1 },
  { nom:'long en gain',             equity:180,   solde:146.24, vol:200, csz:0.0001, entryPx:58896.40, isLong:true,  nbPos:1 },
  { nom:'deux positions -> refus',  equity:76.55, solde:146.24, vol:200, csz:0.0001, entryPx:58896.40, isLong:false, nbPos:2 },
];
for(const c of cas){
  const r = estimer(c);
  if(!r){ console.log('OK    ' + c.nom.padEnd(28) + ' -> pas d estimation, tiret affiche'); continue; }
  const ecart = Math.abs(r.pnl - r.latent);
  console.log((ecart < 0.01 ? 'OK    ' : 'ECHEC ') + c.nom.padEnd(28) +
    ' -> repere $' + r.markPx.toFixed(2) + '  PnL ' + r.pnl.toFixed(2) +
    '  (latent attendu ' + r.latent.toFixed(2) + ')');
}
