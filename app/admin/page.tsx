import { createClient } from "@/lib/supabase/server";
import { ShopWithDetail } from "@/types/shop";
import { Region } from "@/types/region";
import { AdminClient } from "./admin-client";
import areasData from "@/mockup/areas.json";

export const dynamic = "force-dynamic";

const BATCH_SIZE = 1000;

async function getShops(): Promise<ShopWithDetail[]> {
  const supabase = await createClient();
  const allShops: ShopWithDetail[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data: shops, error } = await supabase
      .from("shops")
      .select(
        `
        *,
        shop_details (
          shop_id,
          detail,
          updated_at
        )
      `
      )
      .order("updated_at", { ascending: false })
      .range(offset, offset + BATCH_SIZE - 1);

    if (error) {
      console.error("Error fetching shops:", error);
      break;
    }

    if (!shops || shops.length === 0) break;
    allShops.push(...(shops as ShopWithDetail[]));

    if (shops.length < BATCH_SIZE) {
      hasMore = false;
    } else {
      offset += BATCH_SIZE;
    }
  }

  return allShops;
}

export default async function AdminPage() {
  const shops = await getShops();
  const regions = areasData as Region[];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">店舗一覧</h2>
        <p className="text-muted-foreground">
          登録されている店舗情報を管理します（全{shops.length}件）
        </p>
      </div>

      <AdminClient shops={shops} regions={regions} />
    </div>
  );
}
