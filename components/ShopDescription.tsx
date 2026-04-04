"use client";

import { useState } from "react";

interface ShopDescriptionProps {
  descriptionHtml: string;
}

export default function ShopDescription({ descriptionHtml }: Readonly<ShopDescriptionProps>) {
  const [expanded, setExpanded] = useState(false);

  return (
    <dd className="content-wrap">
      <div
        className={`content-txt shop_comment${expanded ? " is-expanded" : ""}`}
        dangerouslySetInnerHTML={{ __html: descriptionHtml }}
      />
      <div className="more-btn">
        <button
          type="button"
          className="more-btn-toggle"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
        >
          {expanded ? "閉じる" : "もっと見る"}
        </button>
      </div>
    </dd>
  );
}
