"use client";


import { useState, useEffect } from "react";
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
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const now = new Date();
    const formattedDate = `${now.getFullYear()}年${String(now.getMonth() + 1).padStart(2, '0')}月${String(now.getDate()).padStart(2, '0')}日`;
    setTimeout(() => {
      setCurrentDate(formattedDate);
    }, 0);
  }, []);

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <div className="landing-header-content">
          <h1 className="landing-title">2025年最新のメンズエステ求人情報サイト　「はじエス」｜はじめてのメンズエステアルバイト【はじエス】</h1>
          <div className="header-box">
            <div className="logobox">
              <div className="logo">
                <Link href="/">
                  <img src="./images/logo_01.png" alt="はじめてのメンズエステアルバイト" />
                </Link>
              </div>
            </div>
            <ul className="header-menu">
              <li className="data">
                <em>{currentDate}更新</em>
                メンズエステ求人情報<span>4061</span>件掲載
              </li>
            </ul>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-area">
        <section className="area-wrap">
          <video autoPlay loop muted playsInline>
            <source src="/images/window_01.mp4" type="video/mp4" />
          </video>
          <div className="region-section">
            <div className="index-txt">
              <h2>エリアからエステ求人を探す</h2>
              <p className="subtxt">【はじめてのメンズエステアルバイト】ならエステ求人情報が満載です。</p>
            </div>
            <nav className="areabtn">
              <ul>
                <li>
                  <Link href="/kantou">関東<span>KANTOU</span></Link>
                  <Link href="/kansai">関西<span>KANSAI</span></Link>
                  <Link href="/tokai">東海<span>TOKAI</span></Link>
                </li>
                <li>
                  <Link href="/hokkaidotohoku">北海道・東北<span>HOKKAIDO・TOHOKU</span></Link>
                  <Link href="/koshinetuhokuriku">甲信越・北陸<span>KOUSHINETSU・HOKURIKU</span></Link>
                  <Link href="/chugokushikoku">中国・四国<span>CHUGOKU・SHIKOKU</span></Link>
                  <Link href="/kyusyuokinawa">九州・沖縄<span>KYUSHU・OKINAWA</span></Link>
                </li>
              </ul>
            </nav>
            <div className="topimg wow bounceInDown animated" style={{ visibility: "visible", animationName: "bounceInDown" }}>
              <img src="/images/topimg_01.png" alt="働きたいエリアを選んでネ" />
            </div>
          </div>
        </section>

        <div className="main-bg">
          <p className="bg1"></p>
          <p className="bg2"></p>
          <p className="bg3"></p>
        </div>
        <div className="sub-bg">
          <p className="bg-circle-1"></p>
          <p className="bg-circle-2"></p>
        </div>
      </main>

      <section className="sitetxt">
        <dl>
          <dt>2026年最新のメンズエステ求人情報サイトなら【はじめてのメンズエステアルバイト（はじエス）】</dt>
          <dd>
            2026年最新のメンズエステ求人情報【はじめてのメンズエステアルバイト（はじエス）】は、未経験の女性向け求人・転職情報サイトです。メンズエステは健全なマッサージ店として近年注目を集めている業種で、【関東・関西・東海・北海道/東北・甲信越/北陸・中国/四国・九州/沖縄】にたくさんの店舗があり、常にセラピストさんを募集しています。
            <br />
            <br />メンズエステはアロマオイルを使用したリラクゼーションマッサージが中心お仕事ですが、他マッサージ店よりも圧倒的に高収入を実現できます。【完全日払い・指名料バック・オプション料バック・完全自由出勤制・保証制度あり】なども、メンズエステならではの待遇です。
            <br />
            <br />マッサージは専門スキルを必要としていますが、メンズエステは未経験の女性でも気軽にプロのセラピストを目指せる環境です。その理由は【研修制度・講習制度】にあります。女性講師による実技指導を設けているお店も多く、数時間程度の講習でプロとしてデビューが可能となっています。より高みを目指す方は、資格取得支援を行っているお店もありますよ。
            <br />
            <br />自分に合ったお店を探すには、求人などの情報サイトを見るだけでは限りがあります。メンズエステは見学・体験入店制度もあるので、お試しで働いてみるということも可能です。夢を叶えたい、高収入を稼ぎたい、そんな気持ちをお持ちの女性は【はじめてのメンズエステアルバイト（はじエス）】から、まずはメンズエステ店探しをしてみてください。
          </dd>
        </dl>
      </section>

      {/* Footer */}
      <footer className="footer">
        <nav className="footer_nav">
          <ul>
            <li><Link href="/companyinfo">会社概要</Link></li>
            <li><Link href="/rules">利用規約</Link></li>
            <li><Link href="/publicity/form">掲載申し込み</Link></li>
            <li><Link href="/link">リンクについて</Link></li>
            <li><Link href="/publicity">媒体資料</Link></li>
            <li><Link href="/guideline">広告掲載ガイドライン</Link></li>
            <li><Link href="/contact">お問い合わせ</Link></li>
            <li><Link href="/login">店舗ログイン</Link></li>
          </ul>
        </nav>
        <p className="copyright">Copyright 2022 はじめてのメンズエステアルバイト All rights reserved.</p>
      </footer>
    </div>
  );
}
