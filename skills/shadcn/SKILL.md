---
name: shadcn
description: Implementing UI with shadcn/ui components (Field forms, semantic color tokens, Sonner toasts). For visual design decisions use ui-design.
---

# shadcn/ui Patterns

## Optional Library References

- **Sonner setup, loading/update lifecycles, styling, theme, or troubleshooting:** read [references/sonner.md](references/sonner.md) only when the project uses Sonner or the user requests it. Reuse the existing shadcn integration; do not introduce or migrate toast libraries automatically.

## Colors

Never use raw Tailwind colors (`text-gray-500`, `bg-white`, `border-gray-200`). Use semantic tokens (`text-muted-foreground`, `bg-card`, `border-border`, `text-destructive`) defined in `apps/web/src/styles/app.css`.

## Field Component for Forms

Use `Field` for form fields:

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

`data-invalid` triggers the error text color (`text-destructive`) and can drive ring styling on inputs.
