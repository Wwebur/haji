import { Suspense } from "react";
import RegionPageClient from "@/components/RegionPageClient";

export default function HokkaidoTohokuPage() {
  return (
    <Suspense fallback={<div className="app-container"></div>}>
      <RegionPageClient region="hokkaidotohoku" />
    </Suspense>
  );
}
