import { Suspense } from "react";
import RegionPageClient from "@/components/RegionPageClient";

export default function KoshinetuHokurikuPage() {
  return (
    <Suspense fallback={<div className="app-container"></div>}>
      <RegionPageClient region="koshinetuhokuriku" />
    </Suspense>
  );
}
