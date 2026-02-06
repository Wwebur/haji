import { Suspense } from "react";
import RegionPageClient from "@/components/RegionPageClient";

export default function ChugokuShikokuPage() {
  return (
    <Suspense fallback={<div className="app-container"></div>}>
      <RegionPageClient region="chugokushikoku" />
    </Suspense>
  );
}
