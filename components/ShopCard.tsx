import { Shop } from "@/types";
import Image from "next/image";
import Link from "next/link";

/** Icons for shop detail items (matches reference design - yen, document, clock, map pin) */
const DetailIcons = {
  給与: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.3-4.4z" />
    </svg>
  ),
  資格: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
    </svg>
  ),
  勤務時間: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
    </svg>
  ),
  勤務地: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </svg>
  ),
};

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

  // Check if shop has complete details (data may be empty if DB data is missing/malformed)
  const data = shop.data && typeof shop.data === "object" ? shop.data : null;
  const hasCompleteDetails = !!(
    data?.給与 ||
    data?.資格 ||
    data?.勤務時間
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

          {hasCompleteDetails && data && (
            <div className="shop-details">
              {data.給与 && (
                <div className="detail-item">
                  <span className="detail-item-icon" aria-hidden>{DetailIcons.給与}</span>
                  <dl className="detail-item-content">
                    <dt>給与</dt>
                    <dd>{data.給与}</dd>
                  </dl>
                </div>
              )}
              {data.資格 && (
                <div className="detail-item">
                  <span className="detail-item-icon" aria-hidden>{DetailIcons.資格}</span>
                  <dl className="detail-item-content">
                    <dt>資格</dt>
                    <dd>{data.資格}</dd>
                  </dl>
                </div>
              )}
              {data.勤務時間 && (
                <div className="detail-item">
                  <span className="detail-item-icon" aria-hidden>{DetailIcons.勤務時間}</span>
                  <dl className="detail-item-content">
                    <dt>勤務時間</dt>
                    <dd>{data.勤務時間}</dd>
                  </dl>
                </div>
              )}
              {data.住所 && (
                <div className="detail-item">
                  <span className="detail-item-icon" aria-hidden>{DetailIcons.勤務地}</span>
                  <dl className="detail-item-content">
                    <dt>勤務地</dt>
                    <dd>{data.住所}</dd>
                  </dl>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="shop-actions">
        <button className="btn-favorite">キープする</button>
        <Link
          href={`/${shop.sourceArea}/shop/${shop.id}`}
          className="btn-detail"
        >
          詳細を見る
        </Link>
      </div>
    </div>
  );
}
