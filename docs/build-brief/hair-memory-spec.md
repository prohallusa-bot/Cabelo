# Hair Memory System — Developer Spec
**For:** Sahan · **Project:** Cabelo.ai · **Status:** Ready to build
**Goal:** Give the LLM persistent, distilled, per-user memory so the coach knows the user's full hair journey — without stuffing raw chat history into every prompt.

---

## 1. The problem this solves

Today (`userContext.js` + `prompts.js`):
- Prompt gets: profile, water, weather, **latest** analysis, raw chat history.
- Raw history grows, gets truncated, and durable facts ("allergic to coconut oil", "bleaches every 3 months", "goal: waist length") silently fall out of context.
- Order data and check-in photos are not in the prompt at all.

Fix: one **distilled memory document per user**, updated by background jobs, injected into every chat/analysis prompt. Raw data stays where it is; the memory doc is the LLM-facing summary.

---

## 2. Data model

### 2.1 `users/{uid}/memory/profile` (single doc, the LLM-facing memory)

```json
{
  "version": 3,
  "updated_at": "2026-06-11T14:00:00Z",

  "hair_identity": {
    "type": "3B",
    "porosity": "high",
    "density": "medium",
    "scalp": "oily roots, dry lengths",
    "confidence": "from_analysis"
  },

  "chemical_history": [
    { "service": "keratin_treatment", "product": "Prohall Select One", "date": "2026-05-02", "source": "order+user_stated" },
    { "service": "bleach", "date": "2026-02-15", "source": "user_stated" }
  ],

  "constraints": [
    { "fact": "allergic to coconut oil", "source": "user_stated", "stated_at": "2026-03-10" },
    { "fact": "avoids sulfates", "source": "user_stated", "stated_at": "2026-03-10" }
  ],

  "goals": [
    { "goal": "waist-length growth", "stated_at": "2026-03-10", "active": true }
  ],

  "products": [
    {
      "name": "Select One Keratin Kit",
      "sku": "PRO-SO-1000",
      "first_order": "2026-05-02",
      "last_order": "2026-05-02",
      "order_count": 1,
      "usage_outcome": "positive — frizz reduced (week-4 checkin)",
      "source": "shopify_webhook"
    }
  ],

  "journey": {
    "protocol": "select_one_aftercare",
    "protocol_started": "2026-05-02",
    "current_week": 6,
    "score_history": [
      { "date": "2026-05-02", "score": 62 },
      { "date": "2026-05-30", "score": 71 }
    ],
    "trend_summary": "Improving. +9 points over 4 weeks. Dryness at ends resolving; crown frizz still present."
  },

  "session_notes": [
    "2026-06-08: asked about humidity — advised anti-humectant routine for Miami summer.",
    "2026-05-30: week-4 checkin — ends improved, crown frizz persists. Recommended 2x/week mask."
  ],

  "stylist": {
    "prescribed_by": "stylist_uid_abc",
    "stylist_name": "Maria S.",
    "commission_code": "MARIA15"
  }
}
```

Rules:
- `session_notes`: cap at **10 entries**, FIFO. One sentence each.
- `score_history`: cap at last **12** entries.
- Every fact carries `source`: `user_stated` | `from_analysis` | `shopify_webhook` | `inferred`. **Conflict rule: `user_stated` beats `inferred`; newer beats older.**
- Whole doc must serialize to **< 1,200 tokens**. If over, distillation job compresses oldest material first.

### 2.2 `users/{uid}/timeline/{entryId}` (subcollection, append-only raw record)

Every event appends one entry — this is the audit trail and the future outcome dataset:

```json
{
  "ts": "2026-05-30T18:22:00Z",
  "kind": "checkin_photo",            // analysis | checkin_photo | checkin_text | order | chat_session | protocol_event
  "photo_path": "gs://.../uid/checkin_w4.jpg",
  "ai_assessment": "Frizz reduced at ends; crown unchanged.",
  "user_words": "still smooth but my crown is poofy",
  "score": 71,
  "protocol_week": 4
}
```

Timeline is **never** injected raw into prompts. It feeds the distillation job and, later, the aggregated public stats (GEO layer).

---

## 3. Write pipeline (when memory updates)

| Trigger | Mechanism | What it writes |
|---|---|---|
| Chat session ends | Scheduled fn (every 15 min) finds sessions with new messages and `lastDistilled < lastMessage` | LLM distillation pass → updates `constraints`, `goals`, `session_notes` |
| New analysis (`analyzeHairFull` / `Quick`) | Inline, end of existing function | `hair_identity`, append `score_history`, recompute `trend_summary`, timeline entry |
| Check-in (photo or text reply to protocol push) | Inline in chat handler when `protocol_week` context present | Timeline entry + `journey` + `products[].usage_outcome` |
| Shopify order | **New**: `orders/paid` webhook → Cloud Function | `products[]`, `chemical_history` (if treatment SKU), start/advance `journey.protocol`, timeline entry |
| Profile edit | Existing `updateUserProfile` | Pass-through fields |

### 3.1 Distillation call (the only new LLM cost)

One cheap call (Gemini Flash) per active session per day:

```
System: Extract durable facts from this hair-coaching conversation.
Return ONLY JSON: { "constraints": [], "goals": [], "session_note": "one sentence",
"corrections": [] }.
A fact is durable if it will still matter in 3 months (allergies, chemical
services, product reactions, stated goals, lifestyle: swimming/heat tools).
Do NOT extract small talk or one-off questions.
User: <last session transcript>
```

Merge into memory doc with conflict rules above. Cost: fractions of a cent per user-day; only runs for users who actually chatted.

---

## 4. Prompt injection (changes to `userContext.js` / `prompts.js`)

`getUserContext()` additionally fetches `users/{uid}/memory/profile` and renders:

```
## WHAT YOU KNOW ABOUT THIS USER (from their journey — do not re-ask)
Hair: 3B, high porosity, medium density. Scalp: oily roots, dry lengths.
Chemical history: Select One keratin (May 2 2026); bleach (Feb 2026).
Never recommend: coconut oil (allergy). Avoids sulfates.
Goal: waist-length growth.
Products owned: Select One Kit (ordered May 2, week 6 of aftercare protocol).
Progress: score 62 → 71 over 4 weeks. Ends improving; crown frizz persists.
Recent: [session_notes, newest first]

Reference this naturally, like a coach who remembers — never recite it as a list.
If the user contradicts a stored fact, trust the user and acknowledge the update.
```

Ordering & budget:
- Memory block goes **after** system persona, **before** water/weather.
- Raw chat history can now be cut to the **last 10 messages** (memory carries the long-term load) → net token cost roughly flat or lower.
- Guests: no memory doc; current guest flow unchanged.

---

## 5. Privacy & data rules (hard requirements)

1. Memory doc + timeline live under `users/{uid}/` — Firestore rules: owner + admin only (match existing pattern).
2. **Nothing user-traceable ever reaches the public/GEO layer.** Public stats are computed by separate aggregation jobs with a minimum cohort size (n ≥ 50) per published stat.
3. User deletion (existing flow) must cascade: memory doc, timeline, storage photos.
4. Add "Reset my memory" in Settings → deletes memory doc, keeps account. Cheap to build, big trust signal.
5. Photos are health-adjacent data: update privacy policy to name what's stored and why (one paragraph; flag to Ralph for copy).

---

## 6. Build order

| Phase | Scope | Est. |
|---|---|---|
| 1 | Memory doc schema + injection of `hair_identity`, `score_history`, `trend_summary` from existing analysis data | 2–3 days |
| 2 | Session distillation job (`constraints`, `goals`, `session_notes`) | 2–3 days |
| 3 | Shopify `orders/paid` webhook → `products[]` + protocol start | 2 days (with the planned Shopify integration) |
| 4 | Check-in writes + timeline subcollection | 1–2 days |
| 5 | Reset-memory setting + deletion cascade | 1 day |

Phase 1 alone ("your score went 62 → 71 since starting the mask") is the visible-magic moment — ship it first.

---

## 7. Why this matters beyond UX

The memory/timeline structure **is** the proprietary outcome dataset: hair state + products used + verified photo results over time. The personalized coach and the data moat are the same tables. Build once, serves both.
