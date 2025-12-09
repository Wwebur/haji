"use client";

import Link from "next/link";
import { Region } from "@/types";
import areasData from "@/mockup/areas.json";

// Region display information
const regionInfo = {
  kantou: { name: "関東", nameEn: "KANTOU" },
  kansai: { name: "関西", nameEn: "KANSAI" },
  tokai: { name: "東海", nameEn: "TOKAI" },
  hokkaidotohoku: { name: "北海道・東北", nameEn: "HOKKAIDO・TOHOKU" },
  koshinetuhokuriku: { name: "甲信越・北陸", nameEn: "KOSHINETSU・HOKURIKU" },
  chugokushikoku: { name: "中国・四国", nameEn: "CHUGOKU・SHIKOKU" },
  kyusyuokinawa: { name: "九州・沖縄", nameEn: "KYUSHU・OKINAWA" },
};

export default function HomePage() {
  const regions = areasData as Region[];

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <div className="landing-header-content">
          <h1 className="landing-title">はじめてのメンズエステアルバイト</h1>
          <p className="landing-subtitle">
            【はじめてのメンズエステアルバイト】ならエステ求人情報が満載です。
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="landing-main">
        <div className="region-section">
          <h2 className="region-section-title">
            <span className="search-icon">🔍</span>
            エリアからエステ求人を探す
          </h2>

          <div className="region-grid">
            {regions.map((region) => {
              const info = regionInfo[region.region as keyof typeof regionInfo];

              return (
                <Link
                  key={region.region}
                  href={`/${region.region}`}
                  className="region-card"
                >
                  <div className="region-card-content">
                    <h3 className="region-card-title">{info.name}</h3>
                    <p className="region-card-title-en">{info.nameEn}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-nav">
          <span>会社概要</span>
          <span>利用規約</span>
          <span>掲載申し込み</span>
          <span>お問い合わせ</span>
        </div>
        <p className="copyright">
          Copyright 2025 はじめてのメンズエステアルバイト All rights reserved.
        </p>
      </footer>
    </div>
  );
}
