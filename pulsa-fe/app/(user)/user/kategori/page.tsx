import { H2HRCatalogPage } from "@/components/shared/H2HRCatalogPage";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const values = await searchParams;
  return <H2HRCatalogPage mode="user" query={values.q} />;
}
