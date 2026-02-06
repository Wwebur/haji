import { Suspense } from "react";
import RegionPageClient from "@/components/RegionPageClient";

export default function KansaiPage() {
  return (
    <Suspense fallback={<div className="app-container"></div>}>
      <RegionPageClient region="kansai" />
    </Suspense>
  );
}
