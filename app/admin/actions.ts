"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { Shop, ShopDetailData } from "@/types/shop";
import { revalidatePath } from "next/cache";

const SHOP_IMAGES_BUCKET = "shop-images";
const SHOP_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const SHOP_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function sanitizeUploadFileName(name: string): string {
  const base = name
    .replace(/^.*[/\\]/, "")
    .replaceAll(/[^a-zA-Z0-9._-]/g, "_");
  const trimmed = base.slice(0, 120);
  return trimmed || "image";
}

export async function uploadShopCoverImage(
  formData: FormData
): Promise<
  { success: true; publicUrl: string } | { success: false; error: string }
> {
  const shopIdRaw = formData.get("shopId");
  const file = formData.get("file");

  const shopId =
    typeof shopIdRaw === "string" ? shopIdRaw.trim() : "";
  if (!shopId) {
    return { success: false, error: "店舗IDが不正です" };
  }
  if (!(file instanceof File)) {
    return { success: false, error: "ファイルを選択してください" };
  }
  if (!SHOP_IMAGE_MIME.has(file.type)) {
    return { success: false, error: "対応形式: JPEG, PNG, WebP, GIF" };
  }
  if (file.size > SHOP_IMAGE_MAX_BYTES) {
    return { success: false, error: "5MB以下の画像を選んでください" };
  }

  let supabase;
  try {
    supabase = createServiceRoleClient();
  } catch (e) {
    console.error(e);
    return {
      success: false,
      error: "サーバー設定（SUPABASE_SERVICE_ROLE_KEY）を確認してください",
    };
  }

  const path = `${shopId}/${Date.now()}-${sanitizeUploadFileName(file.name)}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from(SHOP_IMAGES_BUCKET)
    .upload(path, bytes, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Storage upload error:", error);
    return {
      success: false,
      error: error.message || "画像のアップロードに失敗しました",
    };
  }

  const { data } = supabase.storage
    .from(SHOP_IMAGES_BUCKET)
    .getPublicUrl(path);

  return { success: true, publicUrl: data.publicUrl };
}

export async function updateShop(
  shop: Shop
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("shops")
    .update({
      name: shop.name,
      alias: shop.alias,
      genre: shop.genre,
      genres: shop.genres,
      area: shop.area,
      catch_copy: shop.catch_copy,
      image_url: shop.image_url,
      detail_url: shop.detail_url,
      source_area: shop.source_area,
      data: shop.data,
    })
    .eq("id", shop.id);

  if (error) {
    console.error("Error updating shop:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/", "page");

  return { success: true };
}

export async function createShop(
  shop: Shop
): Promise<{ success: boolean; error?: string }> {
  const id = shop.id?.trim();
  if (!id) {
    return { success: false, error: "店舗IDが必要です" };
  }

  const supabase = await createClient();
  const now = new Date().toISOString();

  const { error } = await supabase.from("shops").insert({
    id,
    name: shop.name ?? "",
    alias: shop.alias ?? "",
    genre: shop.genre ?? "",
    genres: shop.genres ?? "",
    area: shop.area ?? "",
    catch_copy: shop.catch_copy,
    image_url: shop.image_url,
    detail_url: shop.detail_url ?? "",
    source_area: shop.source_area ?? "",
    data: shop.data,
    created_at: now,
    updated_at: now,
  });

  if (error) {
    console.error("Error creating shop:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/", "page");

  return { success: true };
}

export async function deleteShop(
  shopId: string
): Promise<{ success: boolean; error?: string }> {
  const id = shopId?.trim();
  if (!id) {
    return { success: false, error: "店舗IDが必要です" };
  }

  const supabase = await createClient();

  const { error: detailError } = await supabase
    .from("shop_details")
    .delete()
    .eq("shop_id", id);

  if (detailError) {
    console.error("Error deleting shop_details:", detailError);
    return { success: false, error: detailError.message };
  }

  const { error } = await supabase.from("shops").delete().eq("id", id);

  if (error) {
    console.error("Error deleting shop:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/", "page");

  return { success: true };
}

export async function updateShopDetail(
  shopId: string,
  detail: ShopDetailData
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("shop_details")
    .upsert(
      { shop_id: shopId, detail, updated_at: new Date().toISOString() },
      { onConflict: "shop_id" }
    );

  if (error) {
    console.error("Error updating shop detail:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/", "page");

  return { success: true };
}
