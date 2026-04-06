"use client";

import { useState, useMemo, useTransition } from "react";
import { Shop, ShopWithDetail, ShopDetailData } from "@/types/shop";
import { Region } from "@/types/region";
import { ShopTable } from "@/components/admin/shop-table";
import { AdminSidebar, type FilterState } from "@/components/admin/admin-sidebar";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  getCityNamesForArea,
  calculateCityCounts,
  calculatePrefectureCounts,
  calculateIndustryCounts,
  shopHasIndustry,
  INDUSTRY_TYPES,
} from "@/lib/shopCountsAdmin";
import { createShop, deleteShop, updateShop, updateShopDetail } from "./actions";
import { toast } from "sonner";

const REGION_NAMES: Record<string, string> = {
  kantou: "関東",
  kansai: "関西",
  tokai: "東海",
  hokkaidotohoku: "北海道・東北",
  koshinetuhokuriku: "甲信越・北陸",
  chugokushikoku: "中国・四国",
  kyusyuokinawa: "九州・沖縄",
};

interface AdminClientProps {
  shops: ShopWithDetail[];
  regions: Region[];
}

function shopMatchesKeyword(shop: ShopWithDetail, keyword: string): boolean {
  if (!keyword.trim()) return true;
  const k = keyword.toLowerCase();
  return (
    shop.name?.toLowerCase().includes(k) ||
    shop.alias?.toLowerCase().includes(k) ||
    shop.id.toLowerCase().includes(k) ||
    (shop.catch_copy?.toLowerCase().includes(k) ?? false)
  );
}

function shopMatchesGenre(shop: ShopWithDetail, genre: string): boolean {
  if (!genre) return true;
  return shopHasIndustry(shop, genre);
}

export function AdminClient({
  shops: initialShops,
  regions,
}: AdminClientProps) {
  const [shops, setShops] = useState(initialShops);
  const [, startTransition] = useTransition();
  const isMobile = useIsMobile();
  const [filters, setFilters] = useState<FilterState>({
    keyword: "",
    area: "",
    genre: "",
    sourceArea: "",
  });

  const handleFilterChange = (updates: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const currentRegionData = useMemo(
    () => regions.find((r) => r.region === filters.sourceArea),
    [regions, filters.sourceArea]
  );

  const cityCountMap = useMemo(() => {
    if (!currentRegionData || !filters.sourceArea) return new Map<string, number>();
    return calculateCityCounts(shops, filters.sourceArea, currentRegionData);
  }, [shops, filters.sourceArea, currentRegionData]);

  const prefectureCountMap = useMemo(() => {
    if (!currentRegionData || !filters.sourceArea) return new Map<string, number>();
    return calculatePrefectureCounts(shops, filters.sourceArea, currentRegionData);
  }, [shops, filters.sourceArea, currentRegionData]);

  const industryCountMap = useMemo(
    () => calculateIndustryCounts(shops, INDUSTRY_TYPES),
    [shops]
  );

  const filteredShops = useMemo(() => {
    return shops.filter((shop) => {
      if (!shopMatchesKeyword(shop, filters.keyword)) return false;
      if (!shopMatchesGenre(shop, filters.genre)) return false;
      if (filters.sourceArea && shop.source_area !== filters.sourceArea)
        return false;
      const cityNames = getCityNamesForArea(filters.area, currentRegionData);
      if (cityNames.length > 0) {
        const matches = cityNames.some((cityName) =>
          shop.area ? shop.area.includes(cityName) : false
        );
        if (!matches) return false;
      }
      return true;
    });
  }, [shops, filters, currentRegionData]);

  const handleShopUpdate = async (updatedShop: Shop, detail?: ShopDetailData) => {
    startTransition(async () => {
      try {
        const shopResult = await updateShop(updatedShop);
        if (!shopResult.success) {
          toast.error(shopResult.error || "更新に失敗しました");
          return;
        }

        if (detail) {
          const detailResult = await updateShopDetail(updatedShop.id, detail);
          if (!detailResult.success) {
            toast.error(detailResult.error || "詳細情報の更新に失敗しました");
            return;
          }
        }

        setShops((prevShops) =>
          prevShops.map((shop) => {
            if (shop.id !== updatedShop.id) return shop;
            const next = { ...shop, ...updatedShop };
            if (detail && next.shop_details) {
              next.shop_details = { ...next.shop_details, detail, updated_at: new Date().toISOString() };
            } else if (detail) {
              next.shop_details = { shop_id: shop.id, detail, updated_at: new Date().toISOString() };
            }
            return next;
          })
        );
        toast.success("店舗情報を更新しました");
      } catch {
        toast.error("予期せぬエラーが発生しました");
      }
    });
  };

  const handleShopCreate = async (newShop: Shop, detail?: ShopDetailData) => {
    const shopResult = await createShop(newShop);
    if (!shopResult.success) {
      toast.error(shopResult.error || "店舗の作成に失敗しました");
      throw new Error(shopResult.error || "createShop failed");
    }

    if (detail) {
      const detailResult = await updateShopDetail(newShop.id, detail);
      if (!detailResult.success) {
        toast.error(detailResult.error || "詳細情報の保存に失敗しました");
        throw new Error(detailResult.error || "updateShopDetail failed");
      }
    }

    const now = new Date().toISOString();
    const row: ShopWithDetail = {
      ...newShop,
      created_at: newShop.created_at || now,
      updated_at: now,
      shop_details: detail
        ? {
            shop_id: newShop.id,
            detail,
            updated_at: now,
          }
        : null,
    };
    setShops((prev) => [row, ...prev]);
    toast.success("店舗を登録しました");
  };

  const handleShopDelete = async (shopId: string): Promise<boolean> => {
    try {
      const result = await deleteShop(shopId);
      if (!result.success) {
        toast.error(result.error || "削除に失敗しました");
        return false;
      }
      setShops((prev) => prev.filter((s) => s.id !== shopId));
      toast.success("店舗を削除しました");
      return true;
    } catch {
      toast.error("予期せぬエラーが発生しました");
      return false;
    }
  };

  const areaOptions = useMemo(() => {
    if (!currentRegionData) return [];
    const options: {
      key: string;
      value: string;
      label: string;
      type: "prefecture" | "city";
    }[] = [];
    currentRegionData.prefectures.forEach((pref) => {
      options.push({
        key: `pref-${pref.slug}`,
        value: pref.slug,
        label: `${pref.name}（すべて）`,
        type: "prefecture",
      });
      pref.cities
        .filter((c) => !c.disabled)
        .forEach((city) => {
          const citySlug = city.slug ?? city.name;
          options.push({
            key: `${pref.slug}-${citySlug}`,
            value: `${pref.slug}/${citySlug}`,
            label: city.name,
            type: "city",
          });
        });
    });
    return options;
  }, [currentRegionData]);

  return (
    <div className="flex gap-4">
      {!isMobile && (
        <AdminSidebar
          regions={regions}
          industryTypes={INDUSTRY_TYPES}
          regionNames={REGION_NAMES}
          currentRegionData={currentRegionData}
          cityCountMap={cityCountMap}
          prefectureCountMap={prefectureCountMap}
          industryCountMap={industryCountMap}
          filters={filters}
          onFilterChange={handleFilterChange}
        />
      )}

      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {isMobile && (
            <AdminSidebar
              asSheet
              regions={regions}
              industryTypes={INDUSTRY_TYPES}
              regionNames={REGION_NAMES}
              currentRegionData={currentRegionData}
              cityCountMap={cityCountMap}
              prefectureCountMap={prefectureCountMap}
              industryCountMap={industryCountMap}
              filters={filters}
              onFilterChange={handleFilterChange}
            />
          )}
          <div className="flex-1 min-w-0">
            <AdminFilterBar
              regions={regions}
              industryTypes={INDUSTRY_TYPES}
              areaOptions={areaOptions}
              regionNames={REGION_NAMES}
              filters={filters}
              onFilterChange={handleFilterChange}
            />
          </div>
        </div>

        <ShopTable
          shops={filteredShops}
          regions={regions}
          industryTypes={INDUSTRY_TYPES}
          regionNames={REGION_NAMES}
          onShopUpdate={handleShopUpdate}
          onShopCreate={handleShopCreate}
          onShopDelete={handleShopDelete}
        />
      </div>
    </div>
  );
}
