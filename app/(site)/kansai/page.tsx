import { Suspense } from "react";
import RegionPageClient from "@/components/RegionPageClient";
import { fetchShopsByRegion } from "@/lib/shops-db";

export default async function KansaiPage() {
  let initialShops: Awaited<ReturnType<typeof fetchShopsByRegion>> = [];
  try {
    initialShops = await fetchShopsByRegion("kansai");
  } catch {
    initialShops = [];
  }
  return (
    <Suspense fallback={<div className="app-container"></div>}>
      <RegionPageClient region="kansai" initialShops={initialShops} />
    </Suspense>
  );
}
