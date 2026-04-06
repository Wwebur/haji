import type { ShopWithDetail } from "@/types/shop";
import type { Region } from "@/types/region";

export interface IndustryType {
  id: string;
  name: string;
  slug: string;
}

export const INDUSTRY_TYPES: IndustryType[] = [
  { id: "22", name: "ルーム型", slug: "type_industry02" },
  { id: "23", name: "出張型", slug: "type_industry03" },
  { id: "21", name: "店舗型", slug: "type_industry01" },
];

/**
 * Normalize genre string from DB (may contain JSON chars like ", {, })
 */
function normalizeGenreValue(val: string | null | undefined): string {
  if (!val || typeof val !== "string") return "";
  return val.replace(/["{}[\]\\]/g, "").trim();
}

/**
 * Check if shop matches an industry type by name (exported for filtering)
 */
export function shopHasIndustry(shop: ShopWithDetail, typeName: string): boolean {
  const genresRaw = shop.genres ? normalizeGenreValue(shop.genres) : "";
  const genreRaw = shop.genre ? normalizeGenreValue(shop.genre) : "";
  const combined = [genresRaw, genreRaw].filter(Boolean).join(",");
  const parts = combined.split(/[,、]/).map((p) => p.trim()).filter(Boolean);
  return parts.some((p) => p.includes(typeName) || typeName.includes(p));
}

/**
 * Calculate shop counts for each industry type (all shops, not filtered by region)
 */
export function calculateIndustryCounts(
  shops: ShopWithDetail[],
  industryTypes: IndustryType[]
): Map<string, number> {
  const countMap = new Map<string, number>();
  industryTypes.forEach((type) => {
    const count = shops.filter((shop) => shopHasIndustry(shop, type.name)).length;
    countMap.set(type.name, count);
  });
  return countMap;
}

/**
 * Get city names for area filter.
 * - prefecture slug (e.g. "area_osaka") = all cities in that prefecture
 * - city slug (e.g. "sonota") = that city (first match)
 * - composite "prefSlug/citySlug" (e.g. "area_osaka/sonota") = specific city when slug is duplicated
 */
export function getCityNamesForArea(
  selectedArea: string,
  regionData: Region | undefined
): string[] {
  if (!regionData || !selectedArea) return [];
  const parts = selectedArea.split("/");
  if (parts.length === 2) {
    const [prefSlug, citySlug] = parts;
    const pref = regionData.prefectures.find((p) => p.slug === prefSlug);
    const city = pref?.cities.find((c) => (c.slug ?? c.name) === citySlug);
    if (city) return [city.name];
    return [];
  }
  for (const pref of regionData.prefectures) {
    if (pref.slug === selectedArea) {
      return pref.cities.filter((c) => !c.disabled).map((c) => c.name);
    }
    const city = pref.cities.find((c) => (c.slug ?? c.name) === selectedArea);
    if (city) return [city.name];
  }
  return [];
}

/**
 * Calculate shop counts for each city in a region
 */
export function calculateCityCounts(
  shops: ShopWithDetail[],
  regionSlug: string,
  regionData: Region
): Map<string, number> {
  const cityCountMap = new Map<string, number>();
  const regionShops = shops.filter((shop) => shop.source_area === regionSlug);

  regionData.prefectures.forEach((prefecture) => {
    prefecture.cities.forEach((city) => {
      cityCountMap.set(city.name, 0);
    });
  });

  regionShops.forEach((shop) => {
    regionData.prefectures.forEach((prefecture) => {
      prefecture.cities.forEach((city) => {
        if (shop.area && shop.area.includes(city.name)) {
          const current = cityCountMap.get(city.name) ?? 0;
          cityCountMap.set(city.name, current + 1);
        }
      });
    });
  });

  return cityCountMap;
}

/**
 * Calculate shop counts for each prefecture in a region
 */
export function calculatePrefectureCounts(
  shops: ShopWithDetail[],
  regionSlug: string,
  regionData: Region
): Map<string, number> {
  const prefectureCountMap = new Map<string, number>();
  const cityCountMap = calculateCityCounts(shops, regionSlug, regionData);

  regionData.prefectures.forEach((prefecture) => {
    let total = 0;
    prefecture.cities.forEach((city) => {
      total += cityCountMap.get(city.name) ?? 0;
    });
    prefectureCountMap.set(prefecture.name, total);
  });

  return prefectureCountMap;
}
