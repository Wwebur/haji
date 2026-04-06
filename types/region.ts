export interface City {
  name: string;
  slug?: string | null;
  url?: string | null;
  count?: number;
  disabled?: boolean;
}

export interface Prefecture {
  name: string;
  slug: string;
  url: string;
  count?: number;
  cities: City[];
}

export interface Region {
  region: string;
  prefectures: Prefecture[];
}
