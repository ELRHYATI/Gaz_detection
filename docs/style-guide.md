# Design System & Style Guide

This design system delivers a cohesive, accessible UI across light/dark modes. It provides production-ready classes, components, and patterns built on Tailwind.

## Theme

- Dark mode uses the `dark` class on `html` (`document.documentElement`).
- Use the `ThemeToggle` component (`src/components/layout/ThemeToggle.tsx`) to persist user preference.

## Color Palette (Tailwind tokens)

- `primary`: Brand blue (50–900). Primary CTAs, focus rings.
- `success`: Positive states: badges, alerts.
- `warning`: Non-critical alerts and confirmations.
- `danger`: Errors and destructive actions.

## Typography

- `ds-h1`, `ds-h2`, `ds-h3` for headings.
- `ds-subtitle` for helper/caption text.
- Body text uses Tailwind defaults adjusted in `index.css` for light/dark.

## Components (CSS classes)

- Buttons: `ds-btn-primary`, `ds-btn-secondary`, `ds-btn-outline`, `ds-btn-danger`.
- Inputs: `ds-input`, `ds-select`, `ds-textarea`.
- Cards: `ds-card`, `ds-card-title`, `ds-card-body`.
- Badges: `ds-badge-*` (info, success, warning, danger).
- Alerts: `ds-alert-*` (info, success, warning, danger).
- Tabs: `ds-tabs`, `ds-tab`, `ds-tab-active`.
- Layout: `ds-container` for page width and horizontal padding.

## Spacing & Layout

- Maintain 8px spacing multiples (`gap-2`, `gap-4`, `p-4`, `p-6`).
- Use `ds-section` for content groups: a card with internal vertical rhythm.

## Accessibility

- Color contrast: interactive and body text meet WCAG AA (≥4.5:1).
- Focus states: default Tailwind focus rings with `primary-500` are applied to form controls.
- Screen readers: include labels and `aria-*` attributes where appropriate.

## Usage Example

```tsx
<div className="ds-card">
  <div className="flex items-center justify-between">
    <h3 className="ds-card-title">Title</h3>
    <span className="ds-badge-info">Live</span>
  </div>
  <p className="ds-card-body">Content goes here.</p>
  <div className="mt-4 flex gap-2">
    <button className="ds-btn-primary">Save</button>
    <button className="ds-btn-outline">Cancel</button>
  </div>
}
```

## Preview

- Route: `/style-guide` (protected). Open while signed in.
- Toggle light/dark using the top-right switch.

## Notes

- Components rely on Tailwind theme extension in `tailwind.config.js`.
- Global import added in `src/index.css`: `@import './styles/design-system.css';`.