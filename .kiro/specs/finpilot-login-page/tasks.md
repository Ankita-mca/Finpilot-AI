# Implementation Plan: FinPilot AI Login Page

## Overview

Single-file HTML login page for FinPilot AI. No build tooling required. Tasks are ordered so that foundational structure is laid first, then the brand panel, then the auth form, then JavaScript interactivity, and finally accessibility hardening and verification.

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 1,
      "tasks": ["1"],
      "description": "Project scaffold — must complete before any panel work"
    },
    {
      "wave": 2,
      "tasks": ["2", "3"],
      "description": "Brand panel and auth form panel can be built in parallel after scaffold"
    },
    {
      "wave": 3,
      "tasks": ["4"],
      "description": "JavaScript interactivity — depends on auth form DOM being present"
    },
    {
      "wave": 4,
      "tasks": ["5"],
      "description": "Accessibility hardening — depends on JS state machine being implemented"
    },
    {
      "wave": 5,
      "tasks": ["6"],
      "description": "Responsive verification — depends on all panels and JS being complete"
    }
  ]
}
```

## Notes

- All work lives inside a single `login.html` file at the workspace root. Do not create separate CSS or JS files.
- Tailwind CDN applies JIT compilation in the browser; only classes present in the HTML are included.
- The state inspector (task 3.2) is a dev/demo tool and should be visually distinct from the product UI.
- Hardcoded telemetry values (₹14,82,500, INV-2024-884, etc.) are static demo data — no data fetching needed.
- The submit button simulates a 2-second async delay for demo purposes; no real authentication endpoint is called.

- [x] 1. Project scaffold and Tailwind/font setup
- [x] 2. Left brand panel — structure and styling
- [x] 3. Right auth form panel — structure and styling
- [x] 4. JavaScript state machine and interactivity
- [x] 5. Accessibility audit and hardening
- [x] 6. Responsive layout verification

---

## Tasks

### 1. Project scaffold and Tailwind/font setup

**Requirements**: 8.1, 8.2, 9.1

Create the single `login.html` file with the correct `<head>` containing CDN links, Tailwind config, and global styles.

- [x] 1.1 Create `login.html` at the workspace root with valid HTML5 boilerplate (`<!DOCTYPE html>`, `<html lang="en">`, `<head>`, `<body>`).
- [x] 1.2 Add the Google Fonts `<link>` tag loading Inter with weights 300, 400, 500, 600, 700 and `display=swap`.
- [x] 1.3 Add the Tailwind CSS CDN `<script>` tag and a following `<script>` block that extends `tailwind.config` with `brandNavy` (950, 900, 800, 700) and `royalBlue` (500, 400, 300) color tokens using the exact hex values from the design document.
- [x] 1.4 Apply Inter as the default `font-family` on `<body>` via a Tailwind utility class or a `<style>` block.
- [x] 1.5 Set `<body>` to `min-h-screen flex` so the split-panel layout fills the full viewport height.

### 2. Left brand panel — structure and styling

**Requirements**: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6

Build the full left panel `<aside>` with all sub-components. All content is static/hardcoded.

- [x] 2.1 Create the `<aside id="brand-panel">` element with `hidden lg:flex flex-col` classes, `brandNavy-800` background gradient, and occupying ~55% of the desktop layout (`lg:w-[55%]`).
- [x] 2.2 Add three ambient glow `<div>` elements (absolutely-positioned, blurred blue/indigo circles) and a dot-grid background pattern using a CSS `background-image` radial gradient or SVG data URI.
- [x] 2.3 Implement the logo header: wallet/flow SVG icon + "FinPilot AI" wordmark + "Autonomous Cashflow" subtitle, followed by the "Enterprise Cashflow Engine for Indian MSMEs" badge with a green pulsing dot (`animate-pulse`).
- [x] 2.4 Implement the hero headline `<h1>` "Take Control of Your Cash Flow." with gradient text (`bg-gradient-to-r bg-clip-text text-transparent`).
- [x] 2.5 Implement the three telemetry cards with `bg-white/5 border border-white/10 rounded-2xl` styling:
  - Automated Receivables card with "₹14,82,500", "+18.4%" delta, and an inline SVG wave chart.
  - DSO card with "28 days", "-14 days MoM" delta, and a progress bar (filled ~66% to represent 28 of 42 max days).
  - Latest Auto-Reconcile card with "INV-2024-884", "₹2,45,000", and a "Paid via e-NACH/UPI" green status pill.
- [x] 2.6 Implement the three feature pillars list with icons: "Track invoices", "Payment follow-ups", "Forecast liquidity".
- [x] 2.7 Implement the trust badges footer with three pill badges: "256-bit encryption", "RBI Compliant", "SOC2 Type II", each with a small icon.

### 3. Right auth form panel — structure and styling

**Requirements**: 3.1, 3.2, 3.3, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 6.1, 7.1, 7.2, 7.3

Build the full right panel `<main>` with all form elements in their default (visible) state.

- [x] 3.1 Create the `<main id="auth-panel">` element with `flex flex-col justify-center` and ~45% desktop width (`lg:w-[45%]`), white or very light background.
- [x] 3.2 Implement the state inspector toggle bar `<div id="state-inspector">` at the top of the panel with four styled buttons labelled "Default", "Focused", "Error", "Submitting" wired to `setUIState` / `triggerSubmit` via `onclick`. Style it as a small, muted pill group.
- [x] 3.3 Add the "Welcome back" `<h2>` heading and a subtitle (e.g., "Sign in to your FinPilot AI workspace").
- [x] 3.4 Implement the error banner `<div id="error-banner" role="alert" aria-live="assertive">` with rose background styling and the message "Invalid email address or password." Add the `hidden` class so it is not visible in the default state.
- [x] 3.5 Implement the email field:
  - `<label for="email-input">Work Email</label>`
  - `<input id="email-input" type="email" name="email" aria-describedby="email-error">` with a leading mail icon inside the input wrapper.
  - `<p id="email-helper">Use your work email address</p>` helper text beneath.
  - `<p id="email-error" class="hidden">` error message element beneath (hidden by default).
- [x] 3.6 Implement the password field:
  - `<label for="password-input">Password</label>`
  - `<input id="password-input" type="password" name="password">` with a leading lock icon.
  - An eye-icon toggle button `<button id="eye-btn" type="button" aria-label="Show password">` on the trailing side with `<span id="eye-icon">` for the SVG.
  - A "Forgot password?" link to the right of or beneath the label.
- [x] 3.7 Implement the Remember Me checkbox: `<input id="remember-me" type="checkbox">` with `<label for="remember-me">Remember this trusted workspace</label>`.
- [x] 3.8 Implement the submit button `<button id="submit-btn" type="submit">` with full-width styling, `royalBlue-500` background, "Sign In to Dashboard" label, and a right-arrow SVG icon. Wrap the label and a hidden spinner `<span id="btn-spinner" class="hidden animate-spin">` inside the button.
- [x] 3.9 Implement the sign-up link paragraph: "New to FinPilot AI? `<a href="#">Create an organization account</a>`".
- [x] 3.10 Implement the multi-tenant callout `<aside role="note">` with indigo-tinted border/background listing: Founders, CFOs, CAs, Billing Operators.
- [x] 3.11 Implement the auth footer with a lock icon SVG and text "Protected by 256-bit SSL encryption" in small, muted styling.

### 4. JavaScript state machine and interactivity

**Requirements**: 3.1, 3.2, 3.3, 3.4, 3.5, 4.2, 6.1

Implement the three JavaScript functions in an inline `<script>` block at the bottom of `<body>`.

- [x] 4.1 Implement `togglePasswordVisibility()`:
  - Read `passwordInput.type`.
  - Toggle between `'password'` and `'text'`.
  - Update `eyeIcon.innerHTML` with the appropriate SVG (eye-open / eye-slash).
  - Update `eyeBtn.setAttribute('aria-label', ...)` to match the resulting state.
- [x] 4.2 Implement `setUIState(state)`:
  - Accept `state ∈ {'default', 'focused', 'error', 'submitting'}`.
  - Reset all mutable state (hide error banner, remove red/blue border classes from both inputs, remove `aria-invalid`, re-enable submit button, restore button content, set `aria-busy="false"`).
  - Apply state-specific mutations as specified in the design's algorithm (Property 1 — state exclusivity must hold).
  - Highlight the matching state inspector button and unhighlight the others.
- [x] 4.3 Implement `triggerSubmit()`:
  - Call `setUIState('submitting')` synchronously.
  - Call `setTimeout(() => setUIState('default'), 2000)`.
- [x] 4.4 Wire the login form's `onsubmit` to call `event.preventDefault(); triggerSubmit();`.
- [x] 4.5 Call `setUIState('default')` on `DOMContentLoaded` to ensure the initial state is correctly applied.

### 5. Accessibility audit and hardening

**Requirements**: 5.1, 5.2

Review every interactive element and ARIA annotation against the requirements.

- [x] 5.1 Verify all `<input>` elements have a programmatically associated `<label>` (either via `for`/`id` pairing or `aria-label`).
- [x] 5.2 Confirm that in the `error` state, `aria-invalid="true"` and `aria-describedby` are set on both inputs and that the referenced error message elements are visible and contain meaningful text.
- [x] 5.3 Confirm that `role="alert"` and `aria-live="assertive"` are present on the error banner `<div>`.
- [x] 5.4 Confirm the submit button has `aria-busy="true"` in the submitting state and `aria-busy="false"` (or the attribute is removed) in all other states.
- [x] 5.5 Confirm the password toggle button has `type="button"` (not `type="submit"`) and a correct `aria-label` in both visibility states.
- [x] 5.6 Manually tab through the form and verify the focus order: email → password → eye toggle → remember me → submit → forgot password → sign-up link.
- [x] 5.7 Verify all text meets WCAG AA color contrast requirements (minimum 4.5:1 for normal text, 3:1 for large text) against their respective backgrounds.

### 6. Responsive layout verification

**Requirements**: 2.1

Verify the page's responsive behavior at key breakpoints.

- [x] 6.1 Open the page and resize the browser to 375px wide; confirm the left brand panel is not rendered (CSS `hidden`) and the auth form fills the full width.
- [x] 6.2 Resize to 1280px wide; confirm the split-panel layout renders with the brand panel visible on the left and the auth form on the right.
- [x] 6.3 Verify all auth form elements remain visible, clickable, and correctly styled at 375px viewport width with no horizontal overflow.
- [x] 6.4 Verify the page opens correctly via `file://` protocol with no build step (open the HTML file directly in a browser).
