import { NextRequest, NextResponse } from "next/server";
import { promptsCollection } from "@/lib/mongo";

export const runtime="nodejs";
const KEY=/^[a-f0-9]{32,64}$/i;
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"content-type","Access-Control-Allow-Methods":"GET,POST,DELETE,OPTIONS"};
export async function OPTIONS(){return new NextResponse(null,{status:204,headers:cors});}

export async function POST(req:NextRequest){
  try{
    const body=await req.json();
    const collectorKey=String(body.collectorKey||"");
    const prompt=String(body.prompt||"").trim();
    const provider=String(body.provider||"unknown").slice(0,30);
    if(!KEY.test(collectorKey)||prompt.length<2||prompt.length>8000) return NextResponse.json({error:"Invalid payload"},{status:400,headers:cors});
    const col=await promptsCollection();
    const since=new Date(Date.now()-24*3600*1000);
    const recent=await col.countDocuments({collectorKey,createdAt:{$gte:since}});
    if(recent>=500) return NextResponse.json({error:"Daily collection limit reached"},{status:429,headers:cors});
    const dupe=await col.findOne({collectorKey,prompt,provider,createdAt:{$gte:new Date(Date.now()-15000)}});
    if(!dupe) await col.insertOne({collectorKey,prompt,provider,createdAt:new Date()});
    return NextResponse.json({ok:true},{headers:cors});
  }catch{return NextResponse.json({error:"Unable to store prompt"},{status:500,headers:cors});}
}
export async function GET(req:NextRequest){
  const collectorKey=req.nextUrl.searchParams.get("key")||"";
  if(!KEY.test(collectorKey)) return NextResponse.json({error:"Invalid key"},{status:400,headers:cors});
  const col=await promptsCollection();
  const rows=await col.find({collectorKey},{projection:{_id:0,prompt:1,provider:1,createdAt:1}}).sort({createdAt:-1}).limit(500).toArray();
  return NextResponse.json({prompts:rows},{headers:cors});
}
export async function DELETE(req:NextRequest){
  const collectorKey=req.nextUrl.searchParams.get("key")||"";
  if(!KEY.test(collectorKey)) return NextResponse.json({error:"Invalid key"},{status:400,headers:cors});
  const col=await promptsCollection();
  const result=await col.deleteMany({collectorKey});
  return NextResponse.json({ok:true,deleted:result.deletedCount},{headers:cors});
}