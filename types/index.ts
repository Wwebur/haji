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

// Shop detail page (from shops-with-details.json)
export interface BreadcrumbItem {
  name: string;
  url: string | null;
}

export interface ShopDetailImage {
  url: string;
  caption: string;
}

export interface ShopDetailPrePlan {
  imageUrl: string;
  linkUrl: string;
}

export interface ShopDetailPresentImage {
  imageUrl: string;
  linkUrl: string;
}

export interface ShopDetailKyubo {
  date: string;
  title: string;
  content: string;
  contentHtml: string;
}

export interface ShopDetailBenefit {
  label: string;
  active: boolean;
}

export interface ShopDetailShopInfo {
  店名: string;
  住所: string;
  電話番号: string;
  営業時間: string;
  アクセス: string;
  ホームページ: Array<{ text: string; href: string }>;
}

export interface ShopDetail {
  breadcrumbs: BreadcrumbItem[];
  catchCopy: string;
  mainImages: string[];
  description: string;
  descriptionHtml: string;
  images: ShopDetailImage[];
  prImage: string | null;
  prePlan: ShopDetailPrePlan | null;
  sidebarPresentImage: ShopDetailPresentImage | null;
  kyubo: ShopDetailKyubo | null;
  gallery: string[];
  recruitDetails: Record<string, string>;
  recruitDetailsHtml: Record<string, string>;
  shopInfo: ShopDetailShopInfo;
  benefits: ShopDetailBenefit[];
  applicationFlow: string[];
  applicationFlowHtml: string[];
  applicationFlowNote: string | null;
  applicationFlowNoteHtml: string | null;
  ouboFormUrl: string | null;
  mapUrl: string | null;
  mapCaption?: string | null;
}

export interface ShopWithDetail {
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
  detail: ShopDetail;
}

