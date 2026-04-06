import type { ShopWithDetail } from "@/types/shop";

/** Empty shop row for the admin “new shop” dialog (not persisted until save). */
export function createDraftShopWithDetail(): ShopWithDetail {
  const now = new Date().toISOString();
  return {
    id: "",
    name: "",
    alias: "",
    genres: "",
    genre: "",
    area: "",
    catch_copy: null,
    image_url: null,
    detail_url: "",
    source_area: "",
    data: {
      給与: null,
      資格: null,
      勤務時間: null,
      住所: null,
    },
    created_at: now,
    updated_at: now,
    shop_details: null,
  };
}
