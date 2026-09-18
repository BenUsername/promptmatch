import { NextRequest, NextResponse } from "next/server";
import { promptsCollection } from "@/lib/mongo";
import { fetchPageText } from "@/lib/safe-fetch";
import { pageMatch } from "@/lib/scoring";

export const runtime="nodejs";
const KEY=/^[a-f0-9]{32,64}$/i;
export async function POST(req:NextRequest){
  try{
    const {collectorKey,url}=await req.json();
    if(!KEY.test(String(collectorKey||""))) return NextResponse.json({error:"Invalid collector key"},{status:400});
    const page=await fetchPageText(String(url||""));
    const col=await promptsCollection();
    const prompts=await col.find({collectorKey},{projection:{_id:0,prompt:1,provider:1,createdAt:1}}).sort({createdAt:-1}).limit(500).toArray();
    if(!prompts.length) return NextResponse.json({error:"No prompts collected for this key yet"},{status:404});
    const results=pageMatch(prompts as any[],page.text);
    const avg=results.length?Math.round(results.reduce((s,r)=>s+r.score,0)/results.length):0;
    const strong=results.filter(r=>r.score>=65).length;
    return NextResponse.json({page:{url:page.url,title:page.title},summary:{averageScore:avg,strongMatches:strong,totalPrompts:results.length},results:results.slice(0,100)});
  }catch(e:any){return NextResponse.json({error:e?.message||"Unable to analyze page"},{status:400});}
}