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
import { ScrollArea } from "@/components/ui/scroll-area";
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
  /** When true, `id` is editable and save creates a new row (parent must call `createShop`). */
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
        detail_url: shop.detail_url || "",
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
    const merged = { ...shop, ...formData } as Shop;
    const id = merged.id?.trim() ?? "";
    if (!id) {
      toast.error("店舗IDを入力してください");
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
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {isNewShop ? "新規店舗の登録" : "店舗情報の編集"}
          </DialogTitle>
          <DialogDescription>
            {isNewShop
              ? "店舗ID・店舗名は必須です。画像アップロードは店舗ID入力後に利用できます。"
              : `店舗ID: ${shop.id}`}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">基本情報</TabsTrigger>
            <TabsTrigger value="data">追加データ</TabsTrigger>
            <TabsTrigger value="detail">詳細情報</TabsTrigger>
            <TabsTrigger value="media">画像・メディア</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[50vh] mt-4">
            <TabsContent value="basic" className="pr-4">
              <FieldGroup>
                {isNewShop ? (
                  <Field>
                    <FieldLabel htmlFor="shop_id">店舗ID</FieldLabel>
                    <Input
                      id="shop_id"
                      name="id"
                      value={formData.id ?? ""}
                      onChange={handleInputChange}
                      placeholder="例: my-shop-slug（英数字・ハイフン推奨）"
                      autoComplete="off"
                    />
                    <p className="text-muted-foreground text-xs">
                      データベースの主キーです。既存と重複できません。
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
                <Field>
                  <FieldLabel htmlFor="detail_url">詳細ページURL (detail_url)</FieldLabel>
                  <Input
                    id="detail_url"
                    name="detail_url"
                    type="url"
                    value={formData.detail_url ?? ""}
                    onChange={handleInputChange}
                    placeholder="https://..."
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
                {isNewShop && !resolvedShopId ? (
                  <p className="text-amber-600 text-xs dark:text-amber-500">
                    店舗IDを入力すると画像をアップロードできます。
                  </p>
                ) : null}
              </FieldGroup>
            </TabsContent>

            <TabsContent value="data" className="pr-4">
              <FieldGroup>
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

            <TabsContent value="detail" className="pr-4">
              <FieldGroup>
                <Field>
                  <FieldLabel>キャッチコピー (detail)</FieldLabel>
                  <Textarea
                    value={detailData.catchCopy || ""}
                    onChange={(e) =>
                      handleDetailStringChange("catchCopy", e.target.value)
                    }
                    rows={2}
                  />
                </Field>
                <Field>
                  <FieldLabel>説明 (descriptionHtml)</FieldLabel>
                  <HtmlEditor
                    key={open ? "desc-open" : "desc-closed"}
                    value={detailData.descriptionHtml || ""}
                    onChange={handleDescriptionHtmlChange}
                    placeholder="説明を入力..."
                    minHeight="200px"
                  />
                </Field>

                <div className="space-y-2">
                  <FieldLabel>店舗情報 (shopInfo)</FieldLabel>
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

                <div className="space-y-2">
                  <FieldLabel>募集詳細HTML (recruitDetailsHtml)</FieldLabel>
                  {/* <p className="text-muted-foreground text-xs">
                    次の8項目を個別に編集します。保存時は固定キー順の JSON オブジェクトとして書き込みます。
                  </p> */}
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
                <div className="space-y-2">
                  <FieldLabel>特典 (benefits)</FieldLabel>
                  <p className="text-muted-foreground text-xs">
                    固定30項目をこの順序で保存します（各項目に{" "}
                    <code className="text-xs">label</code> と{" "}
                    <code className="text-xs">active</code>）。
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {detailData.benefits.map((b) => (
                      <div
                        key={b.label}
                        className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
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
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <FieldLabel className="text-base">
                      申込フローHTML (applicationFlowHtml)
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
                    各ステップは文字列の配列として保存されます（順序どおり JSON
                    配列になります）。手編集の JSON は不要です。
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
                          className="space-y-2 rounded-md border p-3"
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
                  <FieldLabel>申込フロー注意 (applicationFlowNoteHtml)</FieldLabel>
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
                  <FieldLabel htmlFor="ouboFormUrl">応募フォームURL (ouboFormUrl)</FieldLabel>
                  <Input
                    id="ouboFormUrl"
                    value={detailData.ouboFormUrl || ""}
                    onChange={(e) =>
                      handleDetailStringChange("ouboFormUrl", e.target.value)
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="mapUrl">地図URL (mapUrl)</FieldLabel>
                  <Input
                    id="mapUrl"
                    value={detailData.mapUrl || ""}
                    onChange={(e) =>
                      handleDetailStringChange("mapUrl", e.target.value)
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="mapCaption">地図キャプション (mapCaption)</FieldLabel>
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

            <TabsContent value="media" className="pr-4">
              <FieldGroup>
                {isNewShop && !resolvedShopId ? (
                  <p className="text-amber-600 text-sm dark:text-amber-500">
                    店舗IDを基本情報で入力すると、ここで画像をアップロードできます。
                  </p>
                ) : null}
                <div className="space-y-2">
                  <FieldLabel>メイン画像 (mainImages) — 最大3枚</FieldLabel>
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
                  <FieldLabel>画像一覧 (images) — 最大3枚（URL＋キャプション）</FieldLabel>
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
                  label="PR画像 (prImage)"
                  compact
                  imageUrl={detailData.prImage || ""}
                  onImageUrlChange={(url) =>
                    handleDetailChange("prImage", url || null)
                  }
                  disabled={storageDisabled}
                />
                <div className="space-y-2">
                  <FieldLabel>ギャラリー (gallery) — 最大3枚</FieldLabel>
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
                <div className="space-y-2">
                  <FieldLabel>プレプラン (prePlan)</FieldLabel>
                  <ShopStorageImageSlot
                    shopId={resolvedShopId || shop.id || "_"}
                    label="プレプラン画像 (imageUrl)"
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
                    <FieldLabel htmlFor="prePlan_linkUrl" className="text-xs">
                      linkUrl
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
                <div className="space-y-2">
                  <FieldLabel>サイドバーPR画像 (sidebarPresentImage)</FieldLabel>
                  <ShopStorageImageSlot
                    shopId={resolvedShopId || shop.id || "_"}
                    label="サイドバーPR画像 (imageUrl)"
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
                    <FieldLabel
                      htmlFor="sidebarPresent_linkUrl"
                      className="text-xs"
                    >
                      linkUrl
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
                <div className="space-y-2">
                  <FieldLabel>求人情報 (kyubo)</FieldLabel>
                  <Field>
                    <FieldLabel htmlFor="kyubo_date" className="text-xs">
                      date
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
                    <FieldLabel htmlFor="kyubo_title" className="text-xs">
                      title
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
                    <FieldLabel htmlFor="kyubo_content" className="text-xs">
                      content
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
                    <FieldLabel htmlFor="kyubo_contentHtml" className="text-xs">
                      contentHtml
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
          </ScrollArea>
        </Tabs>

        <DialogFooter>
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
