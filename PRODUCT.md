# Product

## Register

product

## Users

Gymlos serves four roles with equal design priority:

- **Gym owners** — multi-location operators managing subscriptions, staff, analytics, CRM, and gym configuration. They work from a desktop or tablet, often during business planning or end-of-day review.
- **Front-desk employees** — reception and floor staff under time pressure at check-in, pass sales, locker management, and POS. They need speed, clarity, and large touch targets on tablets or monitors.
- **Gym members (guests)** — clients booking classes, buying passes, and managing their membership from phones or personal devices.
- **Super admins** — platform operators managing SaaS plans, subscriptions, and users.

All surfaces share one design system; no role should feel like a second-class experience.

## Product Purpose

Gymlos is a multi-tenant SaaS platform for gym and fitness club management. It replaces fragmented tools (spreadsheets, paper passes, separate booking apps) with one system for passes, lockers, schedules, POS, CRM, analytics, and a client portal.

Success means gym staff complete daily tasks without friction, owners trust the data they see, and members self-serve without calling the front desk. The UI should feel like professional infrastructure — not a marketing demo wearing a dashboard skin.

## Brand Personality

**Confident · Professional · Trustworthy**

Gymlos is the serious tool gym operators rely on to run their business. The interface communicates competence and reliability: clear hierarchy, decisive actions, no visual noise. Polish is the primary locale; copy and formatting should feel native, not translated.

Emotional goal: *"This is the system my club runs on."*

## Anti-references

- **Generic SaaS scaffolding** — cream/sand body backgrounds, hero-metric blocks (big number + small label), identical icon-card grids repeated across sections, gradient text, glassmorphism as decoration, uppercase tracked eyebrows on every section.
- **Marketing-first dashboards** — landing-page aesthetics bleeding into operational screens where speed and data density matter more than conversion.
- **Visual gimmicks over function** — motion for its own sake, decorative gradients on data tables, nested card layouts that waste space during busy shifts.

## Design Principles

1. **Operations first** — Every screen answers "what do I do next?" before "how does this look?" Density and scanability beat decoration on dashboard surfaces.
2. **One system, four roles** — Shared components, spacing, and typography across owner, employee, client, and super-admin. Role-specific needs (speed vs. analytics vs. self-service) shape layout, not a separate visual language.
3. **Confident restraint** — Use the blue brand identity deliberately. Accent color earns its place; neutral surfaces carry most of the UI. Avoid the saturated-AI palette defaults.
4. **Polish-native** — Labels, dates, currency (PLN), and error messages read naturally in Polish. Number formatting and copy tone match local business software expectations.
5. **Production-grade defaults** — Empty states, loading, and errors are designed, not afterthoughts. WCAG 2.1 AA contrast and keyboard paths are baseline, not stretch goals.

## Accessibility & Inclusion

- **WCAG 2.1 AA** — Body text ≥4.5:1 contrast, large text ≥3:1, visible focus states, keyboard navigation for all interactive elements.
- **Reduced motion** — Respect `prefers-reduced-motion`; provide instant or crossfade alternatives to entrance animations.
- **Polish locale** — Careful attention to Polish copy clarity, date/number formatting, and screen-reader labels in the primary language.
- **Touch and tablet** — Employee flows assume tablet/monitor use at a busy front desk; minimum touch targets and readable type at arm's length.
