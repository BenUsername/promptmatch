const API="https://promptmatch-app.vercel.app";
function newKey(){const a=new Uint8Array(24);crypto.getRandomValues(a);return [...a].map(x=>x.toString(16).padStart(2,"0")).join("")}
(async()=>{
  let s=await chrome.storage.local.get(["enabled","collectorKey"]);if(!s.collectorKey){s.collectorKey=newKey();await chrome.storage.local.set({collectorKey:s.collectorKey,enabled:false})}
  const en=document.querySelector("#enabled"),k=document.querySelector("#key");en.checked=!!s.enabled;k.textContent=s.collectorKey;
  en.onchange=()=>chrome.storage.local.set({enabled:en.checked});
  document.querySelector("#copy").onclick=()=>navigator.clipboard.writeText(s.collectorKey);
  document.querySelector("#open").onclick=()=>chrome.tabs.create({url:API+"/?key="+encodeURIComponent(s.collectorKey)});
})();