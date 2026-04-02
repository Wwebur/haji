"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";

interface ShopMainImageSwiperProps {
  images: string[];
  shopName: string;
  fallbackImage?: string | null;
}

const AUTOPLAY_DELAY_MS = 3000;

export default function ShopMainImageSwiper({
  images,
  shopName,
  fallbackImage,
}: Readonly<ShopMainImageSwiperProps>) {
  const [index, setIndex] = useState(0);

  // Always use swiper: if we have mainImages use them; otherwise use fallback as single slide.
  // For 1 image, duplicate so the carousel can loop infinitely (same image repeated).
  const slides = useMemo(() => {
    let list: string[];
    const validImages = images.filter((img) => img);
    if (validImages.length > 0) {
      list = validImages;
    } else if (fallbackImage) {
      list = [fallbackImage];
    } else {
      list = [];
    }
    if (list.length === 1) {
      const src = list[0];
      return [
        { src, key: `${src}-slide-0` },
        { src, key: `${src}-slide-1` },
      ];
    }
    return list.map((src, i) => ({ src, key: `${src}-${i}` }));
  }, [images, fallbackImage]);

  const count = slides.length;

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % count);
  }, [count]);

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + count) % count);
  }, [count]);

  useEffect(() => {
    if (count === 0) return;
    const id = setInterval(goNext, AUTOPLAY_DELAY_MS);
    return () => clearInterval(id);
  }, [count, goNext]);

  if (count === 0) {
    return null;
  }

  return (
    <div className="shop_main_images swiper-shop-main">
      <button
        type="button"
        className="swiper-button-prev"
        aria-label="Previous slide"
        onClick={goPrev}
      />
      <button
        type="button"
        className="swiper-button-next"
        aria-label="Next slide"
        onClick={goNext}
      />
      <div className="swiper">
        <div
          className="swiper-wrapper"
          style={{
            width: `${count * 100}%`,
            transform: `translate3d(-${(index / count) * 100}%, 0px, 0px)`,
            transitionDuration: "300ms",
          }}
        >
          {slides.map((slide) => (
            <div
              key={slide.key}
              className="swiper-slide"
              style={{ width: `${100 / count}%` }}
            >
              <Image
                src={slide.src}
                alt={`${shopName}の求人画像 ${shopName}のメンズエステ求人`}
                width={700}
                height={300}
                unoptimized
                className="shop-main-img"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
