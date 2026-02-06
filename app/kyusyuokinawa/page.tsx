import { Suspense } from "react";
import RegionPageClient from "@/components/RegionPageClient";

export default function KyusyuOkinawaPage() {
  return (
    <Suspense fallback={<div className="app-container"></div>}>
      <RegionPageClient region="kyusyuokinawa" />
    </Suspense>
  );
}
