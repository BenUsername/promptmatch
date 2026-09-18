const stop = new Set(("a an and are as at be been but by can could did do does for from had has have how i if in into is it its may more most my of on or our should than that the their then there these they this to too use using was we what when where which who why will with you your").split(" "));

export function tokens(s:string) {
  return (s.toLowerCase().match(/[a-z0-9][a-z0-9-]{1,}/g) || []).filter(x => !stop.has(x));
}
function counts(xs:string[]){ const m=new Map<string,number>(); for(const x of xs)m.set(x,(m.get(x)||0)+1); return m; }

export function scorePrompt(prompt:string, pageText:string) {
  const q=tokens(prompt), d=tokens(pageText);
  const dc=counts(d), uniqueQ=[...new Set(q)];
  if (!uniqueQ.length || !d.length) return {score:0, matched:[], missing:uniqueQ};
  const matched=uniqueQ.filter(t=>dc.has(t));
  const coverage=matched.length/uniqueQ.length;
  const density=matched.reduce((s,t)=>s+Math.log1p(dc.get(t)||0),0)/Math.max(1,uniqueQ.length);
  const phrase=pageText.toLowerCase().includes(prompt.toLowerCase().slice(0,120)) ? 0.15 : 0;
  const score=Math.min(100, Math.round(100*(0.72*coverage + 0.13*Math.min(1,density/2.2) + phrase)));
  return {score, matched, missing:uniqueQ.filter(t=>!dc.has(t))};
}

export function pageMatch(prompts:{prompt:string,provider?:string,createdAt?:Date}[], pageText:string) {
  return prompts.map(p=>({...p,...scorePrompt(p.prompt,pageText)})).sort((a,b)=>b.score-a.score);
}