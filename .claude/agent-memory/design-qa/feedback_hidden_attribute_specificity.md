---
name: hidden_attribute_specificity
description: CSS specificity bug pattern where explicit display rules override the [hidden] UA stylesheet, leaving elements visible when JS sets .hidden = true
type: feedback
---

In this project, there is no global `[hidden] { display: none }` reset in `critical.css`. Each section that uses the `hidden` attribute must explicitly add a suppression rule like `.my-element[hidden] { display: none }`.

Without this, any element that has an explicit `display:` rule (e.g. `display: flex`) will remain visible even when JS sets `element.hidden = true`, because the author stylesheet's specificity beats the browser UA stylesheet's `[hidden]` behavior.

**Why:** Found during recently-viewed QA — `.recently-viewed__carousel[data-recently-viewed-main]` had `display: flex` in CSS but no `[hidden]` override. When JS set `mainCarousel.hidden = true` to show the fallback, the main carousel's absolutely-positioned arrows remained visible and floated above the fallback carousel.

**How to apply:** Whenever a section uses JS to toggle `element.hidden`, check that the section's stylesheet includes `[element-selector][hidden] { display: none }`. Flag missing rules in QA reports. Recommend adding a global reset to `critical.css`: `[hidden] { display: none !important }`.
