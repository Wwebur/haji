"use client";

import { useMemo } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Sidebar from "@/components/Sidebar";
import FilterBar from "@/components/FilterBar";
import ShopCard from "@/components/ShopCard";
import Pagination from "@/components/Pagination";
import { Region, Shop, IndustryType } from "@/types";
import {
  calculateShopCounts,
  calculatePrefectureCounts,
} from "@/lib/shopCounts";
import areasData from "@/mockup/areas.json";
import shopsData from "@/mockup/shops.json";

const ITEMS_PER_PAGE = 10;

// Industry types based on the mockup
const industryTypes: IndustryType[] = [
  { id: "22", name: "ルーム型", slug: "type_industry02" },
  { id: "23", name: "出張型", slug: "type_industry03" },
  { id: "21", name: "店舗型", slug: "type_industry01" },
];

// Region display information
const regionInfo: Record<string, { name: string; nameEn: string }> = {
  kantou: { name: "関東", nameEn: "KANTOU" },
  kansai: { name: "関西", nameEn: "KANSAI" },
  tokai: { name: "東海", nameEn: "TOKAI" },
  hokkaidotohoku: { name: "北海道・東北", nameEn: "HOKKAIDO・TOHOKU" },
  koshinetuhokuriku: { name: "甲信越・北陸", nameEn: "KOSHINETSU・HOKURIKU" },
  chugokushikoku: { name: "中国・四国", nameEn: "CHUGOKU・SHIKOKU" },
  kyusyuokinawa: { name: "九州・沖縄", nameEn: "KYUSHU・OKINAWA" },
};

export default function RegionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentRegion = params.region as string;

  // Use URL params as source of truth
  const selectedArea = searchParams.get("area") || "";
  const selectedIndustry = searchParams.get("industry") || "";
  const searchKeyword = searchParams.get("keyword") || "";
  const currentPage = parseInt(searchParams.get("page") || "1");

  const regions = areasData as Region[];
  const allShops = shopsData as unknown as Shop[];

  // Get current region data
  const currentRegionData = regions.find((r) => r.region === currentRegion);
  const regionDisplayInfo = regionInfo[currentRegion] || {
    name: currentRegion,
    nameEn: currentRegion.toUpperCase(),
  };

  // Calculate actual shop counts
  const cityCountMap = useMemo(() => {
    if (!currentRegionData) return new Map<string, number>();
    return calculateShopCounts(allShops, currentRegion, currentRegionData);
  }, [allShops, currentRegion, currentRegionData]);

  const prefectureCountMap = useMemo(() => {
    if (!currentRegionData) return new Map<string, number>();
    return calculatePrefectureCounts(
      allShops,
      currentRegion,
      currentRegionData
    );
  }, [allShops, currentRegion, currentRegionData]);

  // Helper function to update URL params
  const updateURLParams = (updates: {
    area?: string;
    industry?: string;
    keyword?: string;
    page?: number;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    // Apply updates
    if (updates.area !== undefined) {
      if (updates.area) {
        params.set("area", updates.area);
      } else {
        params.delete("area");
      }
    }

    if (updates.industry !== undefined) {
      if (updates.industry) {
        params.set("industry", updates.industry);
      } else {
        params.delete("industry");
      }
    }

    if (updates.keyword !== undefined) {
      if (updates.keyword) {
        params.set("keyword", updates.keyword);
      } else {
        params.delete("keyword");
      }
    }

    if (updates.page !== undefined) {
      if (updates.page > 1) {
        params.set("page", updates.page.toString());
      } else {
        params.delete("page");
      }
    }

    const newUrl = `/${currentRegion}${params.toString() ? `?${params.toString()}` : ""
      }`;
    router.push(newUrl, { scroll: false });
  };

  // Filter shops by current region
  const filteredShops = useMemo(() => {
    let filtered = allShops.filter((shop) => shop.sourceArea === currentRegion);

    // Apply keyword filter
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(
        (shop) =>
          shop.name.toLowerCase().includes(keyword) ||
          shop.alias.toLowerCase().includes(keyword) ||
          (shop.catchCopy && shop.catchCopy.toLowerCase().includes(keyword)) ||
          shop.area.toLowerCase().includes(keyword)
      );
    }

    // Apply industry filter - only if industry is selected
    if (selectedIndustry && selectedIndustry !== "") {
      const industryType = industryTypes.find((t) => t.id === selectedIndustry);
      if (industryType) {
        filtered = filtered.filter((shop) =>
          shop.genres.includes(industryType.name)
        );
      }
    }

    // Apply area filter - calculate city names and filter
    if (selectedArea && selectedArea !== "" && currentRegionData) {
      let cityNames: string[] = [];

      for (const pref of currentRegionData.prefectures) {
        if (pref.slug === selectedArea) {
          cityNames = pref.cities.filter((c) => !c.disabled).map((c) => c.name);
          break;
        }
        const city = pref.cities.find((c) => c.slug === selectedArea);
        if (city) {
          cityNames = [city.name];
          break;
        }
      }

      if (cityNames.length > 0) {
        filtered = filtered.filter((shop) => {
          return cityNames.some((cityName) => shop.area.includes(cityName));
        });
      }
    }

    return filtered;
  }, [
    allShops,
    currentRegion,
    selectedArea,
    currentRegionData,
    selectedIndustry,
    searchKeyword,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredShops.length / ITEMS_PER_PAGE);
  const paginatedShops = filteredShops.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleFilterChange = (areaSlug: string, industryId: string) => {
    // Apply both filters together
    updateURLParams({
      industry: industryId,
      area: areaSlug,
      page: 1,
    });
  };

  const handleAreaClick = (prefectureName: string, cityNames: string[]) => {
    if (!cityNames || cityNames.length === 0) return; // safety check

    let areaSlug = "";

    if (currentRegionData) {
      for (const pref of currentRegionData.prefectures) {
        const prefCityNames = pref.cities
          .filter((c) => !c.disabled)
          .map((c) => c.name);

        // prefecture-wide selected
        if (
          JSON.stringify([...cityNames].sort()) ===
          JSON.stringify([...prefCityNames].sort())
        ) {
          areaSlug = pref.slug;
          break;
        }

        // single city
        const city = pref.cities.find((c) => c.name === cityNames[0]);
        if (city?.slug) {
          areaSlug = city.slug;
          break;
        }
      }
    }

    updateURLParams({
      area: areaSlug,
      industry: "",
      page: 1,
    });
  };

  const handleIndustryClick = (industryName: string) => {
    // Find industry ID from name
    const industryType = industryTypes.find((t) => t.name === industryName);
    updateURLParams({
      area: "",
      industry: industryType?.id || "",
      page: 1,
    });
  };

  const handlePageChange = (page: number) => {
    updateURLParams({ page });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const currentDate = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}年${String(now.getMonth() + 1).padStart(2, "0")}月${String(now.getDate()).padStart(2, "0")}日`;
  }, []);

  const handleHeaderPrefectureClick = (prefectureSlug: string) => {
    updateURLParams({ area: prefectureSlug, industry: "", page: 1 });
  };

  if (!currentRegionData) {
    return (
      <div className="app-container">
        <header className="landing-header region-page-header">
          <div className="landing-header-content">
            <h1 className="landing-title">メンズエステ求人情報サイト｜はじめてのメンズエステアルバイト【はじエス】</h1>
            <div className="header-box">
              <div className="logobox">
                <Link href="/" className="logo">
                  <Image src="/images/logo_01.png" alt="はじめてのメンズエステアルバイト" width={180} height={106} />
                </Link>
              </div>
            </div>
          </div>
        </header>
        <main className="main-content">
          <div className="error-message">
            <h2>Region not found</h2>
            <Link href="/">戻る</Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-container region-page">
      {/* Header - same style as landing page (white bg, pink border, light pink accents) */}
      <header className="landing-header region-page-header">
        <div className="landing-header-content">
          <h1 className="landing-title">
            {new Date().getFullYear()}年最新、{regionDisplayInfo.name}のメンズエステセラピスト求人情報サイト | はじめてのメンズエステアルバイト 【はじエス】
          </h1>
          <div className="header-box">
            <div className="logobox">
              <Link href="/" className="logo">
                <Image src="/images/logo_01.png" alt="はじめてのメンズエステアルバイト" width={180} height={106} />
              </Link>
              <div className="region-header-info">
                <div className="region-header-name">
                  <span className="region-name">{regionDisplayInfo.name}</span>
                  <span className="region-name-en">{regionDisplayInfo.nameEn}</span>
                </div>
                <div className="region-prefectures">
                  {currentRegionData.prefectures.map((pref, idx) => {
                    const isSelected =
                      selectedArea === pref.slug ||
                      pref.cities.some((c) => c.slug === selectedArea);
                    return (
                      <span key={pref.slug}>
                        {idx > 0 && (
                          <span className="region-prefecture-sep"> | </span>
                        )}
                        <button
                          type="button"
                          className={`region-prefecture-link${isSelected ? " is-selected" : ""}`}
                          onClick={() => handleHeaderPrefectureClick(pref.slug)}
                        >
                          {pref.name}
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
            <ul className="header-menu">
              <li className="data">
                <em>{currentDate}更新</em>
                メンズエステ求人情報<span>{filteredShops.length}</span>件掲載
              </li>
            </ul>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link href="/">メンズエステ求人TOP</Link>
        <span> &gt; </span>
        <span>{regionDisplayInfo.name}</span>
        <span> &gt; </span>
        <span>{regionDisplayInfo.name}全てのメンズエステ求人</span>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        <div className="main-bg">
          <p className="bg1"></p>
          <p className="bg2"></p>
          <p className="bg3"></p>
        </div>
        <div className="sub-bg">
          <p className="bg-circle-1"></p>
          <p className="bg-circle-2"></p>
        </div>

        <div className="content-wrapper">
          <Sidebar
            regions={regions}
            industryTypes={industryTypes}
            currentRegion={currentRegion}
            selectedArea={selectedArea}
            selectedIndustry={selectedIndustry}
            cityCountMap={cityCountMap}
            prefectureCountMap={prefectureCountMap}
            onSearch={(keyword) => updateURLParams({ keyword, page: 1 })}
            onAreaClick={(prefectureName, cityNames) =>
              handleAreaClick(prefectureName, cityNames)
            }
            onIndustryClick={(industry) => handleIndustryClick(industry)}
          />

          <div className="content-area">
            <h2 className="page-title">全てのメンズエステ求人</h2>

            <FilterBar
              prefectures={currentRegionData.prefectures}
              industryTypes={industryTypes}
              selectedArea={selectedArea}
              selectedIndustry={selectedIndustry}
              onFilterChange={handleFilterChange}
            />

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredShops.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={handlePageChange}
            />

            <div className="shop-list">
              {paginatedShops.length > 0 ? (
                paginatedShops.map((shop, index) => (
                  <ShopCard key={`${shop.id}-${index}`} shop={shop} />
                ))
              ) : (
                <div className="no-results">
                  <p>該当する求人が見つかりませんでした。</p>
                </div>
              )}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredShops.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-nav">
          <span>会社概要</span>
          <span>利用規約</span>
          <span>掲載申し込み</span>
          <span>お問い合わせ</span>
        </div>
        <p className="copyright">
          Copyright 2022 はじめてのメンズエステアルバイト All rights reserved.
        </p>
      </footer>
    </div>
  );
}
