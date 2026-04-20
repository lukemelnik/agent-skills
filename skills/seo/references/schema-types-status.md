# Schema.org Types: Status Reference

Current as of February 2026. Schema.org version 29.4 (December 2025).

**Always use JSON-LD** (`<script type="application/ld+json">`). Google explicitly prefers JSON-LD over Microdata and RDFa.

**AI search note:** Content with proper schema has approximately 2.5× higher chance of appearing in AI-generated answers (Google + Microsoft, March 2025).

---

## ACTIVE — recommend freely

These types are current and produce rich results in Google Search (or are fundamental for understanding pages).

### Foundational
| Type | Use case | Rich result? |
|---|---|---|
| Organization | Company info, knowledge panel | Knowledge panel |
| WebSite | Site-level, sitelinks search box | Sitelinks search |
| WebPage | Generic page metadata | None directly |
| BreadcrumbList | Navigation breadcrumbs | Breadcrumbs in SERP |
| ContactPage | Contact pages | None directly |
| Person | Authors, team | Author info in articles |
| ProfilePage (added 2025) | Author/creator profile pages | Strong E-E-A-T signal |

### Content
| Type | Use case | Rich result? |
|---|---|---|
| Article | Generic editorial content | Article rich result |
| BlogPosting | Blog posts | Article rich result |
| NewsArticle | News content (Google News eligible) | Top stories carousel |
| DiscussionForumPosting (added 2024) | Forum/community threads | None yet |
| Book | Book pages | Currently functional |
| Dataset | Research datasets | ⚠️ Rich results retired late 2025, but schema still useful for AI/Google internal |

### Software / apps
| Type | Use case | Rich result? |
|---|---|---|
| SoftwareApplication | Generic software/apps | App rich result |
| WebApplication | Browser-based SaaS | App rich result |
| MobileApplication | iOS/Android apps | App rich result |
| SoftwareSourceCode (added 2025) | Open source repos | None yet |

### Commerce
| Type | Use case | Rich result? |
|---|---|---|
| Product | Physical/digital products | Price, rating, availability |
| ProductGroup (added 2025) | Variant products (size, color) | Variant-aware results |
| Offer | Pricing | Inline with Product |
| AggregateOffer | Multiple seller offers | Inline |
| OfferShippingDetails | Shipping info | Inline |
| MerchantReturnPolicy | Return policies | **Required** for Product rich results since March 2025 |
| Review | Individual reviews | Star rating |
| AggregateRating | Review summaries | Star rating |
| Service | Service businesses | None directly |
| Certification (April 2025) | Product certifications | Replaced EnergyConsumptionDetails |
| LoyaltyProgram (June 2025) | Member pricing, loyalty | Member price tags in SERP |

### Media
| Type | Use case | Rich result? |
|---|---|---|
| VideoObject | Video content | Video thumbnail in SERP |
| BroadcastEvent | Live streaming | LIVE badge |
| Clip | Video chapters | Key moments in SERP |
| SeekToAction | Video seek functionality | Seek in SERP video |
| AudioObject | Audio files | None directly |
| ImageObject | Standalone images | None directly |
| PodcastSeries | Podcast shows | None directly |
| PodcastEpisode | Podcast episodes | None directly |
| Movie | Movie pages | Movie rich result |
| TVSeries | TV series pages | None directly |
| TVEpisode | TV episodes | None directly |
| MusicRecording | Songs | None directly |
| MusicAlbum | Albums | None directly |
| MusicGroup | Artists/bands | None directly |

### Events
| Type | Use case | Rich result? |
|---|---|---|
| Event | Generic events | Event listing |
| ConferenceEvent (December 2025) | Conferences | Event listing |
| PerformingArtsEvent (December 2025) | Concerts, plays | Event listing |
| SportsEvent | Sports matches | Event listing |
| EventSeries | Recurring events | None directly |

### Food
| Type | Use case | Rich result? |
|---|---|---|
| Recipe | Cooking recipes | Recipe card |
| Menu | Restaurant menus | None directly |
| MenuItem | Menu items | None directly |

### Local business
| Type | Use case | Rich result? |
|---|---|---|
| LocalBusiness | Generic physical business | Business info, maps |
| Restaurant | Restaurants | Maps, menu link |
| Store | Retail stores | Maps |
| EducationalOrganization | Schools | Maps |

LocalBusiness has many subtypes — use the most specific that fits. Common: AutoBodyShop, AutoRepair, BarOrPub, BeautySalon, Dentist, Hospital, Hotel, Lawyer, Library, Locksmith, MedicalClinic, NightClub, Pharmacy, Physician, Plumber, RealEstateAgent, RoofingContractor, ShoppingCenter, etc.

### Travel
| Type | Use case | Rich result? |
|---|---|---|
| Hotel | Hotels | Hotel listings |
| LodgingBusiness | Other accommodations | Maps |
| TouristAttraction | Tourist destinations | Maps |
| TravelAgency | Travel agencies | Maps |
| Trip | Travel itineraries | None directly |

### Jobs / careers
| Type | Use case | Rich result? |
|---|---|---|
| JobPosting | Job listings | Google for Jobs |
| EmployerAggregateRating | Employer reviews | Inline |
| Occupation | Career pages (not specific listings) | None directly |

### Education
| Type | Use case | Rich result? |
|---|---|---|
| Course | Educational courses | Course rich result |
| EducationalOrganization | Schools | Maps |
| LearningResource | Tutorials, learning content | None directly |
| Quiz | Quizzes | None directly |

### Health / medical (YMYL — high E-E-A-T required)
| Type | Use case | Rich result? |
|---|---|---|
| MedicalWebPage | Medical content | None directly |
| MedicalCondition | Disease/condition pages | None directly |
| Drug | Medication info | None directly |
| Physician | Doctor pages | Maps |

### Trust / accessibility
| Type | Use case | Rich result? |
|---|---|---|
| Speakable | Voice-readable content | Google Assistant playback |

---

## RESTRICTED — only for specific site types

### FAQPage

**Status:** Rich results restricted to **government and healthcare authority sites only** since August 2023.

**Nuance for commercial sites:**
- **Existing FAQPage on commercial site:** Don't remove. Flag at **Info** priority, not Critical. Removal removes GEO/LLM citation upside.
- **Adding new FAQPage on commercial site:** Not recommended for Google rich result benefit. Acceptable if AI search visibility is a priority — FAQPage schema still helps ChatGPT, Perplexity, and Google AI Overviews extract Q&A pairs for citation.

```html
<!-- Use FAQPage on commercial sites for AI/GEO benefit only.
     Do NOT expect Google rich results from it. -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [...]
}
</script>
```

---

## DEPRECATED — never recommend

### HowTo
- **Rich results fully removed September 2023**
- Google no longer shows how-to rich results
- **Don't add HowTo schema to new pages.**
- If existing pages have it, remove or convert to Article schema

### SpecialAnnouncement
- **Deprecated July 31, 2025**
- COVID-era schema, no longer processed by Google

### CourseInfo
- **Retired from rich results June 2025**
- Merged into the Course type. Use Course instead.

### EstimatedSalary
- **Retired from rich results June 2025**
- Salary info no longer displayed in SERP

### LearningVideo
- **Retired from rich results June 2025**
- Use VideoObject instead

### ClaimReview
- **Retired from rich results June 2025**
- Fact-check rich results discontinued
- Schema still valid but no SERP enhancement

### VehicleListing
- **Retired from rich results June 2025**
- Vehicle listing structured data discontinued

### Practice Problem
- **Retired from rich results late 2025**
- Educational practice problems no longer displayed

### Dataset (rich results only)
- **Retired from rich results late 2025**
- Dataset Search feature discontinued
- Schema still valid for AI/Google internal use

### Book Actions
- **Deprecated → reversed → still functional as of February 2026**
- Historical note: Google planned to deprecate, then reversed
- Still works but uncertain future

---

## E-commerce requirements (updated)

| Requirement | Status | Since |
|---|---|---|
| `returnPolicyCountry` in MerchantReturnPolicy | **Required** for Product rich results | March 2025 |
| Product variant structured data (ProductGroup) | Expanded across categories | 2025 (apparel, cosmetics, electronics) |

Content API for Shopping sunsets August 18, 2026 → migrate to Merchant API.

---

## Recent additions (2024–2026)

| Type / Feature | Added |
|---|---|
| Product Certification markup | April 2025 (replaced EnergyConsumptionDetails) |
| ProductGroup | 2025 (variant-aware rich results) |
| ProfilePage | 2025 (E-E-A-T author signals) |
| DiscussionForumPosting | 2024 (forum/community content) |
| Speakable (updated) | 2024 (voice search) |
| LoyaltyProgram | June 2025 (member pricing) |
| Organization-level shipping/return policies | November 2025 (configure via Search Console without Merchant Center) |
| ConferenceEvent | December 2025 (Schema.org v29.4) |
| PerformingArtsEvent | December 2025 (Schema.org v29.4) |

---

## Validation checklist

For any schema block, verify:

1. ✅ `@context` is `"https://schema.org"` (https, not http)
2. ✅ `@type` is a valid, non-deprecated type from this reference
3. ✅ All required properties are present (see `schema-templates.json` for required fields per type)
4. ✅ Property values match expected data types (string vs number vs URL vs ISO 8601 date)
5. ✅ No placeholder text remains (e.g., `[Business Name]`, `[Author]`)
6. ✅ All URLs are absolute, not relative
7. ✅ Dates are ISO 8601 format
8. ✅ Images have valid, accessible URLs
9. ✅ For Product: `MerchantReturnPolicy.returnPolicyCountry` is set (March 2025 requirement)
10. ✅ FAQPage only used on appropriate sites or with AI/GEO intent

## Testing tools

- [Google Rich Results Test](https://search.google.com/test/rich-results) — renders JS, accurate for production
- [Schema.org Validator](https://validator.schema.org/) — strict spec validation
- [Google Search Console → Enhancements](https://search.google.com/search-console) — shows rich result eligibility for indexed pages
