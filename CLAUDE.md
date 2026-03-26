# CLAUDE.md

## Local Dev Server

The local dev server is running at **http://127.0.0.1:9292**. Use `curl` via Bash to fetch pages from it — **WebFetch cannot reach localhost** (it routes through an external service). Use this URL for e2e tests (`BASE_URL=http://127.0.0.1:9292`).

## CRITICAL: Testing Is Part of Done

**Before completing ANY task**, you MUST:
1. Check `git diff --name-only` to see what files you changed
2. Use the file mapping below to identify affected e2e test files
3. Update those e2e tests (new tests for new features, fix broken selectors for changed UI)
4. Run `shopify theme check` and affected e2e tests
5. Do NOT consider the task complete until all tests pass

This is non-negotiable. The Stop hook will block you if you skip this.

---

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Business Context

**Saturday Co** (saturday.shop) sells custom collegiate apparel. The core differentiator: designs feature graphics, landmarks, traditions, and inside jokes that only students/alumni of each specific university would recognize. This is anti-template — every school gets unique designs rooted in its culture, not generic logo-on-a-shirt products.

**Mission:** Marry current fashion with the traditions, landmarks, and stories unique to each university — creating apparel fans, students, and alumni are proud to wear well beyond gameday. "Your school deserves more than a template."

**Brand pillars:** School-specific authenticity, insider knowledge, fashion-forward (not just gameday gear), anti-template.

## Project Overview

This is a **Shopify Skeleton Theme** for the store `0c7dc8-3.myshopify.com`. It's a minimal, intentionally simple theme meant as a foundational starting point — not a fully-featured theme. All changes should preserve this minimalist philosophy.

## Development Commands

```bash
# Start dev server
./start.sh
# or directly:
shopify theme dev --store=0c7dc8-3.myshopify.com

# Lint theme
shopify theme check

# Deploy
shopify theme push
```

**Prerequisites:** Shopify CLI (`shopify` command must be available).

## Architecture

### Template System (JSON Templates)

Templates use the **modern JSON format** (not Liquid). Each `.json` template in `templates/` declares which sections to render and their settings. Exception: `gift_card.liquid` which requires Liquid format.

### Component Hierarchy

**Layout** (`layout/theme.liquid`) → **Sections** → **Blocks** → **Snippets**

- **Sections** (`sections/`): Full-width page components with `{% schema %}` for customization. Can embed CSS via `{% stylesheet %}` and JS via `{% javascript %}`.
- **Blocks** (`blocks/`): Nestable, reusable components within sections. Use `{{ block.shopify_attributes }}` for theme editor integration.
- **Snippets** (`snippets/`): Reusable Liquid fragments (CSS variables, image rendering, meta tags).

### CSS Architecture

- `assets/critical.css`: Preloaded on every page. Contains reset, grid system, and base layout.
- `snippets/css-variables.liquid`: Injects CSS custom properties from theme settings into `:root`.
- Section-scoped styles use `{% stylesheet %}` tags within each section.

**Layout grid pattern:**
```
.shopify-section uses a 3-column grid: [margin] [content] [margin]
- Default children → grid-column: 2 (constrained)
- .full-width → grid-column: 1 / -1 (viewport-spanning)
```

**Settings-to-CSS conventions:**
- Single CSS property → CSS variable + `{% stylesheet %}`
- Multiple properties → CSS class with semantic name (e.g., `collection--compact`)
- Dynamic inline → `style="--gap: {{ block.settings.gap }}px"`

### Theme Settings

`config/settings_schema.json` defines customization: typography (Work Sans default), layout (max width, margins), and colors. Uses translation keys (`t:namespace.key`).

### Font Loading Strategy

Preconnects to `fonts.shopifycdn.com`, preloads only the base font variant, defers additional weights via `@font-face`.

## Store Data Model (Metaobjects)

### School (custom, type: `school`)

The central business entity — links products to universities. Currently 15 schools, growing.

Fields: Name, Slug (e.g. "auburn"), Conference, Primary color, Secondary color, Logo (image).

Products reference School metaobjects for per-university theming (colors, logos).

### Standard Product Attribute Metaobjects

All use Shopify's built-in types with a Label + Base taxonomy value pattern:

- **Color** (`shopify--color-pattern`) — richer than others: Label, Color, Image, Base color (list), Base pattern
- **Size** (`shopify--size`)
- **Fabric** (`shopify--fabric`)
- **Neckline** (`shopify--neckline`)
- **Target gender** (`shopify--target-gender`)
- **Top length type** (`shopify--top-length-type`)
- **Age group** (`shopify--age-group`)
- **Sleeve length type** (`shopify--sleeve-length-type`)

## CI/CD

GitHub Actions runs `shopify/theme-check-action@v2` on every push. Config extends `theme-check:recommended` (`.theme-check.yml`).

## Conventions

- Semantic HTML, minimal JavaScript (web components when needed, e.g., `<shopify-account>`)
- All user-facing strings use i18n keys from `locales/en.default.json`
- `{% doc %}` blocks provide JSDoc-style documentation for blocks
- `config/settings_data.json` is auto-generated by Shopify admin — don't edit manually

## E2E Testing

- **Framework**: Playwright (run with `npm run test:e2e`, UI mode with `npm run test:e2e:ui`)
- **Test location**: `e2e/`
- **Base URL**: Defaults to `https://0c7dc8-3.myshopify.com`, override with `BASE_URL` env var for local dev (`BASE_URL=http://127.0.0.1:9292 npm run test:e2e`)
- **Convention**: When changing a section or component, update or add the corresponding e2e test
- **File mapping**:
  - `sections/featured-collection.liquid` → `e2e/featured-collection.spec.ts`
  - `sections/hero-banner.liquid` → `e2e/hero-banner.spec.ts`
  - `sections/conference-nav.liquid` → `e2e/conference-nav.spec.ts`
  - `sections/marquee.liquid` → `e2e/marquee.spec.ts`
  - `sections/brand-statement.liquid` → `e2e/brand-statement.spec.ts`
  - `sections/full-width-image.liquid` → `e2e/full-width-image.spec.ts`
  - `sections/testimonials.liquid` → `e2e/testimonials.spec.ts`
  - `sections/collection-cards.liquid` → `e2e/collection-cards.spec.ts`
  - `sections/newsletter-cta.liquid` → `e2e/newsletter-cta.spec.ts`
  - `sections/recently-viewed.liquid` → `e2e/recently-viewed.spec.ts`
  - `sections/collection.liquid` → `e2e/collection.spec.ts`
  - `sections/search.liquid` → `e2e/search.spec.ts`
  - Layout/header/footer/navigation changes → `e2e/smoke.spec.ts`
  - New sections → create a new `e2e/<section-name>.spec.ts`
- **Verify script**: `scripts/verify.sh` runs via Stop hook — reports changed files and affected test files
- **Browser**: Chromium only (keeps CI fast)
