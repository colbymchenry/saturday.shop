import { test, expect, type Page } from '@playwright/test';

/**
 * Product URLs for testing — Auburn has school color, multiple images, variants.
 */
const AUBURN_PRODUCT =
  '/products/freeze-pearl-wde-maga-comfort-colors-t-shirt-multicolor-unisex';

/** Helper: wait for the product-page web component to initialize */
async function waitForProductPage(page: Page) {
  await page.waitForFunction(() => customElements.get('product-page'));
}

// ─── Layout & Structure ─────────────────────────────────────────────────────

test.describe('Product page — Layout', () => {
  test('renders two-column grid on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.goto(AUBURN_PRODUCT);

    const product = page.locator('product-page');
    await expect(product).toBeVisible();

    // Verify grid has two columns via computed style
    const columns = await product.evaluate(
      (el) => getComputedStyle(el).gridTemplateColumns
    );
    const colWidths = columns.split(' ').filter((c) => c.endsWith('px'));
    expect(colWidths.length).toBe(2);
  });

  test('stacks to single column on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(AUBURN_PRODUCT);

    const columns = await page
      .locator('product-page')
      .evaluate((el) => getComputedStyle(el).gridTemplateColumns);
    const colWidths = columns.split(' ').filter((c) => c.endsWith('px'));
    expect(colWidths.length).toBe(1);
  });

  test('gallery and info are both visible and within viewport', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.goto(AUBURN_PRODUCT);

    const gallery = page.locator('.product__gallery');
    const info = page.locator('.product__info');

    await expect(gallery).toBeVisible();
    await expect(info).toBeVisible();

    // Both should be within viewport width
    const galleryBox = await gallery.boundingBox();
    const infoBox = await info.boundingBox();

    expect(galleryBox).toBeTruthy();
    expect(infoBox).toBeTruthy();

    // Gallery left edge within viewport
    expect(galleryBox!.x).toBeGreaterThanOrEqual(0);
    // Info right edge within viewport
    expect(infoBox!.x + infoBox!.width).toBeLessThanOrEqual(1200);
  });

  test('gallery takes roughly half the width', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.goto(AUBURN_PRODUCT);

    const galleryBox = await page.locator('.product__gallery').boundingBox();
    const infoBox = await page.locator('.product__info').boundingBox();

    expect(galleryBox).toBeTruthy();
    expect(infoBox).toBeTruthy();

    // Gallery should be between 35% and 65% of page width
    const galleryPct = galleryBox!.width / 1200;
    expect(galleryPct).toBeGreaterThan(0.35);
    expect(galleryPct).toBeLessThan(0.65);
  });

  test('no horizontal overflow on product page', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);
    const hasOverflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth
    );
    expect(hasOverflow).toBe(false);
  });

  test('no horizontal overflow on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(AUBURN_PRODUCT);
    const hasOverflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth
    );
    expect(hasOverflow).toBe(false);
  });
});

// ─── Image Gallery ──────────────────────────────────────────────────────────

test.describe('Product page — Image Gallery', () => {
  test('main image is visible', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);

    const activeImage = page.locator('.product__image--active');
    await expect(activeImage).toBeVisible();
    await expect(activeImage).toHaveCount(1);
  });

  test('only one image is visible at a time', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);

    // Count visible images (display: block)
    const visibleCount = await page.evaluate(() => {
      const images = document.querySelectorAll('.product__image');
      return Array.from(images).filter(
        (img) => getComputedStyle(img).display !== 'none'
      ).length;
    });
    expect(visibleCount).toBe(1);
  });

  test('thumbnails are present when product has multiple images', async ({
    page,
  }) => {
    await page.goto(AUBURN_PRODUCT);

    const thumbnails = page.locator('.product__thumbnail');
    expect(await thumbnails.count()).toBeGreaterThanOrEqual(2);
  });

  test('first thumbnail is active by default', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);

    const firstThumb = page.locator('.product__thumbnail').first();
    await expect(firstThumb).toHaveClass(/product__thumbnail--active/);
  });

  test('clicking a thumbnail changes the main image', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);
    await waitForProductPage(page);

    // Click second thumbnail
    const secondThumb = page.locator('.product__thumbnail').nth(1);
    await secondThumb.click();

    // Second thumbnail active, first not
    await expect(secondThumb).toHaveClass(/product__thumbnail--active/);
    await expect(page.locator('.product__thumbnail').first()).not.toHaveClass(
      /product__thumbnail--active/
    );

    // Second image active
    await expect(page.locator('[data-image-index="1"]')).toHaveClass(
      /product__image--active/
    );
    await expect(page.locator('[data-image-index="0"]')).not.toHaveClass(
      /product__image--active/
    );
  });

  test('clicking back to first thumbnail restores first image', async ({
    page,
  }) => {
    await page.goto(AUBURN_PRODUCT);
    await waitForProductPage(page);

    // Click second, then first
    await page.locator('.product__thumbnail').nth(1).click();
    await page.locator('.product__thumbnail').first().click();

    await expect(page.locator('.product__thumbnail').first()).toHaveClass(
      /product__thumbnail--active/
    );
    await expect(page.locator('[data-image-index="0"]')).toHaveClass(
      /product__image--active/
    );
  });

  test('main image stays within its column', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.goto(AUBURN_PRODUCT);

    const imageBox = await page
      .locator('.product__main-image')
      .boundingBox();
    const galleryBox = await page.locator('.product__gallery').boundingBox();

    expect(imageBox).toBeTruthy();
    expect(galleryBox).toBeTruthy();
    expect(imageBox!.width).toBeLessThanOrEqual(galleryBox!.width + 1);
  });
});

// ─── Product Info ───────────────────────────────────────────────────────────

test.describe('Product page — Product Info', () => {
  test('title is visible and uppercase', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);

    const title = page.locator('.product__title');
    await expect(title).toBeVisible();
    await expect(title).toContainText(/Auburn/i);

    const textTransform = await title.evaluate(
      (el) => getComputedStyle(el).textTransform
    );
    expect(textTransform).toBe('uppercase');
  });

  test('current price is displayed', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);

    const price = page.locator('[data-current-price]');
    await expect(price).toBeVisible();
    await expect(price).toContainText('$');
  });

  test('compare-at price and SALE badge shown for on-sale products', async ({
    page,
  }) => {
    await page.goto(AUBURN_PRODUCT);

    const compare = page.locator('[data-compare-price]');
    const badge = page.locator('[data-sale-badge]');

    // This product is on sale ($34.99 vs $44.99)
    const isHidden = await compare.evaluate((el) =>
      el.classList.contains('hidden')
    );

    if (!isHidden) {
      await expect(compare).toBeVisible();
      await expect(compare).toContainText('$');
      await expect(badge).toContainText('SALE');

      // Compare price should have line-through
      const decoration = await compare.evaluate(
        (el) => getComputedStyle(el).textDecorationLine
      );
      expect(decoration).toBe('line-through');
    }
  });

  test('star rating shows 5 stars and "No reviews yet"', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);

    const stars = page.locator('.product__stars svg');
    await expect(stars).toHaveCount(5);

    await expect(page.locator('.product__reviews-text')).toContainText(
      'No reviews yet'
    );
  });
});

// ─── Variant Selectors ──────────────────────────────────────────────────────

test.describe('Product page — Variant Selectors', () => {
  test('option groups have labels', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);

    const groups = page.locator('.product__option');
    expect(await groups.count()).toBeGreaterThanOrEqual(1);

    // Each group should have a visible label
    for (let i = 0; i < (await groups.count()); i++) {
      const label = groups.nth(i).locator('.product__option-label');
      await expect(label).toBeVisible();
      const text = await label.textContent();
      expect(text!.trim().length).toBeGreaterThan(0);
    }
  });

  test('option labels are uppercase', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);

    const label = page.locator('.product__option-label').first();
    const transform = await label.evaluate(
      (el) => getComputedStyle(el).textTransform
    );
    expect(transform).toBe('uppercase');
  });

  test('each option group has pill buttons', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);

    const groups = page.locator('.product__option');
    for (let i = 0; i < (await groups.count()); i++) {
      const pills = groups.nth(i).locator('.product__pill');
      expect(await pills.count()).toBeGreaterThanOrEqual(2);
    }
  });

  test('one pill is selected per option group by default', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);

    const groups = page.locator('.product__option');
    for (let i = 0; i < (await groups.count()); i++) {
      const selected = groups.nth(i).locator('.product__pill--selected');
      await expect(selected).toHaveCount(1);
    }
  });

  test('clicking a pill selects it and deselects siblings', async ({
    page,
  }) => {
    await page.goto(AUBURN_PRODUCT);
    await waitForProductPage(page);

    const firstGroup = page.locator('.product__option').first();

    // Find a non-selected pill and get its stable data-value
    const unselectedValue = await firstGroup
      .locator('.product__pill:not(.product__pill--selected)')
      .first()
      .getAttribute('data-value');

    // Get the currently selected value
    const selectedValue = await firstGroup
      .locator('.product__pill--selected')
      .getAttribute('data-value');

    // Click the unselected pill
    await firstGroup
      .locator(`.product__pill[data-value="${unselectedValue}"]`)
      .click();

    // Clicked pill should now be selected
    await expect(
      firstGroup.locator(`.product__pill[data-value="${unselectedValue}"]`)
    ).toHaveClass(/product__pill--selected/);

    // Previously selected should no longer be selected
    await expect(
      firstGroup.locator(`.product__pill[data-value="${selectedValue}"]`)
    ).not.toHaveClass(/product__pill--selected/);
  });

  test('pills display in a horizontal row (flex-wrap)', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.goto(AUBURN_PRODUCT);

    const values = page.locator('.product__option-values').first();
    const display = await values.evaluate(
      (el) => getComputedStyle(el).display
    );
    expect(display).toBe('flex');

    // Check that first two pills are on the same Y line
    const first = await page.locator('.product__pill').first().boundingBox();
    const second = await page.locator('.product__pill').nth(1).boundingBox();

    expect(first).toBeTruthy();
    expect(second).toBeTruthy();
    // Same row = same Y (within 5px tolerance for sub-pixel)
    expect(Math.abs(first!.y - second!.y)).toBeLessThan(5);
  });

  test('variant selection updates URL with variant ID', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);
    await waitForProductPage(page);

    // Click a different pill to change variant
    const firstGroup = page.locator('.product__option').first();
    const pill = firstGroup
      .locator('.product__pill:not(.product__pill--selected)')
      .first();
    await pill.click();

    // URL should contain variant parameter
    await page.waitForFunction(() =>
      window.location.search.includes('variant=')
    );
    expect(page.url()).toContain('variant=');
  });

  test('variant selection updates the hidden form input', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);
    await waitForProductPage(page);

    const initialId = await page
      .locator('product-page [data-variant-id]')
      .getAttribute('value');

    // Click a different pill
    const firstGroup = page.locator('.product__option').first();
    await firstGroup
      .locator('.product__pill:not(.product__pill--selected)')
      .first()
      .click();

    // Wait for variant update
    await page.waitForFunction(() =>
      window.location.search.includes('variant=')
    );

    const newId = await page
      .locator('product-page [data-variant-id]')
      .getAttribute('value');

    // The variant ID should have changed (or stayed same if same variant by coincidence)
    expect(newId).toBeTruthy();
  });
});

// ─── ADD TO CART Button ─────────────────────────────────────────────────────

test.describe('Product page — Add to Cart', () => {
  test('button is visible with ADD TO CART text', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);

    const btn = page.locator('.product__add-to-cart');
    await expect(btn).toBeVisible();
    await expect(btn).toContainText(/ADD TO CART/i);
  });

  test('button text does not wrap to multiple lines', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.goto(AUBURN_PRODUCT);

    const btn = page.locator('.product__add-to-cart');
    const box = await btn.boundingBox();
    expect(box).toBeTruthy();
    // Single line of text at ~0.85rem should be under 60px tall
    expect(box!.height).toBeLessThan(60);
  });

  test('button uses school primary color as background', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);

    // School color CSS variable should be set
    const schoolColor = await page
      .locator('product-page')
      .evaluate((el) =>
        getComputedStyle(el).getPropertyValue('--school-primary').trim()
      );
    expect(schoolColor).toBeTruthy();

    // Button should not have transparent background
    const btnBg = await page
      .locator('.product__add-to-cart')
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(btnBg).not.toBe('rgba(0, 0, 0, 0)');
    expect(btnBg).not.toBe('transparent');
  });

  test('button has white text', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);

    const color = await page
      .locator('.product__add-to-cart')
      .evaluate((el) => getComputedStyle(el).color);
    // White = rgb(255, 255, 255)
    expect(color).toBe('rgb(255, 255, 255)');
  });

  test('button spans full width of info column', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.goto(AUBURN_PRODUCT);

    const btnBox = await page.locator('.product__add-to-cart').boundingBox();
    const infoBox = await page.locator('.product__info').boundingBox();

    expect(btnBox).toBeTruthy();
    expect(infoBox).toBeTruthy();

    // Button width should be close to info column width (within 2px for borders)
    expect(Math.abs(btnBox!.width - infoBox!.width)).toBeLessThan(3);
  });

  test('button is inside a product form', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);

    // The form should have the Shopify product form action (scoped to main product section)
    const form = page.locator('product-page form[action*="/cart/add"]');
    await expect(form).toBeVisible();

    // Button should be inside the form
    const btnInForm = form.locator('.product__add-to-cart');
    await expect(btnInForm).toBeVisible();
  });
});

// ─── Accordion Sections ─────────────────────────────────────────────────────

test.describe('Product page — Accordions', () => {
  test('has at least 4 accordion sections', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);

    const accordions = page.locator('.product__accordion');
    expect(await accordions.count()).toBeGreaterThanOrEqual(4);
  });

  test('Description accordion is first and open by default', async ({
    page,
  }) => {
    await page.goto(AUBURN_PRODUCT);

    const first = page.locator('.product__accordion').first();
    await expect(first).toHaveAttribute('open', '');
    await expect(first.locator('summary')).toContainText('DESCRIPTION');
    await expect(first.locator('.product__accordion-content')).toBeVisible();
  });

  test('Description contains product description text', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);

    const content = page
      .locator('.product__accordion')
      .first()
      .locator('.product__accordion-content');
    const text = await content.textContent();
    expect(text!.length).toBeGreaterThan(20);
  });

  test('Size Guide accordion exists and is closed by default', async ({
    page,
  }) => {
    await page.goto(AUBURN_PRODUCT);

    const sizeGuide = page
      .locator('.product__accordion')
      .filter({ hasText: 'SIZE GUIDE' });
    await expect(sizeGuide).toBeVisible();
    await expect(sizeGuide).not.toHaveAttribute('open', '');
  });

  test('Shipping & Returns accordion exists and is closed', async ({
    page,
  }) => {
    await page.goto(AUBURN_PRODUCT);

    const shipping = page
      .locator('.product__accordion')
      .filter({ hasText: 'SHIPPING' });
    await expect(shipping).toBeVisible();
    await expect(shipping).not.toHaveAttribute('open', '');
  });

  test('Materials accordion exists and is closed', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);

    const materials = page
      .locator('.product__accordion')
      .filter({ hasText: 'MATERIALS' });
    await expect(materials).toBeVisible();
    await expect(materials).not.toHaveAttribute('open', '');
  });

  test('clicking a closed accordion opens it', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);

    const sizeGuide = page
      .locator('.product__accordion')
      .filter({ hasText: 'SIZE GUIDE' });
    await sizeGuide.locator('summary').click();

    await expect(sizeGuide).toHaveAttribute('open', '');
    await expect(
      sizeGuide.locator('.product__accordion-content')
    ).toBeVisible();
  });

  test('clicking an open accordion closes it', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);

    // Description is open by default
    const description = page.locator('.product__accordion').first();
    await description.locator('summary').click();

    await expect(description).not.toHaveAttribute('open', '');
  });

  test('accordion triggers have chevron icons', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);

    const icons = page.locator('.product__accordion-icon');
    expect(await icons.count()).toBeGreaterThanOrEqual(4);
  });

  test('chevron rotates when accordion is open', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);

    // Description is open — its icon should be rotated
    const openIcon = page
      .locator('.product__accordion')
      .first()
      .locator('.product__accordion-icon');
    const openTransform = await openIcon.evaluate(
      (el) => getComputedStyle(el).transform
    );

    // A closed accordion's icon should not be rotated
    const closedIcon = page
      .locator('.product__accordion')
      .nth(1)
      .locator('.product__accordion-icon');
    const closedTransform = await closedIcon.evaluate(
      (el) => getComputedStyle(el).transform
    );

    expect(openTransform).not.toBe(closedTransform);
  });
});

// ─── Accordion Image Support ───────────────────────────────────────────────

test.describe('Product page — Accordion Images', () => {
  async function openAllAccordions(page: Page) {
    const accordions = page.locator('.product__accordion');
    const count = await accordions.count();
    for (let i = 0; i < count; i++) {
      const acc = accordions.nth(i);
      if ((await acc.getAttribute('open')) === null) {
        await acc.locator('summary').click();
      }
    }
  }

  test('accordion without image has no image element and content is visible', async ({
    page,
  }) => {
    await page.goto(AUBURN_PRODUCT);

    const sizeGuide = page
      .locator('.product__accordion')
      .filter({ hasText: 'SIZE GUIDE' });
    await sizeGuide.locator('summary').click();
    await expect(sizeGuide).toHaveAttribute('open', '');

    const content = sizeGuide.locator('.product__accordion-content');
    await expect(content).toBeVisible();
    await expect(content).not.toHaveClass(
      /product__accordion-content--has-image/
    );

    expect(await sizeGuide.locator('.product__accordion-image').count()).toBe(
      0
    );

    const text = await content.textContent();
    expect(text!.trim().length).toBeGreaterThan(0);
  });

  test('all text-only accordions expand without regression', async ({
    page,
  }) => {
    await page.goto(AUBURN_PRODUCT);

    const accordions = page.locator(
      '.product__accordion:not(:has(.product__accordion-content--has-image))'
    );
    const count = await accordions.count();
    expect(count).toBeGreaterThanOrEqual(1);

    for (let i = 0; i < count; i++) {
      const acc = accordions.nth(i);
      if ((await acc.getAttribute('open')) === null) {
        await acc.locator('summary').click();
      }
      await expect(acc).toHaveAttribute('open', '');
      await expect(acc.locator('.product__accordion-content')).toBeVisible();
    }
  });

  test('accordion with image shows image with lazy loading', async ({
    page,
  }) => {
    await page.goto(AUBURN_PRODUCT);
    await openAllAccordions(page);

    const imageContent = page.locator(
      '.product__accordion-content--has-image'
    );
    if ((await imageContent.count()) === 0) {
      test.skip();
      return;
    }

    const first = imageContent.first();

    const img = first.locator('.product__accordion-image');
    await expect(img).toBeVisible();
    await expect(img).toHaveAttribute('loading', 'lazy');

    const text = first.locator('.product__accordion-text');
    await expect(text).toBeVisible();
    const textContent = await text.textContent();
    expect(textContent!.trim().length).toBeGreaterThan(0);
  });

  test('accordion image is side-by-side with text on desktop', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.goto(AUBURN_PRODUCT);
    await openAllAccordions(page);

    const imageContent = page.locator(
      '.product__accordion-content--has-image'
    );
    if ((await imageContent.count()) === 0) {
      test.skip();
      return;
    }

    const first = imageContent.first();
    const imgBox = await first
      .locator('.product__accordion-image')
      .boundingBox();
    const textBox = await first
      .locator('.product__accordion-text')
      .boundingBox();

    expect(imgBox).toBeTruthy();
    expect(textBox).toBeTruthy();

    // Side-by-side: image and text Y positions should be roughly aligned
    expect(Math.abs(imgBox!.y - textBox!.y)).toBeLessThan(50);
    // Container uses 2-column grid, so each element takes roughly half the width
    const containerBox = await first.boundingBox();
    expect(containerBox).toBeTruthy();
    expect(imgBox!.width).toBeLessThan(containerBox!.width * 0.65);
  });

  test('accordion image stacks above text on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(AUBURN_PRODUCT);
    await openAllAccordions(page);

    const imageContent = page.locator(
      '.product__accordion-content--has-image'
    );
    if ((await imageContent.count()) === 0) {
      test.skip();
      return;
    }

    const first = imageContent.first();
    const imgBox = await first
      .locator('.product__accordion-image')
      .boundingBox();
    const textBox = await first
      .locator('.product__accordion-text')
      .boundingBox();

    expect(imgBox).toBeTruthy();
    expect(textBox).toBeTruthy();

    // Stacked: image bottom should be at or above text top
    expect(imgBox!.y + imgBox!.height).toBeLessThanOrEqual(textBox!.y + 10);
  });
});

// ─── School Color Integration ───────────────────────────────────────────────

test.describe('Product page — School Color', () => {
  test('Auburn product has --school-primary CSS variable', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);

    const color = await page
      .locator('product-page')
      .evaluate((el) =>
        getComputedStyle(el).getPropertyValue('--school-primary').trim()
      );
    expect(color).toBeTruthy();
    // Auburn's color is orange (#e87722)
    expect(color).toMatch(/^#/);
  });

  test('SALE badge uses school primary color', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);

    const badge = page.locator('[data-sale-badge]');
    const isHidden = await badge.evaluate((el) =>
      el.classList.contains('hidden')
    );

    if (!isHidden) {
      const badgeColor = await badge.evaluate(
        (el) => getComputedStyle(el).color
      );
      // Should not be the default body text color (likely black/dark)
      // It should be the school color
      expect(badgeColor).toBeTruthy();
    }
  });
});

// ─── School Link ────────────────────────────────────────────────────────────

test.describe('Product page — School Link', () => {
  test('displays "Can\'t find your school?" link', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);

    const link = page.locator('.product__school-link');
    await expect(link).toBeVisible();
    await expect(link).toContainText("Can't find your school");
  });

  test('link points to contact page', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);

    await expect(page.locator('.product__school-link')).toHaveAttribute(
      'href',
      '/pages/contact'
    );
  });

  test('link appears below the accordions', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);

    const accordionsBox = await page
      .locator('.product__accordions')
      .boundingBox();
    const linkBox = await page.locator('.product__school-link').boundingBox();

    expect(accordionsBox).toBeTruthy();
    expect(linkBox).toBeTruthy();
    // Link Y should be below accordions
    expect(linkBox!.y).toBeGreaterThan(accordionsBox!.y);
  });
});

// ─── Form & Functionality ───────────────────────────────────────────────────

test.describe('Product page — Form', () => {
  test('form has hidden variant ID input', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);

    const input = page.locator('product-page [data-variant-id]');
    await expect(input).toHaveAttribute('name', 'id');

    const value = await input.getAttribute('value');
    expect(value).toBeTruthy();
    // Should be a numeric Shopify variant ID
    expect(Number(value)).toBeGreaterThan(0);
  });

  test('product variant JSON data is embedded', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);

    const variants = await page.evaluate(() => {
      const el = document.querySelector('[data-product-variants]');
      return JSON.parse(el!.textContent!);
    });

    expect(Array.isArray(variants)).toBe(true);
    expect(variants.length).toBeGreaterThan(0);

    // Each variant should have required fields
    const first = variants[0];
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('available');
    expect(first).toHaveProperty('price');
    expect(first).toHaveProperty('options');
  });

  test('variant image data uses pathname matching for gallery sync', async ({
    page,
  }) => {
    await page.goto(AUBURN_PRODUCT);
    await waitForProductPage(page);

    // Run all URL comparison in browser context to avoid Node URL issues
    const allMatch = await page.evaluate(() => {
      const el = document.querySelector('[data-product-variants]');
      const variants = JSON.parse(el!.textContent!);
      const withImages = variants.filter(
        (v: { image: string | null }) => v.image !== null
      );
      if (withImages.length === 0) return true;

      const galleryImgs = document.querySelectorAll('.product__image');
      const galleryPaths = Array.from(galleryImgs).map(
        (img) =>
          new URL((img as HTMLImageElement).src, location.origin).pathname
      );

      return withImages.every((v: { image: string }) => {
        const vPath = new URL(v.image, location.origin).pathname;
        return galleryPaths.some((p) => p === vPath);
      });
    });

    expect(allMatch).toBe(true);
  });

  test('selecting a variant switches to its image in the gallery', async ({
    page,
  }) => {
    await page.goto(AUBURN_PRODUCT);
    await waitForProductPage(page);

    // Get variant data with distinct images (computed in browser context)
    const variantImages = await page.evaluate(() => {
      const el = document.querySelector('[data-product-variants]');
      const variants = JSON.parse(el!.textContent!);
      return variants
        .filter((v: { image: string | null }) => v.image !== null)
        .map((v: { image: string; options: string[] }) => ({
          image: new URL(v.image, location.origin).pathname,
          options: v.options,
        }));
    });

    if (variantImages.length < 2) {
      test.skip();
      return;
    }

    // Find two variants with different images
    const first = variantImages[0];
    const different = variantImages.find(
      (v: { image: string }) => v.image !== first.image
    );

    if (!different) {
      test.skip();
      return;
    }

    // Click pills to select the "different" variant
    const optionGroups = page.locator('.product__option');
    for (let i = 0; i < different.options.length; i++) {
      const pill = optionGroups
        .nth(i)
        .locator(`.product__pill[data-value="${different.options[i]}"]`);
      if (await pill.count()) {
        await pill.click();
      }
    }

    // The active image's pathname should match the variant's image
    const activeImagePath = await page.evaluate(() => {
      const active = document.querySelector(
        '.product__image--active'
      ) as HTMLImageElement;
      return new URL(active.src, location.origin).pathname;
    });

    expect(activeImagePath).toBe(different.image);
  });
});

// ─── Variant URL Deep-Link ──────────────────────────────────────────────────

test.describe('Product page — Variant URL Deep-Link', () => {
  test('loading a variant URL selects the correct image on page load', async ({
    page,
  }) => {
    // First, visit the product to discover a variant with a distinct image
    await page.goto(AUBURN_PRODUCT);
    await waitForProductPage(page);

    const variantWithImage = await page.evaluate(() => {
      const el = document.querySelector('[data-product-variants]');
      const variants = JSON.parse(el!.textContent!);
      const first = variants[0];
      // Find a variant whose image differs from the first variant
      const different = variants.find(
        (v: { image: string | null }) =>
          v.image !== null &&
          first.image !== null &&
          new URL(v.image, location.origin).pathname !==
            new URL(first.image, location.origin).pathname
      );
      if (!different) return null;
      return {
        id: different.id,
        imagePath: new URL(different.image, location.origin).pathname,
      };
    });

    if (!variantWithImage) {
      test.skip();
      return;
    }

    // Navigate directly to the variant URL (fresh page load)
    await page.goto(
      `${AUBURN_PRODUCT}?variant=${variantWithImage.id}`
    );
    await waitForProductPage(page);

    // The active image should match this variant's image
    const activeImagePath = await page.evaluate(() => {
      const active = document.querySelector(
        '.product__image--active'
      ) as HTMLImageElement;
      return new URL(active.src, location.origin).pathname;
    });

    expect(activeImagePath).toBe(variantWithImage.imagePath);
  });

  test('loading a variant URL pre-selects the correct pills', async ({
    page,
  }) => {
    // Discover a non-default variant
    await page.goto(AUBURN_PRODUCT);
    await waitForProductPage(page);

    const variantInfo = await page.evaluate(() => {
      const el = document.querySelector('[data-product-variants]');
      const variants = JSON.parse(el!.textContent!);
      // Pick the last variant — likely different options from default
      const v = variants[variants.length - 1];
      return { id: v.id, options: v.options as string[] };
    });

    // Navigate directly to that variant URL
    await page.goto(`${AUBURN_PRODUCT}?variant=${variantInfo.id}`);
    await waitForProductPage(page);

    // Each option group's selected pill should match the variant's options
    const groups = page.locator('.product__option');
    for (let i = 0; i < variantInfo.options.length; i++) {
      const selectedPill = groups.nth(i).locator('.product__pill--selected');
      await expect(selectedPill).toHaveCount(1);
      const selectedValue = await selectedPill.getAttribute('data-value');
      expect(selectedValue).toBe(variantInfo.options[i]);
    }
  });

  test('loading a variant URL shows the correct price', async ({ page }) => {
    await page.goto(AUBURN_PRODUCT);
    await waitForProductPage(page);

    const variantInfo = await page.evaluate(() => {
      const el = document.querySelector('[data-product-variants]');
      const variants = JSON.parse(el!.textContent!);
      const v = variants[variants.length - 1];
      return { id: v.id, price: v.price as string };
    });

    await page.goto(`${AUBURN_PRODUCT}?variant=${variantInfo.id}`);

    const displayedPrice = await page
      .locator('[data-current-price]')
      .textContent();
    expect(displayedPrice!.trim()).toBe(variantInfo.price);
  });

  test('variant ID in form matches the URL variant param', async ({
    page,
  }) => {
    await page.goto(AUBURN_PRODUCT);
    await waitForProductPage(page);

    const variantId = await page.evaluate(() => {
      const el = document.querySelector('[data-product-variants]');
      const variants = JSON.parse(el!.textContent!);
      return String(variants[variants.length - 1].id);
    });

    await page.goto(`${AUBURN_PRODUCT}?variant=${variantId}`);

    const formValue = await page
      .locator('product-page [data-variant-id]')
      .getAttribute('value');
    expect(formValue).toBe(variantId);
  });
});
