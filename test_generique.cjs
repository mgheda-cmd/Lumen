// Aucune fonction de panneau ne doit coder en dur sa propre cle.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

const corps=(nom)=>{ const a=src.indexOf('function '+nom); if(a<0) return '';
  let b=src.indexOf('{',a),p=0,k=b;
  while(k<src.length){ if(src[k]==='{')p++; else if(src[k]==='}'){p--; if(p===0)break;} k++; }
  return src.slice(a,k+1); };

// la table des panneaux
const i=src.indexOf('const DR={rsi:drawRSI');
const table=src.slice(i, src.indexOf('};', i));
const paires=[...table.matchAll(/(\w+):\s*(?:\(p,s,e,cw\)=>)?(draw\w+)/g)].map(m=>[m[1],m[2]]);
t('la table des panneaux est lisible', paires.length>10, paires.length+' entrees');

const parFn={};
for(const [cle,fn] of paires){ (parFn[fn]=parFn[fn]||[]).push(cle); }

let fautives=[];
for(const fn in parFn){
  const c=corps(fn);
  if(!c) continue;
  const durs=new Set([...c.matchAll(/(?:S|getInd|vis)\('(\w+)'\)/g)].map(m=>m[1]));
  const propres=parFn[fn].filter(k=>durs.has(k));
  if(propres.length) fautives.push(fn+' ('+propres.join(',')+')');
}
t('aucune ne lit sa propre cle en dur', fautives.length===0, fautives.join(' | ')||'aucune');

console.log('\n== Les sept corrigees ==');
for(const [fn,cle] of [['drawATR','atr'],['drawMACD','macd'],['drawRangeDet2Sub','rangeDet2'],
  ['drawRangeDetSub','rangeDet'],['drawStoch','stoch'],['drawTwoIndSub','two_ind'],
  ['drawVolDelta','vol_delta']]){
  const c=corps(fn);
  t('   '+fn+' recoit une cle', /^function \w+\([^)]*\bK\)/.test(c.split('\n')[0]), c.split('\n')[0].slice(0,60));
  t('      repli sur '+cle, c.includes("K = K || (p && p.key) || '"+cle+"'"));
}

console.log('\n== La table transmet bien la cle ==');
t('DR est appele avec la cle', /DR\[mk\]\(p,s,e,cw,mk\)/.test(src));

console.log('\n'+(ko===0?'Les panneaux sont tous generiques.':ko+' probleme(s).'));
