# AI Bot Configuration

How to configure `robots.txt` to allow (or block) AI search crawlers. Each AI platform has its own bot, and blocking it means that platform can't cite your content.

## The decision: allow or block?

**Default recommendation: allow the search bots, block the training-only bots.**

| Bot category | Recommended action | Reasoning |
|---|---|---|
| **AI search bots** (GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, Google-Extended) | **Allow** | These power live AI search. Blocking = no citations. |
| **Training-only bots** (CCBot, anthropic-ai for training, Bytespider for training) | **Block if you don't want training data scraped** | Doesn't affect search citations |

The trade-off: blocking bots prevents AI training on your content but also prevents citation in those platforms' search/answer features.

## Complete bot reference

### OpenAI (ChatGPT)
| User-agent | Purpose | Allow? |
|---|---|---|
| `GPTBot` | Crawls for ChatGPT's training data AND search index | **Allow** |
| `ChatGPT-User` | Used when ChatGPT users browse on demand (not crawl) | **Allow** |
| `OAI-SearchBot` | OpenAI's dedicated search crawler | **Allow** |

### Anthropic (Claude)
| User-agent | Purpose | Allow? |
|---|---|---|
| `ClaudeBot` | Crawls for Claude's web access features | **Allow** |
| `anthropic-ai` | Older general crawler, training | Allow or block per training preference |
| `Claude-Web` | Anthropic crawler | **Allow** |

### Perplexity
| User-agent | Purpose | Allow? |
|---|---|---|
| `PerplexityBot` | Powers Perplexity AI search | **Allow** |

### Google
| User-agent | Purpose | Allow? |
|---|---|---|
| `Google-Extended` | Controls Gemini and Google AI Overviews access (separate from Googlebot) | **Allow** |
| `Googlebot` | Standard Google search crawler | **Always allow** |

> Note: `Google-Extended` does NOT control standard Google Search indexing — that's `Googlebot`. Blocking `Google-Extended` only blocks Gemini/Vertex AI, not regular Google Search.

### Microsoft / Bing
| User-agent | Purpose | Allow? |
|---|---|---|
| `Bingbot` | Standard Bing crawler (also powers Copilot) | **Always allow** |
| `msnbot` | Older MSN bot | Allow |

### ByteDance (TikTok)
| User-agent | Purpose | Allow? |
|---|---|---|
| `Bytespider` | Crawls for TikTok/Douyin AI features | Optional |

### Other AI companies
| User-agent | Owner | Purpose |
|---|---|---|
| `cohere-ai` | Cohere | Cohere model training |
| `Diffbot` | Diffbot | Web data extraction |
| `Omgilibot` | Webz.io | News/web crawling |
| `Applebot-Extended` | Apple | Apple Intelligence training (separate from Applebot) |

### Common Crawl
| User-agent | Owner | Purpose | Allow? |
|---|---|---|---|
| `CCBot` | Common Crawl | Training data corpus used by many AI models | **Block to prevent training scraping** |

## Recommended robots.txt configurations

### Configuration A: Maximum AI visibility (recommended for most sites)

Allow all AI search bots, allow training. You want to be discoverable everywhere.

```
User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: Bytespider
Allow: /

Sitemap: https://example.com/sitemap.xml
```

### Configuration B: AI search yes, training no

Allow live AI search but block training-only crawlers. Good for sites that want citations but don't want to be scraped wholesale into training datasets.

```
User-agent: *
Allow: /

# Allow AI search bots
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Bingbot
Allow: /

# Block training corpora
User-agent: CCBot
Disallow: /

User-agent: anthropic-ai
Disallow: /

User-agent: Bytespider
Disallow: /

User-agent: Applebot-Extended
Disallow: /

Sitemap: https://example.com/sitemap.xml
```

### Configuration C: Block all AI

If you don't want your content used for AI training OR cited in AI answers (rare for most businesses).

```
User-agent: *
Allow: /

User-agent: GPTBot
Disallow: /

User-agent: ChatGPT-User
Disallow: /

User-agent: OAI-SearchBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: anthropic-ai
Disallow: /

User-agent: PerplexityBot
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: Bytespider
Disallow: /

User-agent: Applebot-Extended
Disallow: /

Sitemap: https://example.com/sitemap.xml
```

**Warning:** Configuration C blocks AI search citations entirely. You will not appear in ChatGPT, Perplexity, AI Overviews, Claude, or Copilot. Only do this if you have a clear reason (paywalled content, premium publishers, legal/regulatory).

## Audit current configuration

```bash
# Fetch and check robots.txt
curl -s https://example.com/robots.txt | grep -iE "GPTBot|ClaudeBot|PerplexityBot|Google-Extended|OAI-SearchBot|Bingbot|CCBot|anthropic"
```

Look for `Disallow: /` rules under any of these user-agents and decide if they're intentional.

## Common mistakes

### Blocking AI bots accidentally
Sites that copy old robots.txt templates often block AI bots without realizing it. Audit and fix.

### Blocking Googlebot via Google-Extended
**These are different.** `Google-Extended` controls Gemini/AI Overviews. `Googlebot` controls regular Google Search. Blocking `Google-Extended` does NOT block Google Search indexing.

### Wildcard blocks
```
User-agent: *
Disallow: /private/
```
Wildcard rules apply to AI bots too. If you `Disallow: /` for `*`, all AI bots are blocked even without specific entries.

### Nginx/server-level blocks
Some sites block AI bots at the server/firewall level (not robots.txt). Check `nginx.conf` or CDN rules for user-agent blocks. Cloudflare has a "Block AI Bots" toggle that's enabled by default for some plans.

### Testing
Use `curl -A "GPTBot" -I https://example.com/page` to test if a page is reachable to a specific bot. A 200 response means the bot can access the page (assuming robots.txt allows it).

## Verification: are the bots actually crawling?

After updating robots.txt, verify with server logs:
```bash
# Check access logs for AI bot user-agents (last 7 days)
tail -10000 /var/log/nginx/access.log | grep -iE "GPTBot|ClaudeBot|PerplexityBot|OAI-SearchBot|Google-Extended" | wc -l
```

If the count is 0 after a week of accepting them, something's blocking them at a higher level (firewall, CDN, WAF).

## When robots.txt isn't enough

`robots.txt` is a polite request. Bad-actor scrapers ignore it. For real protection:
- Cloudflare Bot Fight Mode (or equivalent CDN bot detection)
- Server-level rate limiting
- IP-based blocks
- API authentication for sensitive endpoints

But for the major AI companies (OpenAI, Anthropic, Google, Perplexity, Microsoft), they DO honor `robots.txt`. So configuring it correctly is sufficient for legitimate AI access control.
