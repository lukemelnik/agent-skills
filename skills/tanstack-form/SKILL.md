---
name: tanstack-form
description: TanStack Form patterns for React forms. Use when building forms, handling form state, validation, or form submissions.
---

# TanStack Form Patterns

## CRITICAL: Validator Pattern

**NEVER modify the validator to work around type errors.** The schema must be passed directly to validators.

### CORRECT - Schema passed directly

```tsx
validators: {
  onSubmit: MySchema,
},
```

### WRONG - Manual safeParse wrapper (BREAKS ERROR HANDLING)

```tsx
// NEVER DO THIS - it loses per-field error information
validators: {
  onSubmit: ({ value }) => {
    const result = MySchema.safeParse(value);
    if (!result.success) {
      return result.error.issues.map((issue) => issue.message).join(", ");
    }
    return undefined;
  },
},
```

The safeParse wrapper pattern loses per-field error mapping. TanStack Form handles Zod schemas natively and maps errors to the correct fields automatically. If you're getting type errors with the validator, fix the defaultValues or schema - NOT the validator.

## Basic Form Setup

**IMPORTANT:** Always define `defaultValues` as a separate typed object before passing to useForm. This gives better type control and makes the form easier to understand.

```tsx
import { useForm } from "@tanstack/react-form";
import { z } from "zod/v4";

const MySchema = z.object({
  title: z.string().min(3),
  description: z.string().nullable(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof MySchema>;

function MyForm() {
  // Define defaultValues separately with explicit type
  const defaultValues: FormValues = {
    title: "",
    description: null,
    notes: undefined,
  };

  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: MySchema,  // Schema passed directly - NEVER wrap in safeParse
    },
    onSubmit: async ({ value }) => {
      // Handle submission
      await saveMutation.mutateAsync(value);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      noValidate
    >
      {/* Fields */}
    </form>
  );
}
```

## Handling null, undefined, and Empty Strings

This is a common source of type errors. The pattern is:
- **Schema** can allow `null` or `undefined` for optional fields
- **defaultValues** should use the appropriate empty value (`null`, `undefined`, or `""`)
- **Input components** should always receive a string (use `?? ""` to convert null/undefined)
- **onChange** can convert empty string back to `null` if the schema expects nullable

### Pattern for nullable string fields

```tsx
// Schema allows null
const Schema = z.object({
  notes: z.string().nullable(),  // Can be string or null
});

// Default to null (matching schema)
const defaultValues = {
  notes: null,
};

// In the field, convert null to empty string for input, empty string back to null on change
<form.Field name="notes">
  {(field) => (
    <Textarea
      value={field.state.value ?? ""}  // null -> ""
      onChange={(e) =>
        field.handleChange(
          e.target.value.trim() === "" ? null : e.target.value  // "" -> null
        )
      }
    />
  )}
</form.Field>
```

### Pattern for optional string fields

```tsx
// Schema has optional field
const Schema = z.object({
  nickname: z.string().optional(),  // Can be string or undefined
});

// Default to undefined or empty string
const defaultValues = {
  nickname: "",  // Often easier to default to "" than undefined
};

// Input just needs ?? "" safety
<form.Field name="nickname">
  {(field) => (
    <Input
      value={field.state.value ?? ""}
      onChange={(e) => field.handleChange(e.target.value)}
    />
  )}
</form.Field>
```

### Pattern for required string fields

```tsx
// Schema requires string
const Schema = z.object({
  title: z.string().min(1, "Title is required"),
});

// Default to empty string
const defaultValues = {
  title: "",
};

// Simple binding
<form.Field name="title">
  {(field) => (
    <Input
      value={field.state.value}
      onChange={(e) => field.handleChange(e.target.value)}
    />
  )}
</form.Field>
```

## Field Pattern with shadcn Field Component

Always use the shadcn `Field` component for form fields. It provides:
- Automatic error styling (red ring around invalid fields via `data-invalid`)
- Consistent layout and spacing
- Accessibility attributes

```tsx
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

<form.Field name="title">
  {(field) => {
    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
    const errors = field.state.meta.errors;
    return (
      <Field data-invalid={isInvalid}>
        <FieldLabel htmlFor="title" className="required">
          Title
        </FieldLabel>
        <Input
          id="title"
          name="title"
          value={field.state.value ?? ""}
          onChange={(e) => field.handleChange(e.target.value)}
          aria-invalid={isInvalid}
        />
        {isInvalid && <FieldError errors={errors} />}
      </Field>
    );
  }}
</form.Field>
```

**Key components:**
- `Field` - Wrapper with `data-invalid` for error styling
- `FieldLabel` - Label with `htmlFor`, use `className="required"` for required fields
- `FieldError` - Displays error messages, handles arrays of errors (supports Zod issues)
- `FieldDescription` - Optional helper text

## FieldError with Zod Errors

The `FieldError` component accepts the errors array from TanStack Form, which contains Zod validation issues:

```tsx
// errors is field.state.meta.errors - an array of error objects
<FieldError errors={errors} />

// FieldError handles both:
// - Single error: { message: "Title is required" }
// - Multiple errors: [{ message: "Too short" }, { message: "Invalid characters" }]
```

## Use form.useStore Instead of useState

**CRITICAL**: When you need reactive form state (like checking if form is dirty, or watching a field value), use `form.useStore` instead of separate useState.

### Bad - Using useState for form-derived state

```tsx
// DON'T DO THIS
const [isFormDirty, setIsFormDirty] = useState(false);

useEffect(() => {
  setIsFormDirty(form.state.isDirty);
}, [form.state.isDirty]);
```

### Good - Using form.useStore

```tsx
// DO THIS - Subscribe to form state reactively
const canSubmit = form.useStore((state) => state.canSubmit);
const isDirty = form.useStore((state) => state.isDirty);
const isSubmitting = form.useStore((state) => state.isSubmitting);

// For watching specific field values
const titleValue = form.useStore((state) => state.values.title);
```

### Using form.subscribe for Side Effects

```tsx
useEffect(() => {
  const unsubscribe = form.subscribe((state) => {
    // React to form state changes
    if (state.isDirty) {
      // Show unsaved changes warning
    }
  });
  return unsubscribe;
}, [form]);
```

## Keep State in Form, Not in useState

### Bad - Duplicating form state

```tsx
// DON'T DO THIS - duplicates state
const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);

<form.Field name="artistId">
  {(field) => (
    <ArtistSelect
      value={selectedArtist}
      onChange={(artist) => {
        setSelectedArtist(artist);  // Duplicate state!
        field.handleChange(artist.id);
      }}
    />
  )}
</form.Field>
```

### Good - Store everything in form

```tsx
// DO THIS - single source of truth
<form.Field name="artist">
  {(field) => (
    <ArtistSelect
      value={field.state.value}
      onChange={(artist) => field.handleChange(artist)}
    />
  )}
</form.Field>
```

## Accessing Form State

```tsx
// In render - use form.state directly or useStore
const { isDirty, isSubmitting, canSubmit } = form.state;

// For reactive updates in UI, prefer useStore
const isDirty = form.useStore((state) => state.isDirty);

// For imperative access (callbacks, effects)
const checkDirty = () => {
  if (form.state.isDirty) {
    showWarning();
  }
};
```

## Form Reset and Navigation

```tsx
const handleCancel = () => {
  form.reset();
  navigate({ to: "..", search: (prev) => ({ ...prev, modal: undefined }) });
};

// Check for unsaved changes before closing
const handleClose = () => {
  if (form.state.isDirty) {
    setShowUnsavedDialog(true);
    return;
  }
  closeModal();
};
```

## Array Fields and Table-Like Displays

For line items, use `mode="array"` and handle errors at both array and item level:

```tsx
<form.Field name="items" mode="array">
  {(field) => {
    const items = field.state.value || [];
    const hasItemsError = (field.state.meta.errors?.length || 0) > 0;

    return (
      <div className="space-y-4">
        {/* Array-level errors (e.g., "At least one item required") */}
        <form.Subscribe selector={(s) => s.fieldMeta?.items?.errors ?? []}>
          {(errors) => errors?.length ? <FieldError errors={errors} /> : null}
        </form.Subscribe>

        {/* Empty state with error styling */}
        {items.length === 0 ? (
          <div className={cn(
            "rounded-lg border-2 border-dashed p-8 text-center",
            hasItemsError ? "border-destructive" : "border-muted-foreground/20",
          )}>
            No items added yet
          </div>
        ) : (
          items.map((_, i) => (
            <div key={`item-${i}`}>
              {/* Individual item fields */}
              <form.Field name={`items[${i}].name`}>
                {(itemField) => (
                  <Input
                    value={itemField.state.value}
                    onChange={(e) => itemField.handleChange(e.target.value)}
                    aria-invalid={itemField.state.meta.isTouched && !itemField.state.meta.isValid}
                  />
                )}
              </form.Field>
            </div>
          ))
        )}
      </div>
    );
  }}
</form.Field>
```

## Array Fields with Complex Cross-Field Validation

**When to use this pattern:** Only when your array has validation rules that depend on multiple items or the array as a whole, such as:
- Percentages must total 100%
- At least one item required
- No duplicate values across items
- Cross-field dependencies (e.g., if role is "writer", PRO is required)

**When NOT to use this pattern:** For simple per-field validation (required, min length, email format), the basic array pattern above is sufficient. The `onSubmit` validator handles these fine.

### The Problem

With only `onSubmit` validation, array-level errors (like "shares must total 100%") persist even after the user fixes the issue. The error only clears on the next submit attempt, which is confusing UX.

### The Solution: onChange Validator + field.validate("change")

Add an `onChange` validator to the array field, then call `field.validate("change")` from every subfield's onChange handler:

```tsx
const schema = z.object({
  writers: z
    .array(
      z.object({
        name: z.string().min(1, "Name is required"),
        email: z.email("Valid email required"),
        share: z.number().min(0).max(100),
      }),
    )
    .refine(
      (writers) => {
        if (writers.length === 0) return true;
        const total = writers.reduce((sum, w) => sum + w.share, 0);
        return Math.abs(total - 100) <= 0.1;
      },
      { message: "Writer shares must total 100%" },
    ),
});

// In the form:
<form.Field
  name="writers"
  mode="array"
  validators={{
    onChange: schema.shape.writers,  // Add onChange validator
  }}
>
  {(field) => (
    <>
      {field.state.value.map((_, index) => (
        <div key={index}>
          {/* Each subfield calls field.validate("change") */}
          <form.Field name={`writers[${index}].name`}>
            {(nameField) => (
              <Input
                value={nameField.state.value}
                onChange={(e) => {
                  nameField.handleChange(e.target.value);
                  field.validate("change");  // Trigger parent validation
                }}
              />
            )}
          </form.Field>

          <form.Field name={`writers[${index}].share`}>
            {(shareField) => (
              <Input
                type="number"
                value={shareField.state.value}
                onChange={(e) => {
                  shareField.handleChange(Number(e.target.value));
                  field.validate("change");  // Trigger parent validation
                }}
              />
            )}
          </form.Field>
        </div>
      ))}

      {/* Array-level errors display */}
      {field.state.meta.errors && field.state.meta.errors.length > 0 && (
        <div className="text-destructive">
          {field.state.meta.errors.map((error, idx) => (
            <p key={idx}>
              • {typeof error === "string" ? error : error?.message}
            </p>
          ))}
        </div>
      )}
    </>
  )}
</form.Field>
```

### Also Update Array Modification Actions

Any button that adds, removes, or modifies array items should also call `field.validate("change")`:

```tsx
// Add item
<Button
  onClick={() => {
    field.handleChange([...field.state.value, newItem]);
    field.validate("change");
  }}
>
  Add Writer
</Button>

// Remove item
<Button
  onClick={() => {
    field.handleChange(field.state.value.filter((_, i) => i !== index));
    field.validate("change");
  }}
>
  Remove
</Button>

// Bulk operations (e.g., "Split Evenly")
<Button
  onClick={() => {
    const evenShare = 100 / field.state.value.length;
    field.handleChange(
      field.state.value.map((item) => ({ ...item, share: evenShare }))
    );
    field.validate("change");
  }}
>
  Split Evenly
</Button>
```

### Why This Works

1. The `onChange` validator on the array field runs whenever `field.validate("change")` is called
2. Calling it from subfield onChange handlers triggers revalidation after every change
3. Errors clear immediately when the user fixes the issue (e.g., shares now total 100%)
4. The `onSubmit` validator still runs on form submission as a final check

### When Errors Should Display

Typically, you don't want to show array-level validation errors until the user has attempted to submit. Use a `hasAttemptedSubmit` or `submissionAttempts` pattern:

```tsx
const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

<form
  onSubmit={(e) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);
    form.handleSubmit();
  }}
>
  {/* Only show errors after first submit attempt */}
  {hasAttemptedSubmit && field.state.meta.errors?.length > 0 && (
    <FieldError errors={field.state.meta.errors} />
  )}
</form>
```

## form.Subscribe for Reactive Values

Use `form.Subscribe` to watch values and react to changes:

```tsx
{/* Watch items to filter available options */}
<form.Subscribe
  selector={(state) => state.values.items}
  // biome-ignore lint/correctness/noChildrenProp: tanstack convention
  children={(items) => {
    const itemIds = items.map((v) => v.id).filter(Boolean);
    const availableItems = allItems.filter((i) => !itemIds.includes(i.id));

    return (
      <div>
        {availableItems.map((item) => (
          <Button key={item.id} onClick={() => addItem(item)}>
            Add {item.name}
          </Button>
        ))}
      </div>
    );
  }}
/>
```

## Fixing Type Errors - DO's and DON'Ts

When you encounter type errors with TanStack Form:

### DO:
1. **Fix defaultValues** - Ensure they match the schema exactly
2. **Fix the schema** - If the schema doesn't match the data model
3. **Add type annotation** - `const defaultValues: FormValues = { ... }`
4. **Use `satisfies`** - For inline type checking: `defaultValues satisfies FormValues`

### DON'T:
1. **Never wrap validators in safeParse** - Breaks per-field error handling
2. **Never use `as any`** - Find the real type issue
3. **Never cast form values** - Fix the source of the type mismatch
4. **Never remove validation** - Always keep schema validation on submit

### Example: Fixing a Type Error

```tsx
// Problem: Type error because schema expects number but default is string
const Schema = z.object({
  quantity: z.number().min(1),
});

// WRONG - Don't change the validator
validators: {
  onSubmit: ({ value }) => { /* safeParse wrapper */ }  // NO!
}

// CORRECT - Fix the defaultValues
const defaultValues = {
  quantity: 1,  // Use number, not "1" string
};

// Or if form needs string input, fix the schema
const Schema = z.object({
  quantity: z.coerce.number().min(1),  // Coerce string to number
});
```

## Common Mistakes

1. **Don't use useState for form-derived state** - Use `form.useStore()` or `form.subscribe()`
2. **Don't duplicate field values in component state** - Keep all values in form
3. **Always use `noValidate` on form element** - Let TanStack Form handle validation
4. **Always call `e.stopPropagation()`** - Prevent event bubbling in nested forms
5. **Use `field.state.value ?? ""`** - Handle nullable values for inputs
6. **Use shadcn Field component** - For consistent error display and styling
7. **NEVER wrap validators in safeParse** - Pass schema directly, always
8. **Define defaultValues separately** - With explicit type for better control

## Testing Form Validation with Playwright MCP

When implementing or fixing forms, **use the `playwriter` MCP server to test validation in the browser**. A form is not complete until it passes these tests:

### 1. Happy Path Test
```
- Fill all fields with valid data
- Submit the form
- Verify successful submission (no errors, expected result)
```

### 2. Error Handling Tests (for EACH input field)
```
For each input in the form:
- Enter invalid data for that specific field (leave others valid or empty)
- Submit the form
- Verify:
  ✓ Form does NOT submit
  ✓ Error message appears for that field
  ✓ Focus ring (red border/ring) appears around the offending input
  ✓ All validation errors show simultaneously (not just the first one)
```

### 3. Table/Row Layout Error Display
```
For forms with table layouts (invoice line items, performers, credits, etc.):
- When there isn't room for errors below each cell
- Errors should display as bullet points below the entire row
- Test that row-level errors display correctly with multiple invalid cells
```

### Why This Matters
Type checking alone won't catch:
- Validators wrapped in safeParse (errors show as generic string, not per-field)
- Missing `data-invalid` attributes on Field components
- Missing `aria-invalid` on inputs
- FieldError not receiving the correct errors array
- Silent validation failures where form submits anyway

**Always test with Playwright MCP to verify the actual user experience.**
