"use client";
import { useEffect, useMemo, useState } from "react";

type P={prompt:string,provider:string,createdAt:string};
type R=P&{score:number,matched:string[],missing:string[]};
function makeKey(){const a=new Uint8Array(24);crypto.getRandomValues(a);return [...a].map(x=>x.toString(16).padStart(2,"0")).join("");}

export default function Home(){
  const [key,setKey]=useState(""); const [prompts,setPrompts]=useState<P[]>([]);
  const [url,setUrl]=useState(""); const [result,setResult]=useState<any>(null); const [busy,setBusy]=useState(false); const [msg,setMsg]=useState("");
  useEffect(()=>{const q=new URLSearchParams(location.search).get("key");const k=q||localStorage.getItem("promptmatch-key")||makeKey();setKey(k);localStorage.setItem("promptmatch-key",k)},[]);
  async function load(k=key){if(!k)return;const r=await fetch("/api/prompts?key="+encodeURIComponent(k));const j=await r.json();setPrompts(j.prompts||[]);}
  useEffect(()=>{if(key)load(key)},[key]);
  const providers=useMemo(()=>Array.from(new Set(prompts.map(p=>p.provider))),[prompts]);
  async function match(){setBusy(true);setMsg("");setResult(null);try{const r=await fetch("/api/match",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({collectorKey:key,url})});const j=await r.json();if(!r.ok)throw new Error(j.error||"Analysis failed");setResult(j)}catch(e:any){setMsg(e.message)}finally{setBusy(false)}}
  async function clearAll(){if(!confirm("Delete every prompt stored for this collector key?"))return;await fetch("/api/prompts?key="+encodeURIComponent(key),{method:"DELETE"});setPrompts([]);setResult(null)}
  return <main>
    <nav><div className="brand"><span className="mark">P</span> PromptMatch</div><a href="#how">How it works</a></nav>
    <section className="hero"><div className="eyebrow">FREE PROMPT-TO-PAGE MATCHING</div><h1>See whether your pages answer what you actually ask AI.</h1><p>With your permission, the Chrome extension saves prompts you send to ChatGPT, Gemini and Claude. Paste a page URL here to see which of those prompts it matches, and which it misses.</p><div className="heroActions"><a className="primary" href="/promptmatch-extension.zip">Download Chrome extension</a><a className="secondary" href="#dashboard">Open dashboard</a></div><div className="privacy">No A.I. account login is collected. Prompts are stored against a random collector key you control, and you can delete them at any time.</div></section>
    <section id="dashboard" className="panel">
      <div className="panelHead"><div><div className="eyebrow">YOUR COLLECTOR</div><h2>{prompts.length} prompts captured</h2><p>{providers.length?providers.join(" · "):"Install the extension and send a prompt to get started."}</p></div><button className="ghost" onClick={()=>load()}>Refresh</button></div>
      <label>Collector key</label><div className="keyRow"><input value={key} onChange={e=>{setKey(e.target.value);localStorage.setItem("promptmatch-key",e.target.value)}}/><button onClick={()=>navigator.clipboard.writeText(key)}>Copy</button></div>
      <div className="matchBox"><label>Page URL to review</label><div className="urlRow"><input placeholder="https://example.com/page" value={url} onChange={e=>setUrl(e.target.value)}/><button className="primaryBtn" disabled={busy||!url} onClick={match}>{busy?"Checking…":"Match page"}</button></div>{msg&&<p className="error">{msg}</p>}</div>
      {result&&<div className="results"><div className="scoreCard"><span>Average fit</span><strong>{result.summary.averageScore}</strong><small>{result.summary.strongMatches} strong matches / {result.summary.totalPrompts} prompts</small></div><div className="list">{result.results.slice(0,25).map((r:R,i:number)=><div className="row" key={i}><div className="score">{r.score}</div><div><b>{r.prompt}</b><small>{r.provider} · {r.matched.length} matched terms · {r.missing.slice(0,6).join(", ")||"no obvious term gaps"}</small></div></div>)}</div></div>}
      <details><summary>Recent prompts</summary><div className="promptList">{prompts.slice(0,30).map((p,i)=><div key={i}><b>{p.provider}</b><span>{p.prompt}</span></div>)}</div></details>
      <button className="danger" onClick={clearAll}>Delete my stored prompts</button>
    </section>
    <section id="how" className="how"><div><span>1</span><h3>Collect</h3><p>Enable capture in the extension. It records only prompts you submit on the supported AI sites.</p></div><div><span>2</span><h3>Match</h3><p>PromptMatch fetches a public page and scores how directly its visible text covers each stored prompt.</p></div><div><span>3</span><h3>Improve</h3><p>Use the missed prompts and terms as a content brief. The score is a page-fit diagnostic, not a promise of AI citation.</p></div></section>
    <footer>PromptMatch is an independent utility. It is not affiliated with ChatGPT, Google Gemini, Anthropic Claude, or their operators.</footer>
  </main>
}