import { createSupabaseClient } from "@/lib/supabase";
import type { Shop, ShopWithDetail, ShopDetail } from "@/types";

/** Parse genres from DB: handles string[] (array), JSON ['a','b'], or PostgreSQL format {a,b} / {"a","b"}. */
function parseGenres(genres: unknown): string[] {
  if (Array.isArray(genres)) return genres.filter((g): g is string => typeof g === "string");
  if (typeof genres !== "string") return [];

  const s = genres.trim();

  // PostgreSQL array format: {"ルーム型"} or {"ルーム型","出張型"}
  if (s.startsWith("{") && s.endsWith("}")) {
    const inner = s.slice(1, -1);
    if (!inner) return [];
    return inner.split(",").map((p) => p.trim().replace(/^"|"$/g, ""));
  }

  // JSON format: ["ルーム型"]
  try {
    const parsed = JSON.parse(s) as unknown;
    return Array.isArray(parsed) ? parsed.filter((g): g is string => typeof g === "string") : [];
  } catch {
    return [];
  }
}

const DEFAULT_DATA = {
  給与: null as string | null,
  資格: null as string | null,
  勤務時間: null as string | null,
  住所: null as string | null,
};

/** Extract value for a key from non-JSON string like "(給与:最低60%~最大80%の報)" or "給与:value". */
function extractFromMalformed(str: string, key: string): string | null {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = str.match(new RegExp(`[\\(（]?${escaped}\\s*[：:]\\s*([^)）]*)`, "i"));
  return m?.[1]?.trim() || null;
}

/** Normalize shops.data from DB: handles jsonb object, string (try parse), or invalid/missing. */
function normalizeShopData(data: unknown): Shop["data"] {
  if (data == null) return { ...DEFAULT_DATA };

  if (typeof data === "string") {
    const s = data.trim();
    try {
      const parsed = JSON.parse(s) as unknown;
      return normalizeShopData(parsed);
    } catch {
      return {
        給与: extractFromMalformed(s, "給与") ?? DEFAULT_DATA.給与,
        資格: extractFromMalformed(s, "資格") ?? DEFAULT_DATA.資格,
        勤務時間: extractFromMalformed(s, "勤務時間") ?? DEFAULT_DATA.勤務時間,
        住所:
          extractFromMalformed(s, "住所") ??
          extractFromMalformed(s, "勤務地") ??
          DEFAULT_DATA.住所,
      };
    }
  }

  if (typeof data !== "object" || Array.isArray(data)) return { ...DEFAULT_DATA };

  const obj = data as Record<string, unknown>;
  const str = (v: unknown) =>
    typeof v === "string" && v.trim() ? v : null;
  return {
    給与: str(obj.給与) ?? DEFAULT_DATA.給与,
    資格: str(obj.資格) ?? DEFAULT_DATA.資格,
    勤務時間: str(obj.勤務時間) ?? DEFAULT_DATA.勤務時間,
    住所:
      str(obj.住所) ?? str(obj.勤務地) ?? DEFAULT_DATA.住所,
  };
}

/** Map DB shop row (snake_case) to app Shop (camelCase). */
function rowToShop(row: {
  id: string;
  name: string | null;
  alias: string | null;
  genres: string[] | string | null;
  genre: string | null;
  area: string | null;
  catch_copy: string | null;
  image_url: string | null;
  detail_url: string | null;
  source_area: string | null;
  data?: unknown;
}): Shop {
  return {
    id: row.id,
    name: row.name ?? "",
    alias: row.alias ?? "",
    genres: parseGenres(row.genres),
    genre: row.genre ?? "",
    area: row.area ?? "",
    catchCopy: row.catch_copy ?? null,
    imageUrl: row.image_url ?? null,
    detailUrl: row.detail_url ?? "",
    sourceArea: row.source_area ?? "",
    data: normalizeShopData(row.data),
  };
}

/** Fetch total count of shops from Supabase (for landing page). */
export async function fetchTotalShopCount(): Promise<number> {
  const supabase = createSupabaseClient();
  const { count, error } = await supabase
    .from("shops")
    .select("id", { count: "exact", head: true });

  if (error) return 0;
  return count ?? 0;
}

/** Fetch all shops for a region from Supabase. */
export async function fetchShopsByRegion(region: string): Promise<Shop[]> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("shops")
    .select("id, name, alias, genres, genre, area, catch_copy, image_url, detail_url, source_area, data")
    .eq("source_area", region);

  if (error) throw new Error(`Supabase shops fetch failed: ${error.message}`);
  return (data ?? []).map(rowToShop);
}

/** Fetch one shop with its detail by region and id. Returns null if not found or detail missing. */
export async function fetchShopWithDetail(
  region: string,
  id: string
): Promise<ShopWithDetail | null> {
  const supabase = createSupabaseClient();

  const { data: shopRow, error: shopError } = await supabase
    .from("shops")
    .select("id, name, alias, genres, genre, area, catch_copy, image_url, detail_url, source_area, data")
    .eq("id", id)
    .eq("source_area", region)
    .single();

  if (shopError || !shopRow) return null;

  const { data: detailRow, error: detailError } = await supabase
    .from("shop_details")
    .select("detail")
    .eq("shop_id", id)
    .single();

  if (detailError || !detailRow?.detail) return null;

  const detail = detailRow.detail as ShopDetail;
  if (!detail.breadcrumbs) detail.breadcrumbs = [];

  const shop = rowToShop(shopRow);
  return { ...shop, detail };
}

const SHOP_PARAMS_PAGE_SIZE = 1000;

/** Fetch all (region, id) pairs for generateStaticParams from the shops table.
 * Uses shops (not shop_details) so every shop link from the list has a param; required with output: "export".
 * Shops without detail data will 404 when opened (fetchShopWithDetail returns null).
 */
export async function fetchShopDetailParams(): Promise<{ region: string; id: string }[]> {
  const supabase = createSupabaseClient();
  const results: { region: string; id: string }[] = [];
  let offset = 0;

  while (true) {
    const { data: shopRows, error } = await supabase
      .from("shops")
      .select("id, source_area")
      .not("source_area", "is", null)
      .range(offset, offset + SHOP_PARAMS_PAGE_SIZE - 1);

    if (error) return [];
    if (!shopRows?.length) break;

    for (const s of shopRows) {
      if (s.id && s.source_area) {
        results.push({ region: s.source_area as string, id: s.id });
      }
    }
    if (shopRows.length < SHOP_PARAMS_PAGE_SIZE) break;
    offset += SHOP_PARAMS_PAGE_SIZE;
  }

  return results;
}
