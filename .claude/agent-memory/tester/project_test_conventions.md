---
name: E2E test conventions
description: Playwright test patterns for Saturday Co carousel sections and product cards
type: project
---

Key test patterns observed in e2e specs:

- **Carousel animation helper:** `ensureCarouselVisible(page)` scrolls section into view, waits for `carousel--visible` class (IntersectionObserver), then waits for first card opacity:1
- **Recently viewed helper:** `waitForFallbackAnimation(page)` does the same for `.recently-viewed` section
- **Wait strategy:** Always use `waitUntil: 'domcontentloaded'` (never `networkidle` or `load` -- dev server hangs)
- **Product card selectors:** `.product-card`, `product-card` (custom element), `.product-card__quick-add`, `.product-card__dropdown`, `.product-card__image-slide`
- **Carousel selectors:** `product-carousel` (custom element), `.featured-collection__track`, `.featured-collection__arrow--next/--prev`
- **Recently viewed selectors:** `.recently-viewed`, `[data-recently-viewed-fallback]`, `[data-recently-viewed-main]`, `.recently-viewed__track`

**Scoping rule:** Always scope `product-card` / `product-carousel` locators to their parent section (e.g., `carousel.locator('product-card')` not `page.locator('product-card')`). The page has 60+ product-card elements across multiple sections; unscoped `.first()` picks up cards from other sections that may have `visibility: hidden` due to carousel entrance animations.

**Shadow DOM pitfall:** Playwright pierces shadow DOM by default. `header svg` matches 100+ SVGs including those inside `<shopify-account>`, `<shopify-login-form>`, `<shop-login>`, and third-party widgets (slidecarthq). For header icon tests, scope to `.header__icons` or `.header__hamburger` children, and avoid selecting inside shadow roots of Shopify web components. Use `toBeLessThanOrEqual(18)` for 1.1rem SVGs (17.6px at 16px base), not `toBeLessThan(24)`.

**How to apply:** Match these conventions when writing new tests for carousel-based sections or header/icon components.
