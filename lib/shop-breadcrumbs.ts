import type { BreadcrumbItem, Shop } from "@/types/shop";
import type { City, Prefecture, Region } from "@/types/region";

const SITE_ORIGIN = "https://haji-s.com";

const BREADCRUMB_TOP: BreadcrumbItem = {
  url: `${SITE_ORIGIN}/`,
  name: "メンズエステ求人TOP",
};

function terminalBreadcrumb(shopName: string): BreadcrumbItem {
  const n = shopName?.trim() || "この店舗";
  return {
    url: null,
    name: `${n}のメンズエステ求人`,
  };
}

function findPrefectureAndCity(
  regionData: Region,
  areaName: string
): { prefecture: Prefecture; city: City | null } | null {
  const trimmed = areaName.trim();
  if (!trimmed) return null;

  for (const pref of regionData.prefectures) {
    if (pref.name === trimmed) {
      return { prefecture: pref, city: null };
    }
    const city = pref.cities.find(
      (c) => !c.disabled && c.name === trimmed
    );
    if (city) {
      return { prefecture: pref, city };
    }
  }
  return null;
}

function cityBreadcrumbUrl(
  regionSlug: string,
  prefecture: Prefecture,
  city: City
): string | null {
  if (city.url) return city.url;
  const slug = city.slug?.trim();
  if (!slug) return null;
  return `${SITE_ORIGIN}/${regionSlug}/${prefecture.slug}/${slug}`;
}

/**
 * Builds `detail.breadcrumbs` from shop geography fields and `mockup/areas.json` shape (`Region[]`).
 */
export function buildShopDetailBreadcrumbs(
  shop: Pick<Shop, "name" | "area" | "source_area">,
  regions: Region[],
  regionNames: Record<string, string>
): BreadcrumbItem[] {
  const crumbs: BreadcrumbItem[] = [{ ...BREADCRUMB_TOP }];

  const sourceSlug = shop.source_area?.trim();
  if (!sourceSlug) {
    crumbs.push(terminalBreadcrumb(shop.name));
    return crumbs;
  }

  const regionData = regions.find((r) => r.region === sourceSlug);
  if (!regionData) {
    crumbs.push(terminalBreadcrumb(shop.name));
    return crumbs;
  }

  const regionLabel = regionNames[sourceSlug] || sourceSlug;
  crumbs.push({
    url: `${SITE_ORIGIN}/${sourceSlug}`,
    name: regionLabel,
  });

  const areaName = shop.area?.trim();
  if (!areaName) {
    crumbs.push(terminalBreadcrumb(shop.name));
    return crumbs;
  }

  const found = findPrefectureAndCity(regionData, areaName);
  if (!found) {
    crumbs.push(terminalBreadcrumb(shop.name));
    return crumbs;
  }

  const { prefecture, city } = found;
  crumbs.push({
    url: prefecture.url || `${SITE_ORIGIN}/${sourceSlug}/${prefecture.slug}`,
    name: prefecture.name,
  });

  if (city) {
    const cityUrl = cityBreadcrumbUrl(sourceSlug, prefecture, city);
    crumbs.push({
      url: cityUrl,
      name: city.name,
    });
  }

  crumbs.push(terminalBreadcrumb(shop.name));
  return crumbs;
}
