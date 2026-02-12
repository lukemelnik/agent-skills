---
name: shadcn
description: shadcn/ui component and styling patterns. Use when building UI components, styling, or working with the design system.
---

# shadcn/ui Patterns

## Always Use shadcn Components First

Before creating custom UI, check if a shadcn component exists in `apps/web/src/components/ui/`. These components are:
- Pre-styled and consistent
- Accessible (ARIA compliant)
- Dark mode compatible
- Well-tested

Common components: Button, Input, Select, Dialog, Sheet, Card, Table, Tabs, Popover, Command, Calendar, etc.

## Semantic Colors - NEVER Use Raw Tailwind Colors

**CRITICAL**: Always use semantic color classes that adapt to light/dark themes. Never use raw Tailwind colors like `text-gray-500` or `bg-white`.

### Text Colors
```tsx
// GOOD - semantic colors
<p className="text-foreground">Primary text</p>
<p className="text-muted-foreground">Secondary/muted text</p>
<p className="text-destructive">Error text</p>

// BAD - raw Tailwind colors
<p className="text-gray-900">Primary text</p>
<p className="text-gray-500">Secondary text</p>
<p className="text-red-500">Error text</p>
```

### Background Colors
```tsx
// GOOD - semantic colors
<div className="bg-background">Page background</div>
<div className="bg-card">Card/elevated surface</div>
<div className="bg-muted">Subtle background</div>
<div className="bg-destructive">Error background</div>
<div className="bg-primary">Primary action background</div>
<div className="bg-secondary">Secondary background</div>

// BAD - raw Tailwind colors
<div className="bg-white">Card</div>
<div className="bg-gray-100">Muted</div>
```

### Border Colors
```tsx
// GOOD
<div className="border-border">Standard border</div>
<div className="border-input">Input border</div>
<div className="border-destructive">Error border</div>

// BAD
<div className="border-gray-200">Border</div>
```

### Available Semantic Colors
Reference `apps/web/src/styles/app.css` for all tokens:
- `background`, `foreground`
- `card`, `card-foreground`
- `popover`, `popover-foreground`
- `primary`, `primary-foreground`
- `secondary`, `secondary-foreground`
- `muted`, `muted-foreground`
- `accent`, `accent-foreground`
- `destructive`
- `border`, `input`, `ring`
- `chart-1` through `chart-5`
- `sidebar-*` variants

## Field Component for Forms

Use the Field component for consistent form field styling:

```tsx
import { Field, FieldError, FieldLabel, FieldDescription } from "@/components/ui/field";

<Field data-invalid={isInvalid}>
  <FieldLabel htmlFor="email" className="required">
    Email
  </FieldLabel>
  <Input
    id="email"
    name="email"
    aria-invalid={isInvalid}
    value={value}
    onChange={onChange}
  />
  <FieldDescription>We'll never share your email.</FieldDescription>
  {isInvalid && <FieldError errors={errors} />}
</Field>
```

The `data-invalid` attribute triggers:
- Error text color (`text-destructive`)
- Can be used for ring styling on inputs

## Form Element Requirements

All form elements must have proper accessibility attributes:
- `<label>` must have `htmlFor` matching input `id`
- `<input>` must have `name` attribute
- Use `aria-invalid` for error states

## Component Import Pattern

```tsx
// Import from the ui directory
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
```

## Common Mistakes to Avoid

1. **Never use raw Tailwind colors** - Always use semantic color classes
2. **Don't recreate existing components** - Check ui/ directory first
3. **Don't forget accessibility** - Use proper `htmlFor`, `name`, `aria-*` attributes
4. **Don't hardcode light/dark values** - Semantic colors handle this automatically
