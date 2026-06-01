# Design System Specification (DESIGN.md)

## 1. Visual Theme
- **Vibe:** 簡潔、現代、高對比、除了必要的功能性提示與引導，沒有其他過多的顏色，沒有任何非必要性的裝飾。
- **Density:** 資訊密度高，適度留白
## 2. Color Palette
- `primary`: `078dee` (CTAs, active states, key interactive elements)
- `background`: `#141A21` (淺灰背景)
- `surface`: `#262626` (卡片與模態視窗)
- `text-main`: `#ffffff` (深灰主要文字)
- `text-muted`: `#b8c5d1` (淺灰輔助文字)
- `success`: `#10B981` (成功訊息)
- `danger`: `#ff5631` (錯誤/警告)

## 3. Typography
- **Font Family:** Inter, system-ui, -apple-system, sans-serif
- **H1:** Size: 32px | Weight: Bold | Line Height: 40px
- **H2:** Size: 24px | Weight: Semi-Bold | Line Height: 32px
- **Body:** Size: 16px | Weight: Regular | Line Height: 24px
- **Small:** Size: 14px | Weight: Regular | Line Height: 20px

## 4. Spacing (8px Grid)
- `space-1`: 4px
- `space-2`: 8px
- `space-3`: 16px (預設基準)
- `space-4`: 24px
- `space-5`: 32px
- `space-6`: 48px

## 5. Components
### Buttons
- **Border Radius:** 16px
- **Padding:** 10px 16px
- **Shadow:** None (預設)
- **Hover Effect:** `transform: translateY(-1px)`, `box-shadow: 0 4px 6px rgba(0,0,0,0.1)`

### Cards
- **Border Radius:** 12px
- **Border:** 1px solid `#E5E7EB`
- **Shadow:** `0 1px 3px rgba(0,0,0,0.1)`

## 6. Do's and Don'ts
- **DO:** Always use semantic color variables (e.g., use `text-muted` instead of generic gray).
- **DO:** Ensure 4.5:1 contrast ratio for all texts.
- **DON'T:** Use harsh pure black (`#000000`) for text.
- **DON'T:** Mix different border radiuses on the same card.

## 7. Responsive Breakpoints
- **Mobile:** < 640px
- **Tablet:** 640px - 1024px
- **Desktop:** > 1024px
