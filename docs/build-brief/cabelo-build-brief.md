# Cabelo.ai — Build Brief: The "Closer to 10" System
**For:** Sahan · **From:** Ralph · **Date:** June 2026
**Companion files in this package:** `hair-memory-spec.md` · `sharescore-card-spec.html` · `cabelo-llm-flywheel.html`

---

## 1. What we're building and why

Cabelo.ai evolves from "AI hair analysis app" to **the consumer engine of a three-loop system**:

1. **Knowledge loop** — stylists record voice answers + clients send check-in photos → private knowledge base → distilled public layer → LLMs cite us → new clients and stylists arrive. (Diagram: `cabelo-llm-flywheel.html`, chart 1.)
2. **Money loop** — stylist prescribes the app chairside (QR + her code) → client buys products via Shopify → commission paid on every order including reorders → stylist prescribes more. (Chart 2, left.)
3. **Viral loop** — client sees verified results (week-1 vs week-8 photos) → shares ShareScore card → friends scan with give-15/get-15 referral → new sharers. (Chart 2, right.)

**Positioning:** damage triage, not general hair advice. "Your chemical treatment went wrong — get a verified expert plan in 60 seconds." The acute segment converts, retains, and evangelizes; casual users still come.

**The moat is data, not features.** Stickiness scores from our analysis: outcome photo data over time (10), stylist knowledge corpus (9), AI citation authority for stylists (8). The photo analysis itself scores 3 — great front door, zero lock-in. Every build decision gets judged by one question: *does it increase the rate of voice answers and check-in photos flowing into the private knowledge base?*

---

## 2. Current state (what already exists in the codebase)

- React/Vite frontend, Firebase backend, Gemini/Vertex AI
- Quick scan + full analysis, AI chat coach (elite trichologist prompts), Learn, Directory, ShareScore page, Admin
- EN/PT/ES localization, guest message limits, FCM push, scheduled functions (`sendInactiveUserNotifications`)
- Context engine (`userContext.js`): profile, city water-hardness data, weather, latest analysis, chat history, `verifySameUser` check
- Functions: `analyzeHairFull/Quick`, `chat`, `chatStreamV`, profile + history CRUD

We're extending this — not rebuilding.

---

## 3. The build, by system

### 3.1 Knowledge capture (THE GATE — everything depends on this)

**Stylist voice-answer pipeline:**
- Stylist records voice answers to curated questions (top 50 most-asked, then ongoing)
- Pipeline: audio upload → transcription → LLM structuring (Q + answer + hair-type applicability + products referenced) → review queue → Vertex AI Search knowledge base
- Each accepted answer carries stylist attribution (name, city, credentials) — this powers citations
- Chat (`prompts.js`) switches from generic expertise to **RAG over the stylist corpus**, citing contributors by name in answers

**Consumer outcome capture:** check-in photos + text (see 3.4) write to the per-user timeline (see `hair-memory-spec.md` §2.2). Together these two streams ARE the knowledge base.

### 3.2 Shopify integration (Prohall store)

- **Storefront API:** product recs in analysis results / chat → add to cart → checkout in-app, no redirect
- **Admin API webhook `orders/paid`:** order → updates user memory (`products[]`, protocol start), fires protocol scheduler, attributes commission/referral codes
- **Discount API — one service, three uses:**
  1. Stylist commission codes (per-stylist, recurring attribution on all orders incl. reorders)
  2. Consumer referral codes (give 15% / get 15%, on ShareScore card)
  3. Protocol coupons (replenishment + check-in rewards)
- **Attribution dashboard:** every order tags back to its source (analysis session, chat rec, share card, stylist code). This is how we measure the killer-test numbers.

### 3.3 Protocol scheduler (rules engine, not campaigns)

- ~10–15 trigger rules stored as data, evaluated daily by Cloud Scheduler: "X days after order of product Y → send message Z [+ coupon]"
- Protocol timeline per product (e.g., Select One aftercare: day 7, week 4, week 6 replenishment, week 8 final, week 10 rebooking nudge)
- Channels: FCM push (ask permission only AFTER first value delivered, never on app open) + email fallback (capture at signup; push opt-in runs 40–60%)
- **Frequency cap: max 1 touch/user/week.** Every coupon must be explainable by the user's timeline. Check-in and progress messages carry NO offer.
- Coupons reserved for: replenishment timing, win-back (lapsed 30+ days), check-in milestones

### 3.4 Check-in loop (the data engine)

- Push: "Week 4 — how's the hair holding up? Snap a pic or just tell me"
- Tap → straight into chat. Photo and/or free text. No forms.
- AI responds with specific value about THEIR photo, then the milestone reward where applicable
- **Coupon logic:** photo check-ins at weeks 1/4/6–8 earn coupons; milestone completion ("all 3 check-ins → 20%") earns the big one; text-only gets great response + streak nudge, no coupon
- Photo guidance ("same spot as last time helps me compare") — nudge, never gate
- Writes: timeline entry, memory doc `journey` + `usage_outcome` updates (per `hair-memory-spec.md` §3)

### 3.5 Hair memory system

Full spec: **`hair-memory-spec.md`** (in this package). Summary: distilled per-user memory doc (<1,200 tokens) injected into every prompt + append-only timeline subcollection. Phase 1 (trend summary from existing analysis history — "your score went 62 → 71") ships first; it's the visible-magic moment, 2–3 days.

### 3.6 Stylist side (bridges to Pelo.hair)

- **Verified stylist profile:** license verification, public profile page (Person schema markup — feeds GEO), commission code, contribution stats, citation count
- **Earning mechanics (launch set):** product commission (15–25%, incl. reorders) + directory bookings (free at launch — don't tax before proven) + citation badge ("as cited by Cabelo AI")
- **Chairside prescription kit:** per-stylist QR (deep-link with her code pre-attached) — printable card + digital
- Later (post-proof): contribution payouts/royalties, Pro subscription tier, upsell intelligence

### 3.7 ShareScore card

Full spec + render-ready template: **`sharescore-card-spec.html`** (in this package). Summary: two variants (Glow-up for delta ≥ +8; Day 1 for journey start), HTML → PNG at 1080×1920 + 1080×1350, score ring, referral code via Shopify discount API, stylist credit on every card, QR → public crawlable score page. Explicit consent per share; photo use opt-in at capture.

### 3.8 Public/GEO layer

- Public Q&A pages from accepted stylist answers (FAQ/QAPage schema, named expert attribution)
- Stylist entity pages (Person schema)
- Public share pages behind ShareScore QRs (anonymized summary)
- Aggregated stats pages from outcome data — **minimum cohort n ≥ 50 per published stat, never user-traceable**
- robots.txt: explicitly allow GPTBot, ClaudeBot, Google-Extended, PerplexityBot, CCBot on public pages; add llms.txt
- Hard rule in code, not convention: raw KB and all user data stay private; only distilled/aggregated content crosses to public

---

## 4. Privacy requirements (non-negotiable)

1. Memory + timeline + photos: owner + admin Firestore rules only
2. Deletion cascades: account deletion removes memory doc, timeline, storage photos
3. "Reset my memory" in Settings
4. Public layer receives only aggregated (n ≥ 50) or explicitly-consented content
5. Privacy policy updated to name photo storage, purchase-history use, and memory — flag to Ralph for copy

---

## 5. Build order

**Phase 0 — Stylist Zero (this week, before any new code):** Ralph's wife runs the manual loop with her clients — voice answers, QR prescription, check-ins via existing chat. Finds the friction. No engineering dependency.

**Phase 1 — The gate enablers (~2 weeks):**
- Voice-answer intake (can be minimal: upload + transcribe + review queue)
- Per-stylist QR deep links + commission codes (Shopify discount API)
- Memory Phase 1 (trend summary injection)

**Phase 2 — The 10-stylist test runs on Phase 1.** Pass/fail thresholds below. **Hard rule: no Phase 3 work until this reads out.**

**Phase 3 — Conversion machine (~3 weeks, only after Phase 2 passes):**
- Storefront API in-app purchase + orders/paid webhook
- Protocol scheduler + check-in loop + coupons
- Memory Phases 2–4 (distillation, order context, timeline)

**Phase 4 — Amplifiers (~2–3 weeks):**
- ShareScore card render pipeline + public share pages
- Public Q&A pages + stylist entity pages + robots/llms.txt
- RAG chat over stylist corpus with citations

**Phase 5 — Paid conversion test:** $500 Meta + Prohall backwards-funnel (existing customers via email + package inserts). Measure revenue per analysis vs cost per analysis; target ≥ 2×.

---

## 6. Kill thresholds (decided now, before we start)

Written in advance so sunk costs can't move them:

- **10-stylist test:** fewer than 7 of 10 complete recordings → STOP, rework the stylist offer before building Phase 3
- **Prescription scan rate:** if chairside QR scan→signup is negligible across the test stylists → rework the chairside moment, don't build past it
- **Blind quality test:** 20 consumers compare KB answers vs ChatGPT; if KB doesn't win → corpus or RAG isn't ready, fix before public layer
- **Phase 5:** revenue per analysis < 1× cost after tuning → freeze Cabelo at maintenance, fold analysis into Prohall PDP/chatbot, full focus to Pelo.hair

## 7. Explicitly NOT building yet

In-app booking/payments for stylists · contribution royalties · Pro subscription · multi-city expansion (launch = Miami, Brazilian-community salons, post-keratin segment) · native apps beyond current scope · any feature that doesn't feed knowledge capture or conversion measurement.

---

*Architecture principle, one line: features attract, contributions retain, data defends. When in doubt, build the thing that fills the purple box.*
