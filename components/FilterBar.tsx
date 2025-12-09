"use client";

import { Prefecture, IndustryType } from "@/types";
import { useState, useEffect } from "react";

interface FilterBarProps {
  prefectures: Prefecture[];
  industryTypes: IndustryType[];
  selectedArea: string;
  selectedIndustry: string;
  onFilterChange: (areaSlug: string, industryId: string) => void;
}

export default function FilterBar({ 
  prefectures, 
  industryTypes,
  selectedArea,
  selectedIndustry,
  onFilterChange 
}: FilterBarProps) {
  // Local state for dropdown values
  const [localArea, setLocalArea] = useState(selectedArea);
  const [localIndustry, setLocalIndustry] = useState(selectedIndustry);

  // Sync local state when props change (e.g., from URL or sidebar)
  useEffect(() => {
    setLocalArea(selectedArea);
  }, [selectedArea]);

  useEffect(() => {
    setLocalIndustry(selectedIndustry);
  }, [selectedIndustry]);

  const handleSearch = () => {
    onFilterChange(localArea, localIndustry);
  };

  return (
    <div className="filter-bar">
      <select 
        className="filter-select"
        value={localArea}
        onChange={(e) => setLocalArea(e.target.value)}
      >
        <option value="">エリアで絞り込み</option>
        {prefectures.map((pref) => (
          <optgroup key={pref.slug} label={pref.name}>
            <option value={pref.slug}>{pref.name}すべて</option>
            {pref.cities.map((city, idx) => (
              <option 
                key={idx} 
                value={city.slug || ""} 
                disabled={city.disabled}
              >
                {city.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      <select 
        className="filter-select"
        value={localIndustry}
        onChange={(e) => setLocalIndustry(e.target.value)}
      >
        <option value="">ジャンルで絞り込み</option>
        {industryTypes.map((type) => (
          <option key={type.id} value={type.id}>
            {type.name}
          </option>
        ))}
      </select>

      <button onClick={handleSearch} className="filter-btn">
        検索
      </button>
    </div>
  );
}

