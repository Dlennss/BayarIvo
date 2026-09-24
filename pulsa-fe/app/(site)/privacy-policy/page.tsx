import type { Metadata } from "next";
import { PrivacyPolicyPageContent } from "@/components/site/PrivacyPolicyPageContent";
import { CANONICAL_SITE_URL } from "@/lib/seo-articles";

const pageTitle = "Privacy Policy Bayarivo | Website and Android App";
const pageDescription =
  "Privacy policy for Bayarivo website and Android application, including account data, transactions, security, and Google sign-in usage.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: `${CANONICAL_SITE_URL}/privacy-policy`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyPageContent />;
}
