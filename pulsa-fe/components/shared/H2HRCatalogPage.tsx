import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
import { notFound } from "next/navigation";
import { getAppServerSession } from "@/lib/server-auth";
import { getCategories, getBrandsByKategori, getProductsByBrand } from "@/lib/api.products";
import { getBrandLogo } from "@/lib/brand-logos";
import type { UserCategoryItem } from "@/components/user/types";
import { UserBottomNav } from "@/components/user/UserBottomNav";
import { GuestBottomNav } from "@/components/guest/GuestBottomNav";
import { ServiceDirectory } from "./ServiceDirectory";
import { H2HRCatalogProducts } from "./H2HRCatalogProducts";

export async function H2HRCatalogPage({ mode, categoryId, brandId, query = "" }: {
  mode: "guest" | "user"; categoryId?: string; brandId?: string; query?: string;
}) {
  const categories = await getCategories() as UserCategoryItem[];
  const session = await getAppServerSession();
  const prefix = mode === "user" ? "/user/kategori" : "/kategori";
  const category = categories.find(item => String(item.id) === categoryId);
  if (categoryId && !category) notFound();
  const brands = category ? await getBrandsByKategori(String(category.id)) : [];
  const brand = brands.find(item => String(item.id) === brandId);
  if (brandId && !brand) notFound();
  const products = category && brand ? await getProductsByBrand(String(category.id), String(brand.id)) : [];
  const backHref = brand ? `${prefix}/${categoryId}` : category ? prefix : mode === "user" ? "/user" : "/";

  return <main className="min-h-screen bg-[#f4f9fc] px-4 pb-28 pt-5 text-slate-900">
    <header className="mb-5 flex items-center gap-3">
      <Link href={backHref} aria-label="Kembali" title="Kembali" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white"><ArrowLeft className="h-5 w-5" /></Link>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase text-sky-700">Pulsa24Jam H2HR{brand ? ` / ${category?.nama}` : ""}</p>
        <h1 className="mt-1 break-words text-xl font-bold leading-tight">{brand?.nama || category?.nama || "Semua layanan"}</h1>
      </div>
    </header>
    {!category ? <ServiceDirectory mode={mode} categories={categories} initialQuery={query} /> : brand ? <H2HRCatalogProducts items={products} /> : <>
      <p className="mb-4 text-xs text-slate-500">{brands.length} provider</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {brands.map(item => {
          const logo = getBrandLogo(item.nama);
          return <Link key={item.id} href={`${prefix}/${category.id}/brand/${item.id}`} prefetch={false} className="flex min-w-0 flex-col items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 text-center transition hover:border-sky-400">
            <span className="grid h-14 w-20 place-items-center">
              {logo ? <Image src={logo.src} alt={logo.alt} width={80} height={56} className="h-14 w-20 object-contain" /> : <Building2 aria-hidden="true" className="h-7 w-7 text-slate-400" />}
            </span>
            <span className="break-words text-xs font-semibold leading-relaxed">{item.nama}</span>
          </Link>;
        })}
      </div>
      {brands.length === 0 && <p className="py-8 text-center text-sm text-slate-500">Belum ada provider aktif.</p>}
    </>}
    {mode === "user" ? <UserBottomNav /> : <GuestBottomNav isLoggedIn={!!session?.backendToken} />}
  </main>;
}
