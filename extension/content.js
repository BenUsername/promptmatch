const API="__API_BASE__";
const provider=location.hostname.includes("chatgpt")?"chatgpt":location.hostname.includes("gemini")?"gemini":"claude";
let lastSent="", lastAt=0;

async function state(){return await chrome.storage.local.get(["enabled","collectorKey"])}
function composer(){
  const selectors=provider==="chatgpt"?["#prompt-textarea","textarea[data-id='root']","div[contenteditable='true']"]:
    provider==="gemini"?["rich-textarea .ql-editor","textarea","div[contenteditable='true']"]:
    ["div[contenteditable='true'].ProseMirror","fieldset div[contenteditable='true']","div[contenteditable='true']"];
  for(const s of selectors){const el=document.querySelector(s);if(el)return el} return null;
}
function value(el){return String(el?.value ?? el?.innerText ?? el?.textContent ?? "").trim()}
async function capture(){
  const {enabled,collectorKey}=await state(); if(!enabled||!collectorKey)return;
  const el=composer(), prompt=value(el); const now=Date.now();
  if(prompt.length<2||prompt.length>8000)return;
  if(prompt===lastSent && now-lastAt<15000)return;
  lastSent=prompt;lastAt=now;
  fetch(API+"/api/prompts",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({collectorKey,prompt,provider}),keepalive:true}).catch(()=>{});
}
document.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey&&!e.isComposing){const el=composer();if(el&&(e.target===el||el.contains?.(e.target)))setTimeout(capture,0)}},true);
document.addEventListener("submit",()=>setTimeout(capture,0),true);
document.addEventListener("click",e=>{const t=e.target.closest?.("button");if(!t)return;const a=(t.getAttribute("aria-label")||"")+" "+(t.textContent||"");if(/send|submit|envoyer|senden/i.test(a))setTimeout(capture,0)},true);
