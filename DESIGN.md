---
name: Gymlos
description: Professional gym management SaaS — confident blue infrastructure for owners, staff, and members.
colors:
  primary: "#2155e5"
  primary-hover: "#1e47c7"
  primary-muted: "#818cf8"
  surface-light: "#f8fafc"
  surface-dark: "#0b111e"
  surface-panel: "#ffffff"
  surface-panel-dark: "#131a26"
  ink: "#1e293b"
  ink-muted: "#64748b"
  ink-on-dark: "#f1f5f9"
  border-light: "#f1f5f9"
  border-dark: "#1d2736"
  success: "#34d399"
  danger: "#e11d48"
typography:
  display:
    fontFamily: "Outfit, sans-serif"
    fontWeight: 800
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Outfit, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.4
  body:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.5
  label:
    fontFamily: "Outfit, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 800
    letterSpacing: "0.1em"
rounded:
  sm: "0.75rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2.5rem"
spacing:
  sm: "0.75rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.primary-hover}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "0.75rem 1.25rem"
  button-primary-hover:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "0.75rem 1.25rem"
  button-secondary:
    backgroundColor: "{colors.surface-panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0.75rem 1.25rem"
  input-default:
    backgroundColor: "{colors.surface-light}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0.75rem 1rem"
  nav-item-active:
    backgroundColor: "rgba(33, 85, 229, 0.1)"
    textColor: "{colors.primary-hover}"
    rounded: "{rounded.sm}"
    padding: "0.75rem 1rem"
---

# Design System: Gymlos

## 1. Overview

**Creative North Star: "The Trusted Console"**

Gymlos is operational infrastructure for gym businesses — not a marketing page wearing a dashboard costume. The visual system reads as a confident, professional console: cool slate neutrals carry most surfaces, electric blue marks primary actions and active wayfinding, and generous rounding softens density without sacrificing scanability.

The pairing of **Outfit** (display, nav, metrics) and **Plus Jakarta Sans** (body, forms, data) gives headings authority while keeping labels and paragraphs readable at the 12px root scale the app uses. Dark mode is first-class: slate-950 backgrounds, glass panels, and subtle cyber-grid textures signal "modern tool" without drifting into decorative glassmorphism.

This system explicitly rejects generic SaaS scaffolding (cream backgrounds, hero-metric blocks, identical icon-card grids, gradient text, uppercase eyebrows on every section). Marketing flair is reserved for the public landing and auth split-screen; inside the app shell, hierarchy and task completion win.

**Key Characteristics:**
- Restrained blue accent on neutral slate surfaces — accent ≤10% of any dashboard screen
- Rounded containers (16–24px) with light borders and soft blue-tinted shadows
- Fixed rem type scale rooted at 12px html — compact but legible for data-dense ops UI
- Light/dark parity with shared component vocabulary across owner, employee, client, super-admin
- Polish-native copy tone; UI chrome stays professional, not translated-marketing

## 2. Colors

A cool blue-on-slate palette built for trust and long-shift readability.

### Primary
- **Gymlos Blue** (#2155e5): Brand anchor, logo, active nav icons, primary buttons, focus rings. Per-gym theme color can override CSS variables at runtime for owners.
- **Console Blue** (#1e47c7): Primary button default, hover states on actions, active link emphasis in light mode.
- **Periwinkle Muted** (#818cf8): primary-400 tier — borders, glow accents, landing gradients only; not for body text.

### Neutral
- **Cool Mist** (#f8fafc / slate-50): App background light mode; subtle radial blue/cyan wash on body.
- **Ink Slate** (#1e293b / slate-800): Primary body text light mode.
- **Whisper Gray** (#64748b / slate-500): Subtitles, secondary labels, placeholder-adjacent copy — bump toward ink when contrast fails AA.
- **Panel White** (#ffffff): Cards, headers, auth form panels, sidebar light mode.
- **Deep Console** (#0b111e / slate-950): App background dark mode, input fills dark mode.
- **Elevated Night** (#131a26 / slate-900): Sidebar, header bar, card surfaces dark mode.
- **Divider Steel** (#f1f5f9 light / #1d2736 dark): Borders on panels, inputs, nav separators.

### Semantic
- **Check Emerald** (#34d399 / emerald-400): Success icons, checkmarks in lists.
- **Alert Rose** (#e11d48 / rose-600): Danger buttons, unread badges, destructive actions.

### Named Rules
**The Ten Percent Rule.** Primary blue appears on primary actions, active navigation, focus rings, and key metrics — never as a full-screen wash inside the app shell. Its scarcity signals importance.

**The Landing Exception.** The public landing page and auth hero panel may use darker gradients and glow effects; dashboard routes inherit the restrained console palette.

## 3. Typography

**Display Font:** Outfit (Google Fonts, weights 300–900)
**Body Font:** Plus Jakarta Sans (Google Fonts, weights 300–800)

**Character:** Outfit delivers bold, tight headlines and nav labels with a tech-forward confidence. Plus Jakarta Sans handles readable body copy and form labels. Display font is for headings, stats, and navigation — never for dense table data or long prose blocks.

### Hierarchy
- **Display** (800, 2.25–3rem on page headers, line-height 1.1): Page titles in `PageHeader`, auth hero headlines. `font-display`, `tracking-tight`.
- **Headline** (800, 1.875rem / text-3xl): Section titles, detail page headings (`DetailPageLayout` h2).
- **Title** (700, 1.125rem / text-lg): Empty state titles, card section headers.
- **Body** (500, 1rem effective at 12px root ≈ 12px base → rem-relative): Paragraphs, form values, table cells. Cap prose at 65–75ch where used.
- **Label** (800, 0.625rem / text-[10px], uppercase, tracking-widest): Stat card labels, sidebar section labels, form field labels (`labelClassName`). Use sparingly — not on every block.

### Named Rules
**The Display Boundary Rule.** Outfit appears on headings, navigation, and metric numbers. Data tables, input text, and long descriptions use Plus Jakarta Sans only.

**The Root Twelve Rule.** `html { font-size: 12px }` sets the rem baseline. All spacing and type scale relative to rem; test legibility at 100% zoom on 1080p monitors (employee desk scenario).

## 4. Elevation

Hybrid system: **tonal layering first, shadow second.** Depth comes from white/dark panel surfaces on tinted app backgrounds, 1px borders, and occasional soft blue-tinted shadows — not heavy Material drops.

Glass utilities (`glass-panel`, `backdrop-blur-md`) appear on stat cards and sidebar — functional separation, not decorative frosting. Hover lifts use subtle `translateY(-0.5px)` and border color shifts toward primary.

### Shadow Vocabulary
- **Panel whisper** (`0 2px 10px -3px rgba(6, 81, 237, 0.05)`): Page headers, detail layouts — blue-tinted ambient.
- **Button glow** (`0 4px 6px -1px rgba(30, 71, 199, 0.2)`): Primary buttons at rest; intensifies on hover.
- **Drawer overlay** (`bg-slate-950/60 backdrop-blur-sm`): Mobile nav scrim — structural, not decorative.

### Named Rules
**The Flat Data Rule.** Tables, list rows, and form sections stay flat at rest. Shadows appear on interactive containers (cards, headers, dropdowns) and lift on hover only.

## 5. Components

### Buttons
- **Shape:** Generously rounded (16px / rounded-2xl)
- **Primary:** `bg-primary-600`, white text, bold weight, px-5 py-3, shadow-md with primary tint. Hover: primary-700 light / primary-500 dark.
- **Secondary:** White/slate-900 fill, 2px slate border, slate-700 text. Hover: slate-50 background shift.
- **Danger:** Rose-50 fill, rose-600 text, rose-100 border — destructive secondary actions.
- **Focus:** Disabled at 50% opacity; transitions 150–200ms on color/shadow only.

### Inputs / Fields
- **Style:** 2px border slate-100/slate-800, rounded-2xl, px-4 py-3, slate-50 fill light / slate-950/40 dark.
- **Focus:** White/dark-900 background, primary-500 border, ring-4 ring-primary-500/10.
- **Labels:** Uppercase, bold, text-sm, tracking-wide — above field, 8px margin.

### Cards / Containers
- **Corner Style:** 24px (rounded-3xl) for page headers and stat cards; 16px for inline panels.
- **Background:** White / slate-900 with optional `glass-panel` + cyber-grid texture on stat cards.
- **Border:** 1px slate-100 / slate-800.
- **Internal Padding:** p-6 to p-8 on headers; p-6 on stat cards.
- **Decorative blob:** Optional blurred primary circle top-right on headers — keep opacity ≤60%; remove if cluttering dense pages.

### Navigation
- **Sidebar:** 288px fixed, white/80 or slate-900/60 with backdrop-blur, cyber-grid on lg+. Nav links: rounded-xl, Outfit bold, gap-3.5.
- **Active state:** primary-500/10 background, primary-700 text, ring-1 ring-primary-500/20.
- **Inactive:** slate-500 text, hover slate-100/40 background.
- **Mobile:** Drawer with scrim; hamburger in sticky header.

### Stat Card (signature)
- **Layout:** Label (uppercase 10px) + large display number (text-4xl Outfit black) + optional icon in primary-tinted rounded-xl box.
- **Surface:** glass-panel, cyber-grid, hover border-primary-500/30. Avoid hero-metric cliché on dashboard — max 4–6 stat cards per view.

### Page Header (signature)
- **Layout:** Flex row, title + optional subtitle + action slot.
- **Surface:** White panel, rounded-3xl, p-8, subtle blue shadow, optional decorative blur orb.

### Empty / Error States
- **Empty:** Centered icon (Inbox default), title text-lg bold, description text-sm muted, optional action button.
- **Loading:** Shared `LoadingState` — prefer skeletons over spinners in content areas.

## 6. Do's and Don'ts

### Do:
- **Do** use primary blue only for primary actions, active nav, and focus rings — keep dashboards neutral.
- **Do** share `formStyles.ts` button/input classes across all roles for vocabulary consistency.
- **Do** test contrast on slate-500 subtitle text; bump to slate-600/700 when below 4.5:1 on tinted backgrounds.
- **Do** respect `prefers-reduced-motion` — replace slide-in animations with fade or instant display.
- **Do** write UI copy in natural Polish; format PLN and dates for pl-PL expectations.

### Don't:
- **Don't** use generic SaaS scaffolding — cream/sand body backgrounds, hero-metric blocks (big number + tiny label grids), identical icon-card feature grids, gradient text, or uppercase tracked eyebrows on every section.
- **Don't** bleed landing-page aesthetics (dark gradients, glow-blue, glass blobs) into operational dashboards where data density matters.
- **Don't** use side-stripe borders (border-left > 1px colored accent) on cards, alerts, or list items.
- **Don't** nest cards inside cards — use spacing and section headers to separate content.
- **Don't** use Outfit display font for table data, form input values, or dense label grids.
- **Don't** ship modal dialogs when inline expansion or a detail page would serve the task faster.
