# Styling

Implementation: Tailwind CSS `^4.1.18` (Vite plugin `@tailwindcss/vite`), shadcn/ui (style `radix-maia`), `class-variance-authority` `^0.7.1`, `clsx` `^2.1.1`, `tailwind-merge` `^3.4.0`

## Summary

- Use Tailwind utility classes for component styling; avoid inline styles except for CSS custom properties where needed (e.g., Sonner).
- Base UI primitives live in `src/components/ui`; prefer extending these over creating one-off styles.
- Variants are modeled with `cva` and composed with `cn` (`clsx` + `tailwind-merge`).
- Theme tokens are CSS variables in `src/styles.css` and consumed via Tailwind color utilities (`bg-background`, `text-foreground`, etc.).
- Dark mode is driven by the `.dark` class and Tailwind custom variants.
- Theme state is persisted in `localStorage` (`ui-theme`) and applied via a small pre-hydration script in `ThemeProvider`.

## Purpose

- Explain how styling is organized and how to keep it consistent.
- Document the approved tools, patterns, and extension points for UI styling.
- Not a full design system spec or a guide for color/typography choices beyond the existing tokens.

## Key Files

| Path                  | Purpose                                                                                         |
|-----------------------|-------------------------------------------------------------------------------------------------|
| `src/styles.css`      | Tailwind v4 entrypoint, CSS variables (theme tokens), base layer defaults, and custom variants. |
| `src/components/ui/*` | shadcn/ui-based primitives and shared styling patterns.                                         |
| `src/lib/utils/cn.ts` | `cn` helper for class composition (`clsx` + `tailwind-merge`).                                  |
| `components.json`     | shadcn/ui configuration (style, aliases, CSS entry).                                            |
| `package.json`        | Styling-related dependency versions.                                                            |

## Conventions

- Prefer Tailwind utilities over custom CSS. The only global CSS lives in `src/styles.css`.
- Use design tokens (e.g. `bg-background`, `text-muted-foreground`, `border-border`) instead of raw colors.
- When adding variants, use `cva` and expose `variant`/`size` props (see `Button`, `Field`).
- Always compose classes with `cn`; pass `className` through so callers can override/extend.
- Avoid inline styles and `style={{ ... }}` unless setting CSS custom properties for third-party components. If a value cannot be expressed with Tailwind tokens, introduce a token in `src/styles.css` first.
- Use data attributes (`data-slot`, `data-variant`, `data-size`) to expose styling hooks.
- Keep base UI primitives in `src/components/ui`; feature-specific wrappers belong in `src/features/**`.

## Common Patterns

- `cn` for class merging:
```tsx
import { cn } from '@/lib/utils';

<div className={cn('flex items-center gap-4', className)} />
```

- Variants with `cva` (see `Button`):
```tsx
const buttonVariants = cva('inline-flex items-center', {
  variants: { variant: { default: 'bg-primary text-primary-foreground' } },
  defaultVariants: { variant: 'default' },
});
```

- Theme tokens in utilities (from `src/styles.css`):
```tsx
<div className="bg-background text-foreground border-border" />
```

## Error Handling and Edge Cases

- Error states should use existing tokenized classes (`text-destructive`, `aria-invalid:*`, `border-destructive`).
- Use `aria-invalid` and `data-*` attributes to toggle state styles instead of duplicating classes.
- For form errors, prefer the shared `FieldError` pattern rather than per-component messages.

## Gotchas

- Tailwind v4 uses the CSS-first config (`@theme inline`) in `src/styles.css`. Do not add a separate `tailwind.config` unless migrating intentionally.
- `tailwind-merge` removes conflicting classes; later classes win. Always pass `className` last in `cn(...)`.
- Dark mode is class-based (`.dark`) and uses `@custom-variant`. Avoid hard-coding dark colors.

## When to Update This Doc

- New tokens or theme changes in `src/styles.css`.
- New UI primitives or variant patterns in `src/components/ui`.
- Changes to class composition utilities (`cn`, `cva`) or Tailwind setup.
- Adding or removing shadcn/ui conventions or tooling.
