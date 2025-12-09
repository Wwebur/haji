# はじめてのメンズエステアルバイト - Job Listing Site

A Next.js-based job listing website for spa/massage businesses in Japan.

## Features

- 🔍 Search functionality with keyword filtering
- 📍 Multi-level area filtering (Regions → Prefectures → Cities)
- 🏷️ Industry type filtering (Room-type, Mobile, Store-type)
- 📄 Pagination with 20 items per page
- 💎 Premium listing tiers (Gold, Silver, Portion plans)
- 📱 Fully responsive design
- 🎨 Modern UI with smooth animations

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Custom CSS
- **Fonts**: Noto Sans JP

## Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main page
│   └── globals.css         # Global styles
├── components/
│   ├── ShopCard.tsx        # Shop listing card
│   ├── Sidebar.tsx         # Left sidebar with filters
│   ├── FilterBar.tsx       # Top filter bar
│   └── Pagination.tsx      # Pagination component
├── types/
│   └── index.ts            # TypeScript interfaces
└── mockup/
    ├── areas.json          # Region/Prefecture/City data
    └── shops.json          # Shop listings data
```

## Getting Started

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Run development server**:
   ```bash
   pnpm dev
   ```

3. **Open browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Data Structure

### Regions
The site supports 7 regions:
- 関東 (Kantou)
- 関西 (Kansai)
- 東海 (Tokai)
- 北海道・東北 (Hokkaido-Tohoku)
- 甲信越・北陸 (Koshinetsu-Hokuriku)
- 中国・四国 (Chugoku-Shikoku)
- 九州・沖縄 (Kyushu-Okinawa)

### Industry Types
- ルーム型 (Room-type)
- 出張型 (Mobile)
- 店舗型 (Store-type)

## Features Explanation

### Filtering
- **Keyword Search**: Search by shop name, catch copy, or area
- **Area Filter**: Filter by prefecture or city
- **Industry Filter**: Filter by business type
- **Combined Filters**: All filters work together

### Pagination
- 20 items per page
- Shows current page and total items
- Smooth scroll to top on page change

### Shop Cards
- Premium tier badges (Gold/Silver/Portion)
- Shop image and details
- Genre and area tags
- Salary, qualifications, work hours, and address
- Favorite and detail buttons

## Customization

### Changing Items Per Page
Edit `ITEMS_PER_PAGE` constant in `app/page.tsx`:
```typescript
const ITEMS_PER_PAGE = 20; // Change this value
```

### Changing Default Region
Edit `currentRegion` in `app/page.tsx`:
```typescript
const currentRegion = "kantou"; // Change to other region slug
```

### Styling
- Modify colors in `app/globals.css` CSS variables
- Tailwind classes can be added to components
- Responsive breakpoints: 1024px (tablet), 640px (mobile)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Copyright 2022 はじめてのメンズエステアルバイト All rights reserved.
