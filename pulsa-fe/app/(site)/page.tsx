import Script from "next/script";
import { getServerSession } from "next-auth";
import type { Metadata } from "next";
import { authOptions } from "@/lib/nextauth";
import type { UserSession } from "@/components/user/types";
import { BayarivoHomeConcept } from "@/components/bayarivo/BayarivoHomeConcept";
import { CANONICAL_SITE_URL } from "@/lib/seo-articles";
import { getUserProfile } from "@/lib/api.auth";

type SessionShape = {
  user?: UserSession;
  backendToken?: string;
};

const homeTitle = "Bayarivo | Pulsa, Paket Data, E-Wallet, Token Listrik, Game & PPOB";
const homeDescription =
  "Bayarivo melayani isi pulsa, paket data, top up e-wallet, token listrik, top up game, dan pembayaran PPOB dengan alur cepat untuk pelanggan, member, dan agen.";

export const metadata: Metadata = {
  title: homeTitle,
  description: homeDescription,
  keywords: [
    "Bayarivo",
    "isi pulsa online",
    "paket data murah",
    "top up e-wallet",
    "token listrik online",
    "top up game",
    "PPOB online",
  ],
  alternates: {
    canonical: CANONICAL_SITE_URL,
  },
  openGraph: {
    title: homeTitle,
    description: homeDescription,
    url: CANONICAL_SITE_URL,
    siteName: "Bayarivo",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Bayarivo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: homeTitle,
    description: homeDescription,
    images: ["/twitter-image"],
  },
};

export default async function GuestHomePage() {
  const session = (await getServerSession(authOptions)) as SessionShape | null;
  const profile = session?.backendToken ? await getUserProfile(session.backendToken).catch(() => null) : null;
  const categoryNames = [
    "Pulsa & Data",
    "Paket Internet",
    "Token Listrik",
    "E-Wallet",
    "Tagihan",
    "PPOB",
  ];

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Bayarivo",
    url: CANONICAL_SITE_URL,
    description: homeDescription,
    inLanguage: "id-ID",
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Bayarivo",
    url: CANONICAL_SITE_URL,
    logo: `${CANONICAL_SITE_URL}/bayarivo-assets/01_header/logo_symbol.png`,
    image: `${CANONICAL_SITE_URL}/opengraph-image`,
    description: homeDescription,
  };

  const catalogJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Bayarivo",
    url: CANONICAL_SITE_URL,
    description: homeDescription,
    about: categoryNames,
    mainEntity: {
      "@type": "OfferCatalog",
      name: "Kategori Produk Bayarivo",
      itemListElement: categoryNames.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Thing",
          name: item,
        },
      })),
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Produk apa saja yang tersedia di Bayarivo?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Bayarivo menyediakan isi pulsa, paket data, top up e-wallet, token listrik, top up game, BPJS, PDAM, internet pascabayar, TV, dan layanan PPOB lain untuk pelanggan, member, dan agen.",
        },
      },
      {
        "@type": "Question",
        name: "Apakah Bayarivo cocok untuk calon member dan agen?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Ya. Bayarivo bisa dipakai untuk kebutuhan transaksi harian sekaligus untuk member, agen, reseller, dan kebutuhan H2H dengan katalog produk digital yang lengkap.",
        },
      },
      {
        "@type": "Question",
        name: "Apa keunggulan Bayarivo untuk transaksi produk digital?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Bayarivo menata kategori produk secara jelas, menyediakan banyak layanan dalam satu tempat, dan memudahkan pembeli maupun penjual untuk melayani kebutuhan digital harian dengan lebih cepat.",
        },
      },
    ],
  };

  return (
    <>
      <Script id="homepage-website-jsonld" type="application/ld+json">
        {JSON.stringify(websiteJsonLd)}
      </Script>
      <Script id="homepage-organization-jsonld" type="application/ld+json">
        {JSON.stringify(organizationJsonLd)}
      </Script>
      <Script id="homepage-catalog-jsonld" type="application/ld+json">
        {JSON.stringify(catalogJsonLd)}
      </Script>
      <Script id="homepage-faq-jsonld" type="application/ld+json">
        {JSON.stringify(faqJsonLd)}
      </Script>
      <BayarivoHomeConcept
        isLoggedIn={!!session?.backendToken}
        displayName={profile?.nama || null}
        balance={profile ? Number(profile.saldo || 0) : null}
      />
    </>
  );
}
