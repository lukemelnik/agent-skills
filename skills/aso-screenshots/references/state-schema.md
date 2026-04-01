# State Schema

State is stored in `.aso-screenshots/state.json`. Updated incrementally after each phase.

```json
{
  "app": {
    "name": "MyApp",
    "bundle_id": "com.example.myapp"
  },
  "target_audience": "Description of target users",
  "display_size": "6.7",
  "dimensions": { "w": 1290, "h": 2796 },
  "benefits": [
    {
      "verb": "TRACK",
      "descriptor": "CARD PRICES",
      "reasoning": "Why this benefit drives downloads"
    }
  ],
  "brand_color": {
    "hex": "#2563EB",
    "name": "Electric Blue",
    "reasoning": "Complements the app's light UI, stands out at thumbnail size"
  },
  "screenshots": [
    {
      "path": "./simulator-screenshots/home.png",
      "shows": "Home screen with 6 items in collection",
      "rating": "Great",
      "feedback": "Rich content, clear hierarchy, engaging"
    }
  ],
  "pairings": [
    {
      "benefit_index": 0,
      "screenshot_index": 0,
      "reasoning": "Price chart directly demonstrates the TRACK benefit"
    }
  ],
  "generated": [
    {
      "benefit_slug": "track-card-prices",
      "scaffold": ".aso-screenshots/01-track-card-prices/scaffold.png",
      "enhanced": false,
      "final": ".aso-screenshots/final/01-track-card-prices.png",
      "status": "approved"
    }
  ]
}
```

## Reading State

Check for `.aso-screenshots/state.json` at conversation start. Present status:

```
✅ Benefits (3 confirmed): TRACK CARD PRICES, SEARCH ANY CARD, BUILD COLLECTION
✅ Screenshots captured (5 provided, 4 rated Great/Usable)
✅ Pairings confirmed
✅ Brand color: Electric Blue (#2563EB)
⏳ Composition: 2 of 3 done

Ready to continue with screenshot 3, or change anything?
```

## Writing State

Update after each phase completes. Use atomic writes (write to temp file, then rename) to avoid corruption.
