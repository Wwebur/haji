"use client";

import { Region, IndustryType } from "@/types";
import { useState } from "react";

interface SidebarProps {
  regions: Region[];
  industryTypes: IndustryType[];
  currentRegion: string;
  cityCountMap: Map<string, number>;
  prefectureCountMap: Map<string, number>;
  onSearch: (keyword: string) => void;
  onAreaClick: (prefectureName: string, cityNames: string[]) => void;
  onIndustryClick: (industryId: string) => void;
}

export default function Sidebar({ 
  regions,
  industryTypes,
  currentRegion,
  cityCountMap,
  prefectureCountMap,
  onSearch,
  onAreaClick,
  onIndustryClick
}: SidebarProps) {
  const [keyword, setKeyword] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(keyword);
  };

  const currentRegionData = regions.find(r => r.region === currentRegion);

  const handlePrefectureClick = (e: React.MouseEvent, prefectureName: string, cities: { name: string; disabled?: boolean }[]) => {
    e.preventDefault();
    // Get all city names from this prefecture (excluding disabled ones)
    const cityNames = cities.filter(c => !c.disabled).map(c => c.name);
    onAreaClick(prefectureName, cityNames);
  };

  const handleCityClick = (e: React.MouseEvent, cityName: string) => {
    e.preventDefault();
    onAreaClick("", [cityName]);
  };

  const handleIndustryClick = (e: React.MouseEvent, industryName: string) => {
    e.preventDefault();
    onIndustryClick(industryName);
  };

  return (
    <aside className="sidebar">
      {/* Search Box */}
      <div className="search-box">
        <form onSubmit={handleSearch}>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="キーワードを入力"
            className="search-input"
          />
          <button type="submit" className="search-btn">検索</button>
        </form>
      </div>

      {/* Genre Filter */}
      <div className="filter-section">
        <h3 className="filter-title">ジャンルで探す</h3>
        <ul className="filter-list">
          {industryTypes.map((type) => (
            <li key={type.id}>
              <a 
                href="#"
                onClick={(e) => handleIndustryClick(e, type.name)}
              >
                {type.name}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Area Navigation */}
      <div className="filter-section">
        <h3 className="filter-title">エリアで探す</h3>
        <div className="area-list">
          {currentRegionData?.prefectures.map((prefecture) => {
            const prefectureCount = prefectureCountMap.get(prefecture.name) || 0;
            
            return (
              <div key={prefecture.slug} className="prefecture-section">
                <a 
                  href="#"
                  onClick={(e) => handlePrefectureClick(e, prefecture.name, prefecture.cities)}
                  className="prefecture-link"
                >
                  {prefecture.name}({prefectureCount})
                </a>
                <ul className="city-list">
                  {prefecture.cities.map((city, idx) => {
                    const cityCount = cityCountMap.get(city.name) || 0;
                    
                    return (
                      <li key={idx}>
                        {!city.disabled ? (
                          <a 
                            href="#"
                            onClick={(e) => handleCityClick(e, city.name)}
                          >
                            {city.name}({cityCount})
                          </a>
                        ) : (
                          <span className="disabled">
                            {city.name}({cityCount})
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}


