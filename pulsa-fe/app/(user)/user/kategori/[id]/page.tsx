import { H2HRCatalogPage } from "@/components/shared/H2HRCatalogPage";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const values = await params;
  return <H2HRCatalogPage mode="user" categoryId={values.id} />;
}
