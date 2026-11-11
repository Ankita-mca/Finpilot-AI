# Requirements Document

## Introduction

This document defines the functional and non-functional requirements for the FinPilot AI login page — the authentication entry point for the platform. The page is a single HTML file using Tailwind CSS (CDN) and vanilla JavaScript, targeting Indian MSME founders, CFOs, CAs, and billing operators.

---

## Requirements

### 1. Brand Panel

#### 1.1 Split-Panel Layout

**User Story**: As a user visiting the login page, I want to see a professional, brand-rich layout so that I feel confident about the platform's credibility before signing in.

**Acceptance Criteria**:
- The page renders a two-column split layout on desktop viewports (≥ 1024px): left brand panel occupying approximately 55% width, right auth form occupying approximately 45% width.
- The left brand panel displays a dark navy gradient background using the `brandNavy` color tokens (`#0b132b → #091126 → #070b18`).
- The left brand panel includes ambient glow effects (blue/indigo blur circles) and a dot grid background pattern.

#### 1.2 Logo and Badge

**User Story**: As a user, I want to see the FinPilot AI logo and product identity clearly so that I know I'm on the correct platform.

**Acceptance Criteria**:
- The left panel displays the FinPilot AI logo comprising a wallet/flow SVG icon and the text "FinPilot AI".
- A subtitle "Autonomous Cashflow" is rendered beneath or beside the logo.
- An "Enterprise Cashflow Engine for Indian MSMEs" badge is shown with a green animated pulse dot.

#### 1.3 Hero Headline

**User Story**: As a prospective user, I want to see a compelling headline so that the value proposition is immediately clear.

**Acceptance Criteria**:
- The headline "Take Control of Your Cash Flow." is displayed in a large, bold typeface.
- The headline text uses a gradient styling (e.g., white to light blue) applied via `bg-clip-text text-transparent`.

#### 1.4 Dashboard Telemetry Cards

**User Story**: As an MSME owner, I want to see realistic cashflow metrics on the login page so that I can quickly understand the platform's capabilities.

**Acceptance Criteria**:
- Three telemetry cards are rendered on the left panel:
  - **Automated Receivables**: displays "₹14,82,500" with a "+18.4%" delta badge and an SVG wave chart.
  - **DSO**: displays "28 days" with a "-14 days MoM" delta and a progress bar visualization.
  - **Latest Auto-Reconcile**: displays "INV-2024-884", "₹2,45,000", and a "Paid via e-NACH/UPI" status pill.
- Each card has a semi-transparent dark background (`bg-white/5`) with a subtle border (`border-white/10`) and rounded corners.

#### 1.5 Feature Pillars

**User Story**: As a user, I want to see the three core features highlighted so that I understand what FinPilot AI does.

**Acceptance Criteria**:
- Three feature pillars are listed: "Track invoices", "Payment follow-ups", "Forecast liquidity".
- Each pillar has an associated icon and label text.

#### 1.6 Trust Badges

**User Story**: As a security-conscious user, I want to see compliance and security certifications so that I trust the platform with my financial data.

**Acceptance Criteria**:
- Three trust badge pills are displayed in the left panel footer: "256-bit encryption", "RBI Compliant", "SOC2 Type II".
- Each badge is visually distinct (pill shape, border, icon).

---

### 2. Responsive Behavior

#### 2.1 Mobile Stacking

**User Story**: As a user on a mobile device, I want the login page to be fully usable so that I can sign in from any device.

**Acceptance Criteria**:
- On viewports narrower than 1024px, the layout switches from side-by-side columns to a vertical single-column stack.
- The left brand panel is hidden (`display: none`) on mobile viewports (below the Tailwind `lg` breakpoint).
- The auth form panel occupies the full viewport width on mobile.
- All interactive form elements remain accessible and usable on mobile viewports as narrow as 375px.

---

### 3. Authentication Form — UI States

#### 3.1 Default State

**User Story**: As a user who has just arrived at the login page, I want to see a clean form ready for input so that I can immediately start signing in.

**Acceptance Criteria**:
- On page load, the form renders in the `default` state.
- No error banner is visible.
- Input fields have neutral border styling (no red or blue highlight classes).
- The submit button is enabled and displays "Sign In to Dashboard" with a right-arrow icon.
- No loading spinner is present.

#### 3.2 Error State

**User Story**: As a user who has entered incorrect credentials, I want to see a clear error message so that I know what went wrong.

**Acceptance Criteria**:
- When the UI state is set to `error`, a rose-colored error banner appears above the form with a descriptive error message (e.g., "Invalid email address or password.").
- The error banner has `role="alert"` and `aria-live="assertive"` so screen readers announce it immediately.
- Both the email and password input fields display red border styling (`border-red-500`).
- Both inputs have `aria-invalid="true"` and `aria-describedby` referencing the associated error message element.
- The submit button remains enabled in error state.

#### 3.3 Submitting State

**User Story**: As a user who has clicked "Sign In", I want visual feedback that my request is being processed so that I don't click the button multiple times.

**Acceptance Criteria**:
- When the UI state is set to `submitting`, the submit button is disabled (`disabled=true`).
- The submit button displays a loading spinner animation (`animate-spin`) and loading text (e.g., "Signing in…").
- The submit button has `aria-busy="true"` during the submitting state.
- No other form elements change appearance during the submitting state.

#### 3.4 Submitting State Recovery

**User Story**: As a user, I want the form to return to its ready state after a submission attempt so that I can retry if needed.

**Acceptance Criteria**:
- After the simulated 2-second submit delay, `setUIState('default')` is called automatically.
- The submit button returns to its enabled state with original label and icon.
- No loading spinner remains visible after state recovery.

#### 3.5 Focused State

**User Story**: As a developer reviewing the design, I want to preview the focused input state so that I can verify the visual treatment.

**Acceptance Criteria**:
- When the UI state is set to `focused`, the email input field shows a blue border highlight (`border-royalBlue-400`) and a soft focus ring (`ring-2 ring-royalBlue-400/30`).
- No error banner is displayed in focused state.

---

### 4. Authentication Form — Fields and Controls

#### 4.1 Email Input

**User Story**: As a user, I want a clearly labeled email input with helper text so that I know what to enter.

**Acceptance Criteria**:
- An email input field is rendered with `type="email"` and an appropriate `id` and `name` attribute.
- A mail/envelope icon is displayed inside the input on the leading side.
- A helper text (e.g., "Use your work email address") appears beneath the field.
- An error message element exists beneath the field (hidden by default) that becomes visible in the `error` state.
- The input has an accessible `<label>` element associated via `for`/`id`.

#### 4.2 Password Input with Visibility Toggle

**User Story**: As a user, I want to be able to show or hide my password so that I can verify what I've typed.

**Acceptance Criteria**:
- A password input field is rendered with `type="password"` by default and a lock icon on the leading side.
- An eye icon button is displayed on the trailing side of the password field.
- Clicking the eye button toggles the input `type` between `'password'` and `'text'`.
- The eye icon changes to an eye-slash icon when the password is visible (and vice versa).
- The toggle button has an `aria-label` that accurately reflects the current action ("Show password" / "Hide password").
- The toggle button has `type="button"` to prevent accidental form submission.

#### 4.3 Forgot Password Link

**User Story**: As a user who has forgotten their password, I want a clearly visible "Forgot password" link so that I can initiate recovery.

**Acceptance Criteria**:
- A "Forgot password?" link is displayed near the password field (e.g., inline or beneath it).
- The link is visually distinguishable (e.g., blue text) from surrounding labels.
- The link is keyboard-focusable.

#### 4.4 Remember Me Checkbox

**User Story**: As a user on a trusted device, I want a "Remember me" option so that I don't have to re-enter credentials on every visit.

**Acceptance Criteria**:
- A checkbox input is rendered with the label "Remember this trusted workspace".
- The checkbox and label are associated via `for`/`id`.
- The checkbox is keyboard-operable (Space bar toggles state).

#### 4.5 Submit Button

**User Story**: As a user, I want a prominent, clearly labeled submit button so that I can initiate sign-in.

**Acceptance Criteria**:
- A submit button is rendered with visible label "Sign In to Dashboard" and a right-arrow icon in its default state.
- The button spans the full width of the form.
- The button uses the `royalBlue` brand color as its background.
- The button has sufficient color contrast for WCAG AA compliance.

---

### 5. Accessibility

#### 5.1 ARIA and Semantic HTML

**User Story**: As a user relying on assistive technology, I want the login form to be fully accessible so that I can authenticate without visual cues.

**Acceptance Criteria**:
- All form inputs have associated `<label>` elements.
- The error banner uses `role="alert"` and `aria-live="assertive"`.
- The submit button's `aria-busy` attribute is set to `"true"` during submission and `"false"` otherwise.
- The password visibility toggle has an `aria-label` that accurately describes its current action.
- Inputs in error state have `aria-invalid="true"` and `aria-describedby` pointing to the error message.
- The multi-tenant callout uses `role="note"` or is wrapped in a semantically appropriate element.

#### 5.2 Keyboard Navigation

**User Story**: As a keyboard-only user, I want to navigate and operate the entire form using only the keyboard.

**Acceptance Criteria**:
- The tab order traverses: Email input → Password input → Password visibility toggle → Remember Me checkbox → Submit button → Forgot password link → Sign-up link.
- All interactive elements are reachable and operable via keyboard.
- Focus indicators are visible on all interactive elements.

---

### 6. State Inspector (Demo/Dev Tool)

#### 6.1 State Inspector Toggle Bar

**User Story**: As a developer or designer reviewing the page, I want a toggle bar to switch between UI states so that I can verify each state's visual treatment without backend interaction.

**Acceptance Criteria**:
- A toggle bar is rendered at the top of the auth panel containing four labeled buttons: "Default", "Focused", "Error", "Submitting".
- Clicking "Default" calls `setUIState('default')`.
- Clicking "Focused" calls `setUIState('focused')`.
- Clicking "Error" calls `setUIState('error')`.
- Clicking "Submitting" calls `triggerSubmit()`.
- The active state button is visually highlighted.
- The toggle bar is visually distinct from the product UI (small, muted styling).

---

### 7. Additional Auth Panel Elements

#### 7.1 Sign-Up Link

**User Story**: As a new user, I want a clear path to create an account so that I can onboard without contacting support.

**Acceptance Criteria**:
- A "New to FinPilot AI? Create an organization account" link is displayed below the submit button.
- The link is visually accessible and keyboard-focusable.

#### 7.2 Multi-Tenant Callout

**User Story**: As a prospective user unfamiliar with multi-tenant structure, I want context about who can use this platform so that I know if it applies to my role.

**Acceptance Criteria**:
- A callout info box is displayed below the sign-up link listing target roles: Founders, CFOs, CAs, Billing Operators.
- The callout uses a distinct visual treatment (e.g., bordered, indigo-tinted background) to differentiate it from the main form.

#### 7.3 Auth Footer

**User Story**: As a security-conscious user, I want a footer note about SSL protection so that I'm reassured about data security.

**Acceptance Criteria**:
- A footer line is rendered at the bottom of the auth panel with a lock icon and text referencing SSL/encrypted connection.
- The footer text is in a small, muted style.

---

### 8. Typography and Visual Design

#### 8.1 Font

**User Story**: As a user, I want the page to use a clean, professional typeface so that the interface feels polished.

**Acceptance Criteria**:
- The page loads the Inter font family from Google Fonts with weights 300, 400, 500, 600, 700.
- Inter is applied as the default `font-family` across the page.
- `font-display: swap` is used to prevent flash of invisible text.

#### 8.2 Color Tokens

**User Story**: As a developer maintaining the page, I want brand colors to be defined as design tokens so that they're used consistently.

**Acceptance Criteria**:
- The Tailwind configuration extends the theme with `brandNavy` (950, 900, 800, 700) and `royalBlue` (500, 400, 300) color tokens.
- These tokens are applied consistently across background, border, and text utilities throughout the page.

---

### 9. Technical Constraints

#### 9.1 Single-File, No Build Tooling

**User Story**: As a developer deploying the page, I want it to be a single HTML file with no build step so that it can be opened directly in a browser.

**Acceptance Criteria**:
- The entire page — HTML structure, Tailwind config, and JavaScript — is contained within a single `.html` file.
- No npm packages, bundler, or build tool is required to view the page.
- The page is functional when opened via `file://` protocol or served from any static HTTP server.
- All external assets are loaded from public CDNs (Tailwind CSS, Google Fonts).

---

## Glossary

| Term | Definition |
|---|---|
| **UIState** | One of four named states (`default`, `focused`, `error`, `submitting`) that the auth form can occupy at any time. |
| **State Inspector** | A developer/demo toggle bar that lets reviewers switch the form between UIStates without a real backend call. |
| **Telemetry Cards** | Static demo data cards on the left brand panel showing example cashflow metrics (Receivables, DSO, Auto-Reconcile). |
| **DSO** | Days Sales Outstanding — the average number of days a business takes to collect payment after a sale. |
| **e-NACH** | Electronic National Automated Clearing House — an RBI-mandated mandate-based recurring payment system. |
| **MSME** | Micro, Small and Medium Enterprises — the target customer segment for FinPilot AI. |
| **brandNavy** | Custom Tailwind color token representing the dark navy brand palette (`#070b18` → `#0b132b`). |
| **royalBlue** | Custom Tailwind color token representing the primary interactive blue palette (`#3b5bdb` → `#748ffc`). |
| **Password visibility toggle** | The eye-icon button that switches the password input between masked (`type="password"`) and plaintext (`type="text"`) display. |
| **Trust badges** | Pill-shaped indicators on the left panel footer communicating security and compliance posture (256-bit encryption, RBI Compliant, SOC2 Type II). |
| **Multi-tenant callout** | An informational box listing the roles supported by FinPilot AI (Founders, CFOs, CAs, Billing Operators). |
