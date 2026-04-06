import type { ShopWithDetail } from "@/types/shop";

function newDraftShopId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `shop-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/** Empty shop row for the admin “new shop” dialog (not persisted until save). */
export function createDraftShopWithDetail(): ShopWithDetail {
  const now = new Date().toISOString();
  return {
    id: newDraftShopId(),
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
