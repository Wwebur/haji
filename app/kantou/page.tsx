import { Suspense } from "react";
import RegionPageClient from "@/components/RegionPageClient";

export default function KantouPage() {
  return (
    <Suspense fallback={<div className="app-container"></div>}>
      <RegionPageClient region="kantou" />
    </Suspense>
  );
}
