"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Shop, ShopWithDetail, ShopDetailData } from "@/types/shop";
import { Region } from "@/types/region";
import { IndustryType } from "@/lib/shopCountsAdmin";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Pencil,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { ShopEditDialog } from "./shop-edit-dialog";
import { createDraftShopWithDetail } from "@/lib/shop-draft";

interface ShopTableProps {
  shops: ShopWithDetail[];
  regions: Region[];
  industryTypes: IndustryType[];
  regionNames: Record<string, string>;
  onShopUpdate: (shop: Shop, detail?: ShopDetailData) => Promise<void>;
  onShopCreate: (shop: Shop, detail?: ShopDetailData) => Promise<void>;
  onShopDelete: (shopId: string) => Promise<boolean>;
}

export function ShopTable({
  shops,
  regions,
  industryTypes,
  regionNames,
  onShopUpdate,
  onShopCreate,
  onShopDelete,
}: ShopTableProps) {
  const [selectedShop, setSelectedShop] = useState<ShopWithDetail | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [createDraft, setCreateDraft] = useState<ShopWithDetail | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ShopWithDetail | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Pagination (shops are already filtered by AdminClient)
  const totalPages = Math.ceil(shops.length / itemsPerPage);
  const paginatedShops = shops.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filter narrows results
  useEffect(() => {
    if (currentPage > 1 && currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const handleEditClick = (shop: ShopWithDetail) => {
    setSelectedShop(shop);
    setIsEditDialogOpen(true);
  };

  const handleShopSave = async (updatedShop: Shop, detail?: ShopDetailData) => {
    await onShopUpdate(updatedShop, detail);
    setIsEditDialogOpen(false);
    setSelectedShop(null);
  };

  const handleCreateSave = async (newShop: Shop, detail?: ShopDetailData) => {
    try {
      await onShopCreate(newShop, detail);
      setCreateDraft(null);
    } catch {
      /* toast shown in admin client */
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const ok = await onShopDelete(deleteTarget.id);
      if (ok) {
        if (selectedShop?.id === deleteTarget.id) {
          setIsEditDialogOpen(false);
          setSelectedShop(null);
        }
        setDeleteTarget(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">
          {shops.length} 件
        </span>
        <Button
          type="button"
          size="sm"
          className="gap-1"
          onClick={() => setCreateDraft(createDraftShopWithDetail())}
        >
          <Plus className="h-4 w-4" />
          新規店舗
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[80px]">画像</TableHead>
              <TableHead>店舗名</TableHead>
              <TableHead className="hidden md:table-cell">エリア</TableHead>
              <TableHead className="hidden lg:table-cell">ジャンル</TableHead>
              <TableHead className="hidden xl:table-cell">更新日</TableHead>
              <TableHead className="w-[140px] text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedShops.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  店舗が見つかりませんでした
                </TableCell>
              </TableRow>
            ) : (
              paginatedShops.map((shop) => (
                <TableRow key={shop.id}>
                  <TableCell>
                    {shop.image_url ? (
                      <div className="relative h-12 w-12 overflow-hidden rounded-md">
                        <Image
                          src={shop.image_url}
                          alt={shop.name || "店舗画像"}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                        No Image
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{shop.name || "名称未設定"}</span>
                      <span className="text-xs text-muted-foreground">{shop.id}</span>
                      {shop.detail_url && (
                        <a
                          href={shop.detail_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          詳細ページ
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="secondary">{shop.area || "-"}</Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="text-sm">{shop.genre || "-"}</span>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {shop.updated_at
                        ? new Date(shop.updated_at).toLocaleDateString("ja-JP")
                        : "-"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(shop)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">編集</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-destructive/50 text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteTarget(shop)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">削除</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {(currentPage - 1) * itemsPerPage + 1} -{" "}
            {Math.min(currentPage * itemsPerPage, shops.length)} /{" "}
            {shops.length} 件
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              前へ
            </Button>
            <span className="text-sm">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              次へ
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {selectedShop ? (
        <ShopEditDialog
          shop={selectedShop}
          regions={regions}
          industryTypes={industryTypes}
          regionNames={regionNames}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSave={handleShopSave}
        />
      ) : null}
      {createDraft ? (
        <ShopEditDialog
          key="shop-create"
          shop={createDraft}
          isNewShop
          regions={regions}
          industryTypes={industryTypes}
          regionNames={regionNames}
          open
          onOpenChange={(open) => {
            if (!open) setCreateDraft(null);
          }}
          onSave={handleCreateSave}
        />
      ) : null}

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>店舗を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? (
                <>
                  <span className="font-medium text-foreground">
                    {deleteTarget.name || deleteTarget.id}
                  </span>
                  （{deleteTarget.id}）を削除します。この操作は取り消せません。
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>キャンセル</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
            >
              {isDeleting ? <Spinner className="mr-2 size-4" /> : null}
              削除する
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
