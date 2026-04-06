"use client";

import { useId, useRef, useState } from "react";
import Image from "next/image";
import { Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { uploadShopCoverImage } from "@/app/admin/actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface ShopStorageImageSlotProps {
  shopId: string;
  imageUrl: string;
  onImageUrlChange: (url: string) => void;
  disabled?: boolean;
  /** Visible label / aria-label for the slot */
  label: string;
  /** Smaller layout for grids (main / gallery / detail list) */
  compact?: boolean;
  caption?: string;
  onCaptionChange?: (caption: string) => void;
  captionPlaceholder?: string;
}

export function ShopStorageImageSlot({
  shopId,
  imageUrl,
  onImageUrlChange,
  disabled,
  label,
  compact = false,
  caption,
  onCaptionChange,
  captionPlaceholder = "キャプション（任意）",
}: Readonly<ShopStorageImageSlotProps>) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const pick = () => inputRef.current?.click();

  const remove = () => {
    onImageUrlChange("");
    toast.success("画像を削除しました（保存で反映されます）");
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("shopId", shopId);
      fd.set("file", file);
      const result = await uploadShopCoverImage(fd);
      if (result.success) {
        onImageUrlChange(result.publicUrl);
        toast.success("画像をアップロードしました");
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("アップロード中にエラーが発生しました");
    } finally {
      setUploading(false);
    }
  };

  const previewClass = compact
    ? "h-28 w-full max-w-[140px]"
    : "h-40 w-full max-w-[200px]";

  return (
    <div className="space-y-2">
      <FieldLabel htmlFor={inputId} className={compact ? "text-xs" : undefined}>
        {label}
      </FieldLabel>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        disabled={disabled || uploading}
        onChange={onFile}
      />
      <div
        className={cn(
          "flex flex-col gap-2 sm:flex-row sm:items-start",
          compact && "sm:flex-col"
        )}
      >
        <div
          className={cn(
            "group relative shrink-0 overflow-hidden rounded-md border bg-muted",
            previewClass
          )}
        >
          {imageUrl ? (
            <>
              <Image
                src={imageUrl}
                alt=""
                fill
                className="object-cover"
                sizes={compact ? "140px" : "200px"}
                unoptimized
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className={cn("gap-1 shadow-md", compact && "h-8 px-2 text-xs")}
                  disabled={disabled || uploading}
                  onClick={remove}
                  title="画像を削除"
                >
                  <Trash2 className="size-3.5 shrink-0" aria-hidden />
                  {!compact && "削除"}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center px-1 text-center text-[10px] text-muted-foreground leading-tight">
              未設定
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className={cn("w-fit", compact && "h-8 text-xs")}
            disabled={disabled || uploading}
            onClick={pick}
          >
            {uploading ? (
              <Spinner className="mr-1.5 size-3.5" />
            ) : (
              <Upload className="mr-1.5 size-3.5" />
            )}
            {compact ? "アップロード" : "新しい画像をアップロード"}
          </Button>
          {onCaptionChange ? (
            <Input
              value={caption ?? ""}
              onChange={(e) => onCaptionChange(e.target.value)}
              placeholder={captionPlaceholder}
              disabled={disabled}
              className={cn(compact && "h-8 text-xs")}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
