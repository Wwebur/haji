export interface Shop {
  id: string;
  name: string;
  alias: string;
  genres: string[];
  genre: string;
  area: string;
  catchCopy: string | null;
  imageUrl: string | null;
  detailUrl: string;
  sourceArea: string;
  data: {
    給与: string | null;
    資格: string | null;
    勤務時間: string | null;
    住所: string | null;
  };
}

export interface City {
  name: string;
  slug?: string | null;
  url?: string | null;
  count: number;
  disabled?: boolean;
}

export interface Prefecture {
  name: string;
  slug: string;
  url: string;
  count: number;
  cities: City[];
}

export interface Region {
  region: string;
  prefectures: Prefecture[];
}

export interface IndustryType {
  id: string;
  name: string;
  slug: string;
}

