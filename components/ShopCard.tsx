import { Shop } from "@/types";
import Image from "next/image";

interface ShopCardProps {
  shop: Shop;
}

export default function ShopCard({ shop }: ShopCardProps) {
  // Determine plan class based on shop id
  const getPlanClass = () => {
    const idNum = parseInt(shop.id);
    if (idNum < 5000) return "goldplan";
    if (idNum < 10000) return "silverplan";
    return "portionplan";
  };

  // Check if shop has complete details
  const hasCompleteDetails = !!(
    shop.data.給与 ||
    shop.data.資格 ||
    shop.data.勤務時間
  );

  // Check if image URL is valid
  const hasValidImage =
    shop.imageUrl &&
    shop.imageUrl.trim() !== "" &&
    !shop.imageUrl.includes("noimage") &&
    !shop.imageUrl.includes("placeholder");

  const cardClass = `shop-card ${getPlanClass()} ${
    !hasCompleteDetails ? "limited-info" : ""
  }`;

  return (
    <div className={cardClass}>
      <div className="shop-name">
        <div className="name-section">
          <h3>{shop.name}</h3>
          <span className="ruby">{shop.alias}</span>
        </div>
        <div className="badges">
          {shop.genres.map((genre, idx) => (
            <span key={idx} className="badge genre-badge">
              {genre}
            </span>
          ))}
          <span className="badge area-badge">{shop.area}</span>
        </div>
      </div>

      {shop.catchCopy && <div className="catch-copy">{shop.catchCopy}</div>}

      {hasValidImage && (
        <div className={`shop-content ${!hasValidImage ? "no-image" : ""}`}>
          {hasValidImage && shop.imageUrl && (
            <div className="shop-image">
              <Image
                src={shop.imageUrl}
                alt={shop.name}
                width={200}
                height={150}
                className="object-cover"
                unoptimized
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  if (target.parentElement) {
                    target.parentElement.style.display = "none";
                  }
                }}
              />
            </div>
          )}

          {hasCompleteDetails && (
            <div className="shop-details">
              {shop.data.給与 && (
                <div className="detail-item">
                  <dt>給与</dt>
                  <dd>{shop.data.給与}</dd>
                </div>
              )}
              {shop.data.資格 && (
                <div className="detail-item">
                  <dt>資格</dt>
                  <dd>{shop.data.資格}</dd>
                </div>
              )}
              {shop.data.勤務時間 && (
                <div className="detail-item">
                  <dt>勤務時間</dt>
                  <dd>{shop.data.勤務時間}</dd>
                </div>
              )}
              {shop.data.住所 && (
                <div className="detail-item">
                  <dt>住所</dt>
                  <dd>{shop.data.住所}</dd>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="shop-actions">
        <button className="btn-favorite">キープする</button>
        <a
          href={shop.detailUrl}
          className="btn-detail"
          target="_blank"
          rel="noopener noreferrer"
        >
          詳細を見る
        </a>
      </div>
    </div>
  );
}
