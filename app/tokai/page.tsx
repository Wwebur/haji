import { Suspense } from "react";
import RegionPageClient from "@/components/RegionPageClient";

export default function TokaiPage() {
  return (
    <Suspense fallback={<div className="app-container"></div>}>
      <RegionPageClient region="tokai" />
    </Suspense>
  );
}
