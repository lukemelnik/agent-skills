# PPP Pricing (Per-Territory)

Create or update localized pricing across territories.

## Preconditions
- Decide base territory (usually `USA`) and baseline price.
- `asc pricing territories list --paginate` for supported territory IDs.

## IAP PPP Workflow

### New IAP: bootstrap with `setup`
```bash
asc iap setup \
  --app "APP_ID" \
  --type NON_CONSUMABLE \
  --reference-name "Pro Lifetime" \
  --product-id "com.example.pro.lifetime" \
  --locale "en-US" \
  --display-name "Pro Lifetime" \
  --description "Unlock everything forever" \
  --price "9.99" \
  --base-territory "USA" \
  --output json
```

### Inspect current IAP pricing
```bash
asc iap pricing summary --iap-id "IAP_ID" --territory "USA"
asc iap pricing summary --iap-id "IAP_ID" --territory "IND"
```

### Discover price points
```bash
asc iap pricing price-points list --iap-id "IAP_ID" --territory "USA" --paginate --price "9.99"
asc iap pricing price-points equalizations --id "PRICE_POINT_ID"
```

### Create or update price schedule
```bash
asc iap pricing schedules create --iap-id "IAP_ID" --base-territory "USA" --price "4.99" --start-date "2026-04-01"
asc iap pricing schedules get --iap-id "IAP_ID"
```

## Subscription PPP Workflow

### New subscription: bootstrap with `setup`
```bash
asc subscriptions setup \
  --app "APP_ID" \
  --group-reference-name "Pro" \
  --reference-name "Pro Monthly" \
  --product-id "com.example.pro.monthly" \
  --subscription-period ONE_MONTH \
  --locale "en-US" \
  --display-name "Pro Monthly" \
  --description "Unlock everything" \
  --price "9.99" \
  --price-territory "USA" \
  --territories "USA,CAN,GBR" \
  --output json
```

### Bulk PPP update: CSV import with dry run
```csv
territory,price,start_date,preserved
IND,2.99,2026-04-01,false
BRA,4.99,2026-04-01,false
DEU,8.99,2026-04-01,false
```

```bash
# Dry-run
asc subscriptions pricing prices import --subscription-id "SUB_ID" --input "./ppp-prices.csv" --dry-run --output table

# Apply
asc subscriptions pricing prices import --subscription-id "SUB_ID" --input "./ppp-prices.csv" --output table
```

### One-off territory changes
```bash
asc subscriptions pricing prices set --subscription-id "SUB_ID" --price "2.99" --territory "IND"
```

### Subscription availability
```bash
asc subscriptions pricing availability set --subscription-id "SUB_ID" --territories "USA,CAN,IND,BRA"
```

## Common PPP Strategy Patterns
- **Base territory first**: Set baseline price in USA, derive others from it.
- **Tiered regional pricing**: High-income close to baseline, mid-income moderate discounts, lower-income stronger PPP.
- **Spreadsheet-driven**: Build CSV → dry-run → fix failures → apply → verify.

## Notes
- Price changes may take time to propagate in ASC and storefronts.
- `setup` commands provide built-in post-create verification.
