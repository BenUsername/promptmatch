import dns from "node:dns/promises";
import net from "node:net";
import * as cheerio from "cheerio";

function privateIp(ip:string){
  if (net.isIPv4(ip)) {
    const [a,b]=ip.split(".").map(Number);
    return a===10 || a===127 || a===0 || (a===169&&b===254) || (a===172&&b>=16&&b<=31) || (a===192&&b===168);
  }
  const v=ip.toLowerCase();
  return v==="::1" || v.startsWith("fe80:") || v.startsWith("fc") || v.startsWith("fd");
}
async function validate(u:URL){
  if (!["http:","https:"].includes(u.protocol)) throw new Error("Only http and https URLs are allowed");
  if (u.username || u.password) throw new Error("Credentials in URLs are not allowed");
  const answers=await dns.lookup(u.hostname,{all:true});
  if (!answers.length || answers.some(a=>privateIp(a.address))) throw new Error("Private or local addresses are not allowed");
}
export async function fetchPageText(input:string){
  let u=new URL(input);
  for(let i=0;i<4;i++){
    await validate(u);
    const r=await fetch(u,{redirect:"manual",headers:{"user-agent":"PromptMatch/1.0 (+page matching tool)","accept":"text/html,application/xhtml+xml"},signal:AbortSignal.timeout(9000)});
    if ([301,302,303,307,308].includes(r.status)){
      const loc=r.headers.get("location"); if(!loc) throw new Error("Redirect without location");
      u=new URL(loc,u); continue;
    }
    if(!r.ok) throw new Error("Page returned HTTP "+r.status);
    const ct=r.headers.get("content-type")||"";
    if(!ct.includes("text/html")&&!ct.includes("application/xhtml+xml")) throw new Error("URL is not an HTML page");
    const html=(await r.text()).slice(0,1_500_000);
    const $=cheerio.load(html);
    $("script,style,noscript,svg,canvas,iframe").remove();
    const title=$("title").first().text().trim();
    const text=$("body").text().replace(/\s+/g," ").trim().slice(0,300_000);
    return {url:u.toString(),title,text};
  }
  throw new Error("Too many redirects");
}