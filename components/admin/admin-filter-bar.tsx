"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { FilterState } from "./admin-sidebar";
import type { IndustryType } from "@/lib/shopCountsAdmin";

interface AreaOption {
  key: string;
  value: string;
  label: string;
  type: "prefecture" | "city";
}

interface AdminFilterBarProps {
  regions: { region: string }[];
  industryTypes: IndustryType[];
  areaOptions: AreaOption[];
  regionNames: Record<string, string>;
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
}

export function AdminFilterBar({
  regions,
  industryTypes,
  areaOptions,
  regionNames,
  filters,
  onFilterChange,
}: AdminFilterBarProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="店舗名・IDで検索..."
          value={filters.keyword}
          onChange={(e) => onFilterChange({ keyword: e.target.value })}
          className="pl-9"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={filters.sourceArea || "all"}
          onValueChange={(v) =>
            onFilterChange({
              sourceArea: v === "all" ? "" : v,
              area: "",
            })
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="地域を選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべての地域</SelectItem>
            {regions.map((r) => (
              <SelectItem key={r.region} value={r.region}>
                {regionNames[r.region] || r.region}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.area || "all"}
          onValueChange={(v) => onFilterChange({ area: v === "all" ? "" : v })}
          disabled={!filters.sourceArea}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="エリアで絞り込み" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべてのエリア</SelectItem>
            {areaOptions.map((opt) => (
              <SelectItem key={opt.key} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.genre || "all"}
          onValueChange={(v) => onFilterChange({ genre: v === "all" ? "" : v })}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="ジャンルで絞り込み" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべてのジャンル</SelectItem>
            {industryTypes.map((type) => (
              <SelectItem key={type.id} value={type.name}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
