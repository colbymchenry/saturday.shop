---
name: Compiled JS truncation issue
description: Shopify dev server can serve truncated compiled_assets/scripts.js, breaking custom elements that use {% javascript %} blocks
type: project
---

The Shopify dev server compiles `{% javascript %}` blocks from sections into a single `compiled_assets/scripts.js` bundle. This bundle can become truncated (file cut off mid-word), causing "Unexpected end of input" JS errors. When this happens, custom elements defined in the affected section (e.g., `product-carousel` from `featured-collection.liquid`) never register, and their `connectedCallback` never fires.

**Why:** The dev server's asset compilation pipeline appears to have a buffer/content-length bug. The version hash in the URL does not change when the source file is touched, so the broken version persists until the dev server is restarted.

**How to apply:** If featured-collection tests fail with "carousel--visible not found" and `product-carousel` custom element is undefined, check if `scripts.js` is truncated. Fix: restart the dev server. Sections using inline `<script>` tags (like recently-viewed) are not affected.
