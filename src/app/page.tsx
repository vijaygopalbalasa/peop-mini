import { Metadata } from "next";
import { APP_OG_IMAGE_URL } from "~/lib/constants";
import { getMiniAppEmbedMetadata } from "~/lib/utils";
import HomePage from "~/components/HomePage";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "PoEP - Proof-of-Existence Passport",
    openGraph: {
      title: "PoEP - Proof-of-Existence Passport",
      description: "Your onchain identity, secured by ZK proofs",
      images: [APP_OG_IMAGE_URL],
    },
    other: {
      "fc:frame": JSON.stringify(getMiniAppEmbedMetadata()),
      "fc:miniapp": JSON.stringify(getMiniAppEmbedMetadata()),
    },
  };
}

export default function Page() {
  return <HomePage />;
}
