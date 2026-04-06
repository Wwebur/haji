"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Search, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Region } from "@/types/region";
import type { IndustryType } from "@/lib/shopCountsAdmin";

export interface FilterState {
  keyword: string;
  area: string;
  genre: string;
  sourceArea: string;
}

interface AdminSidebarProps {
  asSheet?: boolean;
  regions: Region[];
  industryTypes: IndustryType[];
  regionNames: Record<string, string>;
  currentRegionData: Region | undefined;
  cityCountMap: Map<string, number>;
  prefectureCountMap: Map<string, number>;
  industryCountMap: Map<string, number>;
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
}

const SIDEBAR_CONTENT = ({
  regions,
  industryTypes,
  regionNames,
  currentRegionData,
  cityCountMap,
  prefectureCountMap,
  industryCountMap,
  filters,
  onFilterChange,
  keyword,
  setKeyword,
  handleSearch,
}: AdminSidebarProps & {
  keyword: string;
  setKeyword: (v: string) => void;
  handleSearch: (e: React.SyntheticEvent) => void;
}) => {
  const normalizedArea = filters.area.split("/").pop() || filters.area;

  return (
    <>
      <div className="border-b p-4">
        <form onSubmit={handleSearch} className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="キーワードで検索..."
              className="pl-8"
            />
          </div>
          <Button type="submit" size="sm" className="w-full">
            検索
          </Button>
        </form>
      </div>
      <ScrollArea className="flex-1">
        {/* ジャンルで探す - fixed industry types only */}
        <div className="border-b p-4">
          <h3 className="mb-2 text-sm font-semibold">ジャンルで探す</h3>
          <ul className="space-y-1">
            <li>
              <button
                type="button"
                onClick={() => onFilterChange({ genre: "" })}
                className={cn(
                  "w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted",
                  !filters.genre && "bg-primary/10 font-medium text-primary"
                )}
              >
                すべて
              </button>
            </li>
            {industryTypes.map((type) => {
              const count = industryCountMap.get(type.name) ?? 0;
              return (
                <li key={type.id}>
                  <button
                    type="button"
                    onClick={() => onFilterChange({ genre: type.name })}
                    className={cn(
                      "w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted",
                      filters.genre === type.name &&
                        "bg-primary/10 font-medium text-primary"
                    )}
                  >
                    {type.name} ({count})
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* エリアで探す - separate section, independent of genre */}
        <div className="border-b p-4">
          <h3 className="mb-2 text-sm font-semibold">エリアで探す</h3>
          <div className="space-y-1">
            {regions.map((region) => (
              <button
                key={region.region}
                type="button"
                onClick={() =>
                  onFilterChange({
                    sourceArea: filters.sourceArea === region.region ? "" : region.region,
                    area: "",
                  })
                }
                className={cn(
                  "w-full rounded px-2 py-1.5 text-left text-sm font-medium hover:bg-muted",
                  filters.sourceArea === region.region &&
                    "bg-primary/10 text-primary"
                )}
              >
                {regionNames[region.region] || region.region}
              </button>
            ))}
          </div>
          {currentRegionData && (
            <div className="mt-3 space-y-2 border-t pt-3">
              {currentRegionData.prefectures.map((prefecture) => {
                const prefectureCount =
                  prefectureCountMap.get(prefecture.name) || 0;
                const isPrefectureSelected =
                  normalizedArea === prefecture.slug ||
                  normalizedArea === prefecture.name ||
                  filters.area === prefecture.slug ||
                  prefecture.cities.some(
                    (city) =>
                      normalizedArea === (city.slug ?? city.name) ||
                      filters.area === `${prefecture.slug}/${city.slug ?? city.name}`
                  );
                return (
                  <div key={prefecture.slug} className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() =>
                        onFilterChange({
                          area: prefecture.slug,
                        })
                      }
                      className={cn(
                        "w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted",
                        isPrefectureSelected &&
                          "bg-primary/10 font-medium text-primary"
                      )}
                    >
                      {prefecture.name} ({prefectureCount})
                    </button>
                    <ul className="ml-3 space-y-0.5 border-l pl-2">
                      {prefecture.cities.map((city) => {
                        const cityCount = cityCountMap.get(city.name) || 0;
                        const citySlug = city.slug ?? city.name;
                        const cityValue = `${prefecture.slug}/${citySlug}`;
                        const isCitySelected =
                          normalizedArea === citySlug ||
                          filters.area === cityValue;
                        const cityKey = `${prefecture.slug}-${citySlug}`;
                        return (
                          <li key={cityKey}>
                            {city.disabled ? (
                              <span className="text-sm text-muted-foreground">
                                {city.name} ({cityCount})
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  onFilterChange({
                                    area: `${prefecture.slug}/${city.slug ?? city.name}`,
                                  })
                                }
                                className={cn(
                                  "w-full rounded px-2 py-1 text-left text-sm hover:bg-muted",
                                  isCitySelected &&
                                    "bg-primary/10 font-medium text-primary"
                                )}
                              >
                                {city.name} ({cityCount})
                              </button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </>
  );
};

export function AdminSidebar({
  asSheet,
  regions,
  industryTypes,
  regionNames,
  currentRegionData,
  cityCountMap,
  prefectureCountMap,
  industryCountMap,
  filters,
  onFilterChange,
}: AdminSidebarProps) {
  const [keyword, setKeyword] = useState(filters.keyword);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    setKeyword(filters.keyword);
  }, [filters.keyword]);

  const handleSearch = (e: React.SyntheticEvent) => {
    e.preventDefault();
    onFilterChange({ keyword });
    if (asSheet) setSheetOpen(false);
  };

  const contentProps = {
    regions,
    industryTypes,
    regionNames,
    currentRegionData,
    cityCountMap,
    prefectureCountMap,
    industryCountMap,
    filters,
    onFilterChange: (updates: Parameters<typeof onFilterChange>[0]) => {
      onFilterChange(updates);
      if (asSheet) setSheetOpen(false);
    },
    keyword,
    setKeyword,
    handleSearch,
  };

  if (asSheet) {
    return (
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm">
            <PanelLeft className="h-4 w-4" />
            フィルター
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader>
            <SheetTitle>フィルター</SheetTitle>
          </SheetHeader>
          <div className="flex h-[calc(100vh-4rem)] flex-col">
            <SIDEBAR_CONTENT {...contentProps} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside className="w-56 shrink-0 border-r bg-muted/30">
      <div className="sticky top-14 flex h-[calc(100vh-3.5rem)] flex-col">
        <SIDEBAR_CONTENT {...contentProps} />
      </div>
    </aside>
  );
}
