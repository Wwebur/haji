import { Suspense } from "react";
import RegionPageClient from "@/components/RegionPageClient";
import { fetchShopsByRegion } from "@/lib/shops-db";

export default async function TokaiPage() {
  let initialShops: Awaited<ReturnType<typeof fetchShopsByRegion>> = [];
  try {
    initialShops = await fetchShopsByRegion("tokai");
  } catch {
    initialShops = [];
  }
  return (
    <Suspense fallback={<div className="app-container"></div>}>
      <RegionPageClient region="tokai" initialShops={initialShops} />
    </Suspense>
  );
}
