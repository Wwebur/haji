import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ShopMainImageSwiper from "@/components/ShopMainImageSwiper";
import ShopDescription from "@/components/ShopDescription";
import type { ShopWithDetail } from "@/types";
import shopsWithDetailsData from "@/mockup/shops-with-details.json";
import { fetchShopWithDetail, fetchShopDetailParams } from "@/lib/shops-db";

const mockupShops = shopsWithDetailsData as unknown as ShopWithDetail[];

const RECRUIT_KEYS = [
  "資格",
  "給与",
  "職種",
  "勤務時間",
  "勤務日",
  "勤務地",
  "待遇",
  "応募特典",
] as const;

/**
 * Convert breadcrumb URL (from source site path) to our app's region list URL
 * so that navigating via breadcrumb preserves area filter and FilterBar selection.
 * e.g. /kantou/area_tokyo/kinshicho -> /kantou?area=kinshicho
 */
function breadcrumbUrlToAppHref(url: string): string {
  if (!url) return "/";
  let pathname: string;
  try {
    pathname = url.startsWith("http") ? new URL(url).pathname : url;
  } catch {
    return url;
  }
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return "/";
  const region = parts[0];
  if (parts.length === 1) return `/${region}`;
  const areaSlug = parts.at(-1) ?? "";
  return `/${region}?area=${encodeURIComponent(areaSlug)}`;
}

export async function generateStaticParams() {
  const fromSupabase: { region: string; id: string }[] = [];
  try {
    const params = await fetchShopDetailParams();
    fromSupabase.push(...params);
  } catch {
    // Supabase unavailable or failed
  }
  const fromMockup = mockupShops
    .filter((s) => s.detail?.breadcrumbs?.length)
    .map((s) => ({ region: s.sourceArea, id: s.id }));

  const seen = new Set<string>();
  const merged: { region: string; id: string }[] = [];
  for (const p of [...fromSupabase, ...fromMockup]) {
    const key = `${p.region}/${p.id}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(p);
    }
  }
  return merged;
}

export default async function ShopDetailPage({
  params,
}: Readonly<{
  params: Promise<Readonly<{ region: string; id: string }>>;
}>) {
  const { region, id } = await params;
  const shop = await fetchShopWithDetail(region, id);
  if (!shop) notFound();

  const d = shop.detail;

  return (
    <div className="app-container shop-detail-page">
      <header className="landing-header region-page-header">
        <div className="landing-header-content">
          <h1 className="landing-title">
            メンズエステ求人情報｜はじめてのメンズエステアルバイト【はじエス】
          </h1>
          <div className="header-box">
            <Link href="/" className="logobox">
              <Image
                src="/images/logo_01.png"
                alt="はじめてのメンズエステアルバイト"
                width={180}
                height={106}
              />
            </Link>
            <Link href={`/${region}`} className="back-to-list">
              ← 一覧に戻る
            </Link>
          </div>
        </div>
      </header>

      <main className="shop_page main_area">
        <div className="main-bg">
          <p className="bg1"></p>
          <p className="bg2"></p>
          <p className="bg3"></p>
        </div>
        <div className="sub-bg">
          <p className="bg-circle-1"></p>
          <p className="bg-circle-2"></p>
        </div>

        <nav id="breadcrumbs" className="breadcrumb shop-detail-breadcrumb">
          <ul>
            {d.breadcrumbs.map((item, i) => (
              <li key={`${item.name}-${item.url ?? "current"}`}>
                {item.url ? (
                  <Link
                    href={breadcrumbUrlToAppHref(item.url)}
                  >
                    {item.name}
                  </Link>
                ) : (
                  <span>{item.name}</span>
                )}
                {i < d.breadcrumbs.length - 1 && " › "}
              </li>
            ))}
          </ul>
        </nav>

        <div className="shop_header">
          <dl>
            <dt>
              {shop.name}
              <span>{shop.alias}</span>
            </dt>
            <dd className="genre_area">
              <span className="genre">{shop.genre}</span>
              <span className="area">{shop.area}</span>
            </dd>
          </dl>
        </div>

        <div className="shop_wrap">
          <div className="shop_main">
            {d.prePlan && (
              <div className="pre_plan">
                <a href={d.prePlan.linkUrl}>
                  <Image
                    width={300}
                    height={80}
                    className="w-full h-auto"
                    src={d.prePlan.imageUrl}
                    alt="面接交通費プレゼント"
                    unoptimized
                  />
                </a>
              </div>
            )}

            {/* Main image carousel - Swiper */}
            <ShopMainImageSwiper
              images={d.mainImages}
              shopName={shop.name}
              fallbackImage={shop.imageUrl}
            />

            <dl className="shop_txt">
              <dt>{d.catchCopy}</dt>
              <ShopDescription descriptionHtml={d.descriptionHtml} />
            </dl>

            <div className="shop_img">
              {d.images.map((img) => (
                <dl key={img.url} className="shop_img_block">
                  <dt>
                    <Image
                      src={img.url}
                      alt={`店舗イメージ ${shop.area}のメンズエステ求人`}
                      width={280}
                      height={190}
                      unoptimized
                      className="shop_img_photo"
                    />
                  </dt>
                  <dd>{img.caption}</dd>
                </dl>
              ))}
            </div>

            {d.prImage && (
              <div className="pr_img">
                <Image
                  className="w-full h-fit"
                  src={d.prImage}
                  alt="PR画像"
                  width={700}
                  height={300}
                  unoptimized
                />
              </div>
            )}

            {d.kyubo && (
              <div className="kyubo">
                <div className="kyubo_ttlbox">
                  <h3 className="shop_subttl">
                    急募インフォメーション <span>{d.kyubo.date}</span>
                  </h3>
                </div>
                <div className="kyubo_wrap">
                  <dl>
                    <dt className="ttl">{d.kyubo.title}</dt>
                    <dd
                      className="txt"
                      dangerouslySetInnerHTML={{ __html: String(d.kyubo.contentHtml ?? "") }}
                    />
                  </dl>
                </div>
              </div>
            )}

            <h2 className="shop_subttl ttl_photo_g">フォトギャラリー</h2>
            <div className="gallery">
              {d.gallery.map((src) => (
                <dl key={src}>
                  <dt>
                    <a href={src} target="_blank" rel="noopener noreferrer">
                      <Image
                        src={src}
                        alt={`${shop.name}のフォトギャラリー`}
                        width={160}
                        height={160}
                        unoptimized
                        loading="lazy"
                      />
                    </a>
                  </dt>
                  <dd></dd>
                </dl>
              ))}
            </div>

            <h2 className="shop_subttl ttl_info">求人情報</h2>
            <div className="recruit_txt">
              {RECRUIT_KEYS.map(
                (key) =>
                  d.recruitDetailsHtml[key] && (
                    <dl key={key}>
                      <dt>{key}</dt>
                      <dd
                        dangerouslySetInnerHTML={{
                          __html: String(d.recruitDetailsHtml[key] ?? ""),
                        }}
                      />
                    </dl>
                  )
              )}
            </div>

            <h2 className="shop_subttl ttl_icon">待遇・福利厚生</h2>
            <div className="shop_icon">
              <ul>
                {d.benefits.map((b) => (
                  <li key={b.label}>
                    {b.active ? <strong>{b.label}</strong> : <span>{b.label}</span>}
                  </li>
                ))}
              </ul>
            </div>

            <div className="shop_oubo">
              <ul>
                <li className="line">
                  <button type="button" className="lineSubsc">
                    LINEで応募する
                  </button>
                </li>
                <li className="mail">
                  <a href={d.ouboFormUrl || "#"}>
                    メールで応募・質問
                  </a>
                </li>
                <li className="keep">
                  <button type="button" className="bookmark">
                    ☆ キープする
                  </button>
                </li>
              </ul>
              <p>
                <strong>
                  「<span>はじめてのメンズエステアルバイト</span>見た」
                </strong> とお伝え頂くとスムーズです
              </p>
            </div>

            <h2 className="shop_subttl ttl_flow">応募の流れ</h2>
            <div className="shop_flow">
              <ul className="flow">
                {Array.isArray(d.applicationFlowHtml)
                  ? d.applicationFlowHtml.map((html, i) => (
                      <li
                        key={i}
                        dangerouslySetInnerHTML={{ __html: String(html ?? "") }}
                      />
                    ))
                  : null}
              </ul>
              {d.applicationFlowNoteHtml && (
                <div
                  className="flow_txt"
                  dangerouslySetInnerHTML={{
                    __html: String(d.applicationFlowNoteHtml),
                  }}
                />
              )}
            </div>

            <h2 className="shop_subttl ttl_info">店舗情報</h2>
            <div className="shop_info">
              <table>
                <tbody>
                  <tr>
                    <th>店名</th>
                    <td>{d.shopInfo.店名}</td>
                  </tr>
                  <tr>
                    <th>住所</th>
                    <td>{d.shopInfo.住所}</td>
                  </tr>
                  <tr>
                    <th>電話番号</th>
                    <td>{d.shopInfo.電話番号}</td>
                  </tr>
                  <tr>
                    <th>営業時間</th>
                    <td>{d.shopInfo.営業時間}</td>
                  </tr>
                  <tr>
                    <th>アクセス</th>
                    <td>{d.shopInfo.アクセス}</td>
                  </tr>
                  <tr>
                    <th>ホームページ</th>
                    <td>
                      {Array.isArray(d.shopInfo.ホームページ)
                        ? d.shopInfo.ホームページ.map((link) => (
                            <a
                              key={link.href}
                              href={link.href}
                              className={
                                link.href === d.shopInfo.ホームページ?.[0]?.href ? "rec_hp" : "sales_hp"
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {link.text}
                            </a>
                          ))
                        : null}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {d.mapUrl && (
              <>
                <h2 className="shop_subttl ttl_map">マップ</h2>
                <div className="shop_map">
                  <iframe
                    src={d.mapUrl}
                    width="700"
                    height="300"
                    title="店舗マップ"
                  />
                </div>
                {d.mapCaption && (
                  <div className="maptxt">{d.mapCaption}</div>
                )}
              </>
            )}
          </div>

          <aside className="shop_navi">
            <ul className="oubobtn">
              <li className="shop_name">
                {shop.name}
                <span>（{shop.alias}）</span>
              </li>
              <li className="genre_area">
                <span className="genre">{shop.genre}</span>
                <span className="area">{shop.area}</span>
              </li>
              <li className="tel">{d.shopInfo.電話番号}</li>
              <li className="line">
                <button type="button" className="lineSubsc">
                  LINEで応募する
                </button>
              </li>
              {d.sidebarPresentImage && (
                <li className="flex justify-center">
                  <a href={d.sidebarPresentImage.linkUrl}>
                    <Image
                      src={d.sidebarPresentImage?.imageUrl}
                      alt="面接交通費プレゼント"
                      width={200}
                      height={60}
                      unoptimized
                    />
                  </a>
                </li>
              )}
              <li className="mail">
                <a href={d.ouboFormUrl || "#"}>
                  メールで応募・質問 <span>※店舗側には非公開です</span>
                </a>
              </li>
              <li className="keep">
                <button type="button" className="bookmark">
                  ☆ キープする
                </button>
              </li>
              <li className="present pre_plan">
                <Link href="/userpage" className="mypagelogin">
                  マイページログイン <span>
                    ※ログインしてメールで応募すると
                    <br />
                    面接交通費が申請できます
                  </span>
                </Link>
              </li>
            </ul>
          </aside>
        </div>
      </main>
    </div>
  );
}
