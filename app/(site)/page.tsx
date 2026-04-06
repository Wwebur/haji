import HomePage from "@/components/HomePage";
import { fetchTotalShopCount } from "@/lib/shops-db";

export default async function Page() {
  let shopCount = 0;
  try {
    shopCount = await fetchTotalShopCount();
  } catch {
    shopCount = 0;
  }
  return <HomePage initialShopCount={shopCount} />;
}
