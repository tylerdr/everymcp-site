import type { Metadata } from "next";
import { BuyerSignIn } from "@/components/BuyerSignIn";
import { getStarterBinding } from "@/lib/recovery/binding";
import { safeBuyerReturn } from "@/lib/buyer/context";
export const metadata:Metadata={title:"Buyer sign-in",robots:{index:false,follow:true},alternates:{canonical:"/buyer/sign-in"}};
export const dynamic="force-dynamic";
export default function BuyerSignInPage({searchParams}:{searchParams:Record<string,string|string[]|undefined>}) {
 const value=searchParams.return_to;
 return <section className="mx-auto max-w-xl space-y-5 px-4 py-16 text-foreground"><h1 className="text-3xl font-bold">Continue with your buyer email</h1><BuyerSignIn returnTo={safeBuyerReturn(Array.isArray(value)?value[0]:value)} available={!!getStarterBinding()} /></section>;
}
