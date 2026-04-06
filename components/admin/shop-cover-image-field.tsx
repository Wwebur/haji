"use client";

import { Field } from "@/components/ui/field";
import { ShopStorageImageSlot } from "@/components/admin/shop-storage-image-slot";

interface ShopCoverImageFieldProps {
  shopId: string;
  imageUrl: string;
  onImageUrlChange: (url: string) => void;
  disabled?: boolean;
}

export function ShopCoverImageField({
  shopId,
  imageUrl,
  onImageUrlChange,
  disabled,
}: Readonly<ShopCoverImageFieldProps>) {
  return (
    <Field>
      <ShopStorageImageSlot
        shopId={shopId}
        imageUrl={imageUrl}
        onImageUrlChange={onImageUrlChange}
        disabled={disabled}
        label="店舗画像"
        compact={false}
      />
      <p className="mt-2 text-xs text-muted-foreground">
        JPEG / PNG / WebP / GIF、最大5MB。Supabase Storage（bucket: shop-images）に保存されます。
      </p>
    </Field>
  );
}
