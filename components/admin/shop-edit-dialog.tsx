"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Shop,
  ShopWithDetail,
  ShopDetailData,
  ShopDetailBenefit,
  ShopDetailImage,
  ShopDetailPrePlan,
  ShopDetailPresentImage,
  ShopDetailShopInfo,
} from "@/types/shop";
import { Region } from "@/types/region";
import { IndustryType } from "@/lib/shopCountsAdmin";
import { buildShopDetailBreadcrumbs } from "@/lib/shop-breadcrumbs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { HtmlEditor } from "@/components/ui/html-editor";
import { ShopCoverImageField } from "@/components/admin/shop-cover-image-field";
import { ShopStorageImageSlot } from "@/components/admin/shop-storage-image-slot";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const DETAIL_MEDIA_SLOT_COUNT = 3;
const DETAIL_MEDIA_SLOT_INDEXES = [0, 1, 2] as const;

/** Fixed keys for `recruitDetailsHtml`; insertion order matches saved JSON. */
const RECRUIT_DETAILS_HTML_KEYS = [
  "待遇",
  "給与",
  "職種",
  "資格",
  "勤務地",
  "勤務日",
  "勤務時間",
  "応募特典",
] as const;

type RecruitDetailsHtmlKey = (typeof RECRUIT_DETAILS_HTML_KEYS)[number];

function normalizeRecruitDetailsHtml(
  saved: Record<string, string> | undefined | null
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of RECRUIT_DETAILS_HTML_KEYS) {
    out[k] = saved?.[k] ?? "";
  }
  return out;
}

const RECRUIT_DETAILS_HTML_EDITOR_MIN_HEIGHT: Partial<
  Record<RecruitDetailsHtmlKey, string>
> = {
  職種: "100px",
  応募特典: "100px",
};

function recruitDetailsHtmlMinHeight(key: RecruitDetailsHtmlKey): string {
  return RECRUIT_DETAILS_HTML_EDITOR_MIN_HEIGHT[key] ?? "140px";
}

/** Coerce stored value to `string[]` so bad API data cannot break the form. */
function normalizeApplicationFlowHtml(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) =>
    typeof item === "string" ? item : String(item ?? "")
  );
}

/** Fixed benefit labels; order is preserved in saved JSON. */
const SHOP_DETAIL_BENEFIT_LABELS = [
  "経験者優遇",
  "未経験者大歓迎",
  "完全全額日払い制",
  "交通費支給",
  "面接交通費支給",
  "高額バック",
  "送迎有",
  "アリバイ対策",
  "NEWOPEN",
  "寮完備",
  "制服貸与",
  "個室待機",
  "ノルマ・罰金なし",
  "短時間勤務OK",
  "体験入店大歓迎",
  "資格者優遇",
  "入店祝金あり",
  "保証制度あり",
  "待機時給あり",
  "ボーナスあり",
  "掛け持ちOK",
  "即日勤務OK",
  "雑費なし",
  "SNSなし",
  "店泊OK",
  "早朝・深夜勤務",
  "資格取得支援あり",
  "女性講師在籍",
  "託児所完備",
  "自宅派遣なし",
] as const;

function defaultBenefitsList(): ShopDetailBenefit[] {
  return SHOP_DETAIL_BENEFIT_LABELS.map((label) => ({ label, active: false }));
}

function mergeSavedBenefits(
  saved: ShopDetailBenefit[] | undefined | null
): ShopDetailBenefit[] {
  const byLabel = new Map<string, boolean>();
  if (saved) {
    for (const b of saved) {
      if (b?.label) byLabel.set(b.label, Boolean(b.active));
    }
  }
  return SHOP_DETAIL_BENEFIT_LABELS.map((label) => ({
    label,
    active: byLabel.get(label) ?? false,
  }));
}

const DEFAULT_DETAIL: ShopDetailData = {
  breadcrumbs: [],
  catchCopy: "",
  mainImages: [],
  description: "",
  descriptionHtml: "",
  images: [],
  prImage: null,
  prePlan: null,
  sidebarPresentImage: null,
  kyubo: null,
  gallery: [],
  recruitDetails: {},
  recruitDetailsHtml: normalizeRecruitDetailsHtml(null),
  shopInfo: {
    店名: "",
    住所: "",
    電話番号: "",
    営業時間: "",
    アクセス: "",
    ホームページ: [],
  },
  benefits: defaultBenefitsList(),
  applicationFlow: [],
  applicationFlowHtml: [],
  applicationFlowNote: null,
  applicationFlowNoteHtml: null,
  ouboFormUrl: null,
  mapUrl: null,
  mapCaption: null,
};

interface ShopEditDialogProps {
  shop: ShopWithDetail;
  /** When true, save creates a new row (parent must call `createShop`). New drafts get an auto-generated `id`. */
  isNewShop?: boolean;
  regions: Region[];
  industryTypes: IndustryType[];
  regionNames: Record<string, string>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (shop: Shop, detail?: ShopDetailData) => Promise<void>;
}

function getInitialDetail(shop: ShopWithDetail): ShopDetailData {
  const existing = shop.shop_details?.detail;
  if (!existing) {
    return {
      ...DEFAULT_DETAIL,
      recruitDetailsHtml: normalizeRecruitDetailsHtml(null),
    };
  }
  return {
    breadcrumbs: existing.breadcrumbs ?? [],
    catchCopy: existing.catchCopy ?? "",
    mainImages: existing.mainImages ?? [],
    description: existing.description ?? "",
    descriptionHtml: existing.descriptionHtml ?? "",
    images: existing.images ?? [],
    prImage: existing.prImage ?? null,
    prePlan: existing.prePlan ?? null,
    sidebarPresentImage: existing.sidebarPresentImage ?? null,
    kyubo: existing.kyubo ?? null,
    gallery: existing.gallery ?? [],
    recruitDetails: existing.recruitDetails ?? {},
    recruitDetailsHtml: normalizeRecruitDetailsHtml(existing.recruitDetailsHtml),
    shopInfo: existing.shopInfo ?? DEFAULT_DETAIL.shopInfo,
    benefits: mergeSavedBenefits(existing.benefits),
    applicationFlow: existing.applicationFlow ?? [],
    applicationFlowHtml: normalizeApplicationFlowHtml(
      existing.applicationFlowHtml
    ),
    applicationFlowNote: existing.applicationFlowNote ?? null,
    applicationFlowNoteHtml: existing.applicationFlowNoteHtml ?? null,
    ouboFormUrl: existing.ouboFormUrl ?? null,
    mapUrl: existing.mapUrl ?? null,
    mapCaption: existing.mapCaption ?? null,
  };
}

export function ShopEditDialog({
  shop,
  isNewShop = false,
  regions,
  industryTypes,
  regionNames,
  open,
  onOpenChange,
  onSave,
}: Readonly<ShopEditDialogProps>) {
  const [formData, setFormData] = useState<Partial<Shop>>({});
  const [detailData, setDetailData] = useState<ShopDetailData>(DEFAULT_DETAIL);
  const [isSaving, setIsSaving] = useState(false);

  const currentRegionData = useMemo(
    () => regions.find((r) => r.region === formData.source_area),
    [regions, formData.source_area]
  );

  const areaOptions = useMemo(() => {
    if (!currentRegionData) return [];
    const options: { key: string; value: string; label: string }[] = [];
    currentRegionData.prefectures.forEach((pref) => {
      options.push({
        key: `pref-${pref.slug}`,
        value: pref.name,
        label: `${pref.name}（すべて）`,
      });
      pref.cities
        .filter((c) => !c.disabled)
        .forEach((city) => {
          const citySlug = city.slug ?? city.name;
          options.push({
            key: `${pref.slug}-${citySlug}`,
            value: city.name,
            label: city.name,
          });
        });
    });
    return options;
  }, [currentRegionData]);

  useEffect(() => {
    if (open) {
      setFormData({
        id: shop.id ?? "",
        name: shop.name || "",
        alias: shop.alias || "",
        genre: shop.genre || "",
        genres: shop.genres || "",
        area: shop.area || "",
        catch_copy: shop.catch_copy || "",
        image_url: shop.image_url || "",
        source_area: shop.source_area || "",
        data: shop.data || {
          給与: null,
          資格: null,
          勤務時間: null,
          住所: null,
        },
      });
      setDetailData(getInitialDetail(shop));
    }
  }, [shop, open]);

  const resolvedShopId = (formData.id ?? shop.id).trim();
  const storageDisabled =
    isSaving || (isNewShop && resolvedShopId.length === 0);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDataChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      data: { ...prev.data, [key]: value || null } as Shop["data"],
    }));
  };

  const handleDetailChange = <K extends keyof ShopDetailData>(
    key: K,
    value: ShopDetailData[K]
  ) => {
    setDetailData((prev) => ({ ...prev, [key]: value }));
  };

  const handleDetailStringChange = (key: keyof ShopDetailData, value: string) => {
    setDetailData((prev) => ({ ...prev, [key]: value }));
  };

  const handleDescriptionHtmlChange = (html: string, plainText?: string) => {
    setDetailData((prev) => ({
      ...prev,
      descriptionHtml: html,
      description: plainText ?? prev.description,
    }));
  };

  const setMainImageSlot = (index: number, url: string) => {
    const cur = detailData.mainImages ?? [];
    const head = Array.from({ length: DETAIL_MEDIA_SLOT_COUNT }, (_, j) => cur[j] ?? "");
    head[index] = url;
    handleDetailChange("mainImages", [...head, ...cur.slice(DETAIL_MEDIA_SLOT_COUNT)]);
  };

  const setGallerySlot = (index: number, url: string) => {
    const cur = detailData.gallery ?? [];
    const head = Array.from({ length: DETAIL_MEDIA_SLOT_COUNT }, (_, j) => cur[j] ?? "");
    head[index] = url;
    handleDetailChange("gallery", [...head, ...cur.slice(DETAIL_MEDIA_SLOT_COUNT)]);
  };

  const setDetailImagesSlot = (
    index: number,
    patch: Partial<{ url: string; caption: string }>
  ) => {
    const cur = detailData.images ?? [];
    const head: ShopDetailImage[] = Array.from(
      { length: DETAIL_MEDIA_SLOT_COUNT },
      (_, j) => ({
        url: cur[j]?.url ?? "",
        caption: cur[j]?.caption ?? "",
      })
    );
    head[index] = { ...head[index], ...patch };
    handleDetailChange("images", [...head, ...cur.slice(DETAIL_MEDIA_SLOT_COUNT)]);
  };

  const handleRecruitDetailsHtmlFieldChange = (
    key: RecruitDetailsHtmlKey,
    html: string
  ) => {
    setDetailData((prev) => ({
      ...prev,
      recruitDetailsHtml: { ...prev.recruitDetailsHtml, [key]: html },
    }));
  };

  const handleApplicationFlowHtmlStepChange = (index: number, html: string) => {
    setDetailData((prev) => {
      const cur = [...(prev.applicationFlowHtml ?? [])];
      if (index < 0 || index >= cur.length) return prev;
      cur[index] = html;
      return { ...prev, applicationFlowHtml: cur };
    });
  };

  const addApplicationFlowHtmlStep = () => {
    setDetailData((prev) => ({
      ...prev,
      applicationFlowHtml: [...(prev.applicationFlowHtml ?? []), ""],
    }));
  };

  const removeApplicationFlowHtmlStep = (index: number) => {
    setDetailData((prev) => {
      const cur = [...(prev.applicationFlowHtml ?? [])];
      cur.splice(index, 1);
      return { ...prev, applicationFlowHtml: cur };
    });
  };

  const handleBenefitActiveChange = (label: string, active: boolean) => {
    setDetailData((prev) => ({
      ...prev,
      benefits: prev.benefits.map((b) =>
        b.label === label ? { ...b, active } : b
      ),
    }));
  };

  const handleShopInfoChange = (
    key: keyof ShopDetailShopInfo,
    value: string | Array<{ text: string; href: string }>
  ) => {
    setDetailData((prev) => ({
      ...prev,
      shopInfo: { ...prev.shopInfo, [key]: value } as ShopDetailShopInfo,
    }));
  };

  const handleSubmit = async () => {
    const merged = {
      ...shop,
      ...formData,
      detail_url: shop.detail_url ?? "",
    } as Shop;
    const id = merged.id?.trim() ?? "";
    if (!id) {
      toast.error("店舗IDを取得できませんでした");
      return;
    }
    if (!merged.name?.trim()) {
      toast.error("店舗名を入力してください");
      return;
    }
    if (merged.catch_copy === "") merged.catch_copy = null;

    setIsSaving(true);
    try {
      const detailForSave: ShopDetailData = {
        ...detailData,
        breadcrumbs: buildShopDetailBreadcrumbs(merged, regions, regionNames),
        recruitDetailsHtml: normalizeRecruitDetailsHtml(
          detailData.recruitDetailsHtml
        ),
        applicationFlowHtml: normalizeApplicationFlowHtml(
          detailData.applicationFlowHtml
        ),
      };
      await onSave(merged, detailForSave);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(92vh,100dvh-1rem)] w-full max-w-3xl min-h-0 flex-col gap-0 overflow-hidden border-border/80 bg-background/95 p-0 shadow-lg backdrop-blur-sm sm:max-w-3xl">
        <DialogHeader className="shrink-0 space-y-1 border-b border-border/60 bg-muted/20 px-5 py-4 text-left sm:px-6">
          <DialogTitle className="text-lg font-semibold tracking-tight">
            {isNewShop ? "新規店舗の登録" : "店舗情報の編集"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {isNewShop
              ? "店舗名は必須です。店舗IDは自動で発行されます。"
              : `店舗ID: ${shop.id}`}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          defaultValue="basic"
          className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 pb-0 pt-3 sm:px-6"
        >
          <TabsList className="grid h-10 w-full shrink-0 grid-cols-4 gap-1 rounded-lg bg-muted/60 p-1">
            <TabsTrigger
              value="basic"
              className="rounded-md text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm sm:text-sm"
            >
              基本情報
            </TabsTrigger>
            <TabsTrigger
              value="data"
              className="rounded-md text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm sm:text-sm"
            >
              追加データ
            </TabsTrigger>
            <TabsTrigger
              value="detail"
              className="rounded-md text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm sm:text-sm"
            >
              詳細情報
            </TabsTrigger>
            <TabsTrigger
              value="media"
              className="rounded-md text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm sm:text-sm"
            >
              画像・メディア
            </TabsTrigger>
          </TabsList>

          <div className="mt-3 min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain pb-4 pr-2 [-webkit-overflow-scrolling:touch]">
            <TabsContent value="basic" className="mr-1 space-y-1 rounded-xl border border-border/50 bg-card/40 p-4 pr-3 shadow-sm outline-none">
              <FieldGroup className="gap-4">
                {isNewShop ? (
                  <Field>
                    <FieldLabel>店舗ID（自動発行）</FieldLabel>
                    <div className="rounded-md border border-border/60 bg-muted/40 px-3 py-2 font-mono text-sm text-foreground">
                      {formData.id ?? shop.id ?? "—"}
                    </div>
                    <p className="text-muted-foreground text-xs">
                      画像アップロードや保存に使用します。手入力は不要です。
                    </p>
                  </Field>
                ) : null}
                <Field>
                  <FieldLabel htmlFor="name">店舗名</FieldLabel>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name || ""}
                    onChange={handleInputChange}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="alias">別名</FieldLabel>
                  <Input
                    id="alias"
                    name="alias"
                    value={formData.alias || ""}
                    onChange={handleInputChange}
                  />
                </Field>
                <Field>
                  <FieldLabel>ソースエリア</FieldLabel>
                  <Select
                    value={formData.source_area || ""}
                    onValueChange={(v) =>
                      setFormData((prev) => ({ ...prev, source_area: v, area: "" }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="地域を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((r) => (
                        <SelectItem key={r.region} value={r.region}>
                          {regionNames[r.region] || r.region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>エリア</FieldLabel>
                  <Select
                    value={formData.area || ""}
                    onValueChange={(v) =>
                      setFormData((prev) => ({ ...prev, area: v }))
                    }
                    disabled={!formData.source_area}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="エリアを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {areaOptions.map((opt) => (
                        <SelectItem key={opt.key} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>ジャンル</FieldLabel>
                  <Select
                    value={formData.genre || ""}
                    onValueChange={(v) =>
                      setFormData((prev) => ({
                        ...prev,
                        genre: v,
                        genres: v,
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="ジャンルを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {industryTypes.map((type) => (
                        <SelectItem key={type.id} value={type.name}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="catch_copy">キャッチコピー</FieldLabel>
                  <Textarea
                    id="catch_copy"
                    name="catch_copy"
                    value={formData.catch_copy || ""}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </Field>
                <ShopCoverImageField
                  shopId={resolvedShopId || shop.id || "_"}
                  imageUrl={formData.image_url || ""}
                  onImageUrlChange={(url) =>
                    setFormData((prev) => ({ ...prev, image_url: url }))
                  }
                  disabled={storageDisabled}
                />
              </FieldGroup>
            </TabsContent>

            <TabsContent value="data" className="mr-1 space-y-1 rounded-xl border border-border/50 bg-card/40 p-4 pr-3 shadow-sm outline-none">
              <FieldGroup className="gap-4">
                <Field>
                  <FieldLabel htmlFor="data_salary">給与</FieldLabel>
                  <Textarea
                    id="data_salary"
                    value={formData.data?.給与 || ""}
                    onChange={(e) => handleDataChange("給与", e.target.value)}
                    rows={3}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="data_qualification">資格</FieldLabel>
                  <Textarea
                    id="data_qualification"
                    value={formData.data?.資格 || ""}
                    onChange={(e) => handleDataChange("資格", e.target.value)}
                    rows={3}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="data_hours">勤務時間</FieldLabel>
                  <Textarea
                    id="data_hours"
                    value={formData.data?.勤務時間 || ""}
                    onChange={(e) => handleDataChange("勤務時間", e.target.value)}
                    rows={3}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="data_address">住所</FieldLabel>
                  <Textarea
                    id="data_address"
                    value={formData.data?.住所 || ""}
                    onChange={(e) => handleDataChange("住所", e.target.value)}
                    rows={3}
                  />
                </Field>
              </FieldGroup>
            </TabsContent>

            <TabsContent value="detail" className="mr-1 space-y-1 rounded-xl border border-border/50 bg-card/40 p-4 pr-3 shadow-sm outline-none">
              {/* catchCopy, descriptionHtml, shopInfo, recruitDetailsHtml, benefits, applicationFlowHtml, applicationFlowNoteHtml, ouboFormUrl, mapUrl, mapCaption */}
              <FieldGroup className="gap-5">
                <Field>
                  {/* catchCopy */}
                  <FieldLabel>詳細ページのキャッチコピー</FieldLabel>
                  <Textarea
                    value={detailData.catchCopy || ""}
                    onChange={(e) =>
                      handleDetailStringChange("catchCopy", e.target.value)
                    }
                    rows={2}
                  />
                </Field>
                <Field>
                  {/* descriptionHtml */}
                  <FieldLabel>説明（リッチテキスト）</FieldLabel>
                  <HtmlEditor
                    key={open ? "desc-open" : "desc-closed"}
                    value={detailData.descriptionHtml || ""}
                    onChange={handleDescriptionHtmlChange}
                    placeholder="説明を入力..."
                    minHeight="200px"
                  />
                </Field>

                <div className="space-y-3 rounded-lg border border-border/40 bg-background/50 p-3">
                  {/* shopInfo */}
                  <FieldLabel className="text-sm font-medium">店舗情報</FieldLabel>
                  {(
                    ["店名", "住所", "電話番号", "営業時間", "アクセス"] as const
                  ).map((key) => (
                    <Field key={key}>
                      <FieldLabel htmlFor={`shopInfo_${key}`} className="text-xs">
                        {key}
                      </FieldLabel>
                      <Input
                        id={`shopInfo_${key}`}
                        value={detailData.shopInfo?.[key] || ""}
                        onChange={(e) =>
                          handleShopInfoChange(key, e.target.value)
                        }
                      />
                    </Field>
                  ))}
                </div>

                <div className="space-y-3 rounded-lg border border-border/40 bg-background/50 p-3">
                  {/* recruitDetailsHtml */}
                  <FieldLabel className="text-sm font-medium">
                    募集詳細（リッチテキスト）
                  </FieldLabel>
                  {RECRUIT_DETAILS_HTML_KEYS.map((key) => (
                    <Field key={key}>
                      <FieldLabel className="text-sm font-medium">{key}</FieldLabel>
                      <HtmlEditor
                        key={`${open ? "rdh-open" : "rdh-closed"}-${key}-${shop.id}`}
                        value={detailData.recruitDetailsHtml?.[key] ?? ""}
                        onChange={(html) =>
                          handleRecruitDetailsHtmlFieldChange(key, html)
                        }
                        placeholder={`${key}を入力...`}
                        minHeight={recruitDetailsHtmlMinHeight(key)}
                      />
                    </Field>
                  ))}
                </div>
                <div className="space-y-3 rounded-lg border border-border/40 bg-background/50 p-3">
                  {/* benefits */}
                  <FieldLabel className="text-sm font-medium">特典</FieldLabel>
                  <p className="text-muted-foreground text-xs">
                    表示する特典をオンにしてください（項目と順序は固定です）。
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {detailData.benefits.map((b) => (
                      <div
                        key={b.label}
                        className="flex items-center justify-between gap-3 rounded-md border border-border/50 bg-background/60 px-3 py-2"
                      >
                        <span className="text-sm">{b.label}</span>
                        <Switch
                          checked={b.active}
                          onCheckedChange={(checked) =>
                            handleBenefitActiveChange(b.label, checked)
                          }
                          disabled={isSaving}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3 rounded-lg border border-border/40 bg-background/50 p-3">
                  {/* applicationFlowHtml */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <FieldLabel className="text-base font-medium">
                      申込フロー（各ステップ）
                    </FieldLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={addApplicationFlowHtmlStep}
                      disabled={isSaving}
                    >
                      <Plus className="size-4" />
                      ステップを追加
                    </Button>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    ステップの並び順がそのまま保存されます。
                  </p>
                  {(detailData.applicationFlowHtml ?? []).length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      ステップがありません。「ステップを追加」から追加してください。
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {(detailData.applicationFlowHtml ?? []).map(
                        (stepHtml, index) => (
                        <div
                          key={`application-flow-${shop.id}-${index}`}
                          className="space-y-2 rounded-md border border-border/50 bg-background/40 p-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-sm font-medium">
                              ステップ {index + 1}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="gap-1 border-destructive/50 text-destructive hover:bg-destructive/10"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                removeApplicationFlowHtmlStep(index);
                              }}
                              disabled={isSaving}
                              title="このステップを一覧から削除します"
                            >
                              <Trash2 className="size-4" />
                              ステップを削除
                            </Button>
                          </div>
                          <HtmlEditor
                            key={`aff-${open ? "o" : "c"}-${shop.id}-${index}`}
                            value={stepHtml}
                            onChange={(html) =>
                              handleApplicationFlowHtmlStepChange(index, html)
                            }
                            placeholder={`ステップ ${index + 1} の内容...`}
                            minHeight="120px"
                          />
                        </div>
                        )
                      )}
                    </div>
                  )}
                </div>
                <Field>
                  {/* applicationFlowNoteHtml */}
                  <FieldLabel>申込フロー注意書き</FieldLabel>
                  <HtmlEditor
                    key={open ? "flow-note-open" : "flow-note-closed"}
                    value={detailData.applicationFlowNoteHtml || ""}
                    onChange={(html) =>
                      handleDetailStringChange("applicationFlowNoteHtml", html)
                    }
                    minHeight="100px"
                  />
                </Field>
                <Field>
                  {/* ouboFormUrl */}
                  <FieldLabel htmlFor="ouboFormUrl">応募フォームURL</FieldLabel>
                  <Input
                    id="ouboFormUrl"
                    value={detailData.ouboFormUrl || ""}
                    onChange={(e) =>
                      handleDetailStringChange("ouboFormUrl", e.target.value)
                    }
                  />
                </Field>
                <Field>
                  {/* mapUrl */}
                  <FieldLabel htmlFor="mapUrl">地図URL</FieldLabel>
                  <Input
                    id="mapUrl"
                    value={detailData.mapUrl || ""}
                    onChange={(e) =>
                      handleDetailStringChange("mapUrl", e.target.value)
                    }
                  />
                </Field>
                <Field>
                  {/* mapCaption */}
                  <FieldLabel htmlFor="mapCaption">地図の説明</FieldLabel>
                  <Input
                    id="mapCaption"
                    value={detailData.mapCaption || ""}
                    onChange={(e) =>
                      handleDetailStringChange("mapCaption", e.target.value)
                    }
                  />
                </Field>
              </FieldGroup>
            </TabsContent>

            <TabsContent value="media" className="mr-1 space-y-1 rounded-xl border border-border/50 bg-card/40 p-4 pr-3 shadow-sm outline-none">
              {/* mainImages, images, prImage, gallery, prePlan, sidebarPresentImage, kyubo */}
              <FieldGroup className="gap-5">
                <div className="space-y-2">
                  {/* mainImages */}
                  <FieldLabel className="text-sm font-medium">
                    メイン画像（最大3枚）
                  </FieldLabel>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {DETAIL_MEDIA_SLOT_INDEXES.map((i) => (
                      <ShopStorageImageSlot
                        key={`main-${i}`}
                        shopId={resolvedShopId || shop.id || "_"}
                        label={`画像 ${i + 1}`}
                        compact
                        imageUrl={detailData.mainImages?.[i] ?? ""}
                        onImageUrlChange={(url) => setMainImageSlot(i, url)}
                        disabled={storageDisabled}
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  {/* images */}
                  <FieldLabel className="text-sm font-medium">
                    画像一覧（URL・キャプション、最大3枚）
                  </FieldLabel>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {DETAIL_MEDIA_SLOT_INDEXES.map((i) => (
                      <ShopStorageImageSlot
                        key={`img-${i}`}
                        shopId={resolvedShopId || shop.id || "_"}
                        label={`スロット ${i + 1}`}
                        compact
                        imageUrl={detailData.images?.[i]?.url ?? ""}
                        onImageUrlChange={(url) =>
                          setDetailImagesSlot(i, { url })
                        }
                        caption={detailData.images?.[i]?.caption ?? ""}
                        onCaptionChange={(caption) =>
                          setDetailImagesSlot(i, { caption })
                        }
                        disabled={storageDisabled}
                      />
                    ))}
                  </div>
                </div>
                <ShopStorageImageSlot
                  shopId={resolvedShopId || shop.id || "_"}
                  label="PR画像"
                  compact
                  imageUrl={detailData.prImage || ""}
                  onImageUrlChange={(url) =>
                    handleDetailChange("prImage", url || null)
                  }
                  disabled={storageDisabled}
                />
                <div className="space-y-2">
                  {/* gallery */}
                  <FieldLabel className="text-sm font-medium">
                    ギャラリー（最大3枚）
                  </FieldLabel>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {DETAIL_MEDIA_SLOT_INDEXES.map((i) => (
                      <ShopStorageImageSlot
                        key={`gal-${i}`}
                        shopId={resolvedShopId || shop.id || "_"}
                        label={`画像 ${i + 1}`}
                        compact
                        imageUrl={detailData.gallery?.[i] ?? ""}
                        onImageUrlChange={(url) => setGallerySlot(i, url)}
                        disabled={storageDisabled}
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-3 rounded-lg border border-border/40 bg-background/50 p-3">
                  {/* prePlan */}
                  <FieldLabel className="text-sm font-medium">プレプラン</FieldLabel>
                  <ShopStorageImageSlot
                    shopId={resolvedShopId || shop.id || "_"}
                    label="プレプラン画像"
                    compact
                    imageUrl={detailData.prePlan?.imageUrl || ""}
                    onImageUrlChange={(url) =>
                      handleDetailChange("prePlan", {
                        imageUrl: url,
                        linkUrl: detailData.prePlan?.linkUrl || "",
                      } as ShopDetailPrePlan)
                    }
                    disabled={storageDisabled}
                  />
                  <Field>
                    {/* prePlan.linkUrl */}
                    <FieldLabel htmlFor="prePlan_linkUrl" className="text-xs">
                      リンク先URL
                    </FieldLabel>
                    <Input
                      id="prePlan_linkUrl"
                      value={detailData.prePlan?.linkUrl || ""}
                      onChange={(e) =>
                        handleDetailChange("prePlan", {
                          imageUrl: detailData.prePlan?.imageUrl || "",
                          linkUrl: e.target.value,
                        } as ShopDetailPrePlan)
                      }
                    />
                  </Field>
                </div>
                <div className="space-y-3 rounded-lg border border-border/40 bg-background/50 p-3">
                  {/* sidebarPresentImage */}
                  <FieldLabel className="text-sm font-medium">
                    サイドバーPR画像
                  </FieldLabel>
                  <ShopStorageImageSlot
                    shopId={resolvedShopId || shop.id || "_"}
                    label="サイドバーPR用画像"
                    compact
                    imageUrl={detailData.sidebarPresentImage?.imageUrl || ""}
                    onImageUrlChange={(url) =>
                      handleDetailChange("sidebarPresentImage", {
                        imageUrl: url,
                        linkUrl:
                          detailData.sidebarPresentImage?.linkUrl || "",
                      } as ShopDetailPresentImage)
                    }
                    disabled={storageDisabled}
                  />
                  <Field>
                    {/* sidebarPresentImage.linkUrl */}
                    <FieldLabel
                      htmlFor="sidebarPresent_linkUrl"
                      className="text-xs"
                    >
                      リンク先URL
                    </FieldLabel>
                    <Input
                      id="sidebarPresent_linkUrl"
                      value={detailData.sidebarPresentImage?.linkUrl || ""}
                      onChange={(e) =>
                        handleDetailChange("sidebarPresentImage", {
                          imageUrl:
                            detailData.sidebarPresentImage?.imageUrl || "",
                          linkUrl: e.target.value,
                        } as ShopDetailPresentImage)
                      }
                    />
                  </Field>
                </div>
                <div className="space-y-3 rounded-lg border border-border/40 bg-background/50 p-3">
                  {/* kyubo */}
                  <FieldLabel className="text-sm font-medium">求人情報</FieldLabel>
                  <Field>
                    {/* kyubo.date */}
                    <FieldLabel htmlFor="kyubo_date" className="text-xs">
                      日付
                    </FieldLabel>
                    <Input
                      id="kyubo_date"
                      value={detailData.kyubo?.date || ""}
                      onChange={(e) =>
                        handleDetailChange("kyubo", {
                          date: e.target.value,
                          title: detailData.kyubo?.title || "",
                          content: detailData.kyubo?.content || "",
                          contentHtml: detailData.kyubo?.contentHtml || "",
                        })
                      }
                    />
                  </Field>
                  <Field>
                    {/* kyubo.title */}
                    <FieldLabel htmlFor="kyubo_title" className="text-xs">
                      タイトル
                    </FieldLabel>
                    <Input
                      id="kyubo_title"
                      value={detailData.kyubo?.title || ""}
                      onChange={(e) =>
                        handleDetailChange("kyubo", {
                          date: detailData.kyubo?.date || "",
                          title: e.target.value,
                          content: detailData.kyubo?.content || "",
                          contentHtml: detailData.kyubo?.contentHtml || "",
                        })
                      }
                    />
                  </Field>
                  <Field>
                    {/* kyubo.content */}
                    <FieldLabel htmlFor="kyubo_content" className="text-xs">
                      本文（テキスト）
                    </FieldLabel>
                    <Textarea
                      id="kyubo_content"
                      value={detailData.kyubo?.content || ""}
                      onChange={(e) =>
                        handleDetailChange("kyubo", {
                          date: detailData.kyubo?.date || "",
                          title: detailData.kyubo?.title || "",
                          content: e.target.value,
                          contentHtml: detailData.kyubo?.contentHtml || "",
                        })
                      }
                      rows={2}
                    />
                  </Field>
                  <Field>
                    {/* kyubo.contentHtml */}
                    <FieldLabel htmlFor="kyubo_contentHtml" className="text-xs">
                      本文（リッチテキスト）
                    </FieldLabel>
                    <HtmlEditor
                      key={open ? "kyubo-open" : "kyubo-closed"}
                      value={detailData.kyubo?.contentHtml || ""}
                      onChange={(html) =>
                        handleDetailChange("kyubo", {
                          date: detailData.kyubo?.date || "",
                          title: detailData.kyubo?.title || "",
                          content: detailData.kyubo?.content || "",
                          contentHtml: html,
                        })
                      }
                      minHeight="120px"
                    />
                  </Field>
                </div>
              </FieldGroup>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="shrink-0 gap-2 border-t border-border/60 bg-muted/10 px-5 py-4 sm:px-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving && <Spinner className="mr-2" />}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
