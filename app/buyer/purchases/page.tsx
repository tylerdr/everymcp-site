import type { Metadata } from "next";
import { BuyerPurchases } from "@/components/BuyerPurchases";
export const metadata:Metadata={title:"Your purchases",robots:{index:false,follow:true},alternates:{canonical:"/buyer/purchases"}};
export const dynamic="force-dynamic";
export default function BuyerPurchasesPage({searchParams}:{searchParams:Record<string,string|string[]|undefined>}){
 const value=searchParams.receipt,receipt=typeof value==="string"&&/^[a-f0-9]{64}$/.test(value)?value:undefined;
 return <section className="mx-auto max-w-2xl space-y-5 px-4 py-16 text-foreground"><h1 className="text-3xl font-bold">Your starter kit purchases</h1><BuyerPurchases receipt={receipt} /></section>;
}
