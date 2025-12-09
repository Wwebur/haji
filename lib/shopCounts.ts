import { Shop, Region } from "@/types";

/**
 * Calculate shop counts for each city in a region
 * @param shops - All shops data
 * @param regionSlug - The region slug (e.g., "kantou", "kansai")
 * @param regionData - The region data with prefecture and city information
 * @returns Map of city names to shop counts
 */
export function calculateShopCounts(
  shops: Shop[],
  regionSlug: string,
  regionData: Region
): Map<string, number> {
  const cityCountMap = new Map<string, number>();

  // Filter shops by region
  const regionShops = shops.filter((shop) => shop.sourceArea === regionSlug);

  // Initialize all cities with 0 count
  regionData.prefectures.forEach((prefecture) => {
    prefecture.cities.forEach((city) => {
      cityCountMap.set(city.name, 0);
    });
  });

  // Count shops for each city
  regionShops.forEach((shop) => {
    // Check which cities this shop belongs to
    regionData.prefectures.forEach((prefecture) => {
      prefecture.cities.forEach((city) => {
        // Check if the city name appears in the shop's area
        if (shop.area.includes(city.name)) {
          const currentCount = cityCountMap.get(city.name) || 0;
          cityCountMap.set(city.name, currentCount + 1);
        }
      });
    });
  });

  return cityCountMap;
}

/**
 * Calculate shop counts for each prefecture in a region
 * @param shops - All shops data
 * @param regionSlug - The region slug
 * @param regionData - The region data
 * @returns Map of prefecture names to shop counts
 */
export function calculatePrefectureCounts(
  shops: Shop[],
  regionSlug: string,
  regionData: Region
): Map<string, number> {
  const prefectureCountMap = new Map<string, number>();

  // Get city counts first
  const cityCountMap = calculateShopCounts(shops, regionSlug, regionData);

  // Sum up counts for each prefecture
  regionData.prefectures.forEach((prefecture) => {
    let totalCount = 0;
    prefecture.cities.forEach((city) => {
      totalCount += cityCountMap.get(city.name) || 0;
    });
    prefectureCountMap.set(prefecture.name, totalCount);
  });

  return prefectureCountMap;
}


