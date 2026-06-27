# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into **How You Doin'** — a Friends-themed daily journaling app. The integration covers the full user lifecycle: authentication, onboarding, daily check-ins, AI companion chat, and Stripe-powered monetisation.

Key files created or modified:

- **`instrumentation-client.ts`** — bootstraps PostHog on the client side using Next.js 15.3+ native instrumentation (no provider required)
- **`lib/posthog-server.ts`** — singleton server-side PostHog client for API routes
- **`next.config.js`** — added `/ingest/*` reverse-proxy rewrites so events don't get blocked by ad blockers
- **`.env.local`** — `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` set

---

## Events instrumented

| Event name | Description | File |
|---|---|---|
| `login_started` | User clicks the Google sign-in button on the login page. | `app/login/page.tsx` |
| `demo_mode_started` | User clicks the demo mode button to explore the app without signing in. | `app/login/page.tsx` |
| `user_signed_in` | Google OAuth callback completes; user identity resolved. | `app/auth/callback/page.tsx` |
| `onboarding_completed` | User submits their name and completes the onboarding step. | `app/onboarding/page.tsx` |
| `energy_selected` | User selects a Friends character energy card on the daily check-in page. | `app/page.tsx` |
| `journal_entry_saved` | User saves their daily journal entry with energy and optional note. | `app/page.tsx` |
| `photo_uploaded` | User uploads a photo to attach to their journal entry. | `app/page.tsx` |
| `companion_chat_opened` | User opens the companion chat panel from the main check-in page. | `app/page.tsx` |
| `companion_message_sent` | User sends a message to an AI companion in the chat panel. | `components/JoeyChat.tsx` |
| `companion_switched` | User switches from one companion to another inside the chat panel. | `components/JoeyChat.tsx` |
| `subscription_checkout_started` | User initiates the monthly subscription checkout flow. | `components/CompanionUnlockCard.tsx`, `app/settings/page.tsx` |
| `companion_unlock_checkout_started` | User initiates a one-time checkout to unlock an individual companion. | `components/CompanionUnlockCard.tsx` |
| `subscription_completed` | Stripe webhook confirms a subscription payment was successfully completed. | `app/api/stripe/webhook/route.ts` |
| `companion_unlocked` | Stripe webhook confirms a one-time companion unlock payment was completed. | `app/api/stripe/webhook/route.ts` |
| `subscription_canceled` | Stripe webhook confirms a user's subscription has been canceled. | `app/api/stripe/webhook/route.ts` |
| `user_signed_out` | User signs out from the settings page. | `app/settings/page.tsx` |

---

## Next steps

We've built a dashboard and five insights to keep an eye on user behaviour:

- **Dashboard**: [Analytics basics (wizard)](https://eu.posthog.com/project/211167/dashboard/778288)
- [Daily active journalers](https://eu.posthog.com/project/211167/insights/4XG8mQgB) — unique users saving journal entries each day
- [Onboarding funnel steps](https://eu.posthog.com/project/211167/insights/kVFygS7z) — login → onboarding → first journal entry
- [Companion chat engagement](https://eu.posthog.com/project/211167/insights/DnjDGlzr) — messages sent and companion switches per day
- [Revenue conversion](https://eu.posthog.com/project/211167/insights/w02rZhUg) — checkout started vs payment confirmed for subscriptions and unlocks
- [Subscription churn](https://eu.posthog.com/project/211167/insights/c0GCOkPF) — cancellations over the past 90 days

---

## Verify before merging

- [ ] Run a full production build (`npm run build`) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` to `.env.example` and any monorepo/bootstrap scripts so collaborators know what to set.
- [ ] Wire source-map upload (`posthog-cli sourcemap` or your bundler's upload step) into CI so production stack traces de-minify.
- [ ] Confirm the returning-visitor path also calls `identify` — the current implementation identifies on fresh Google OAuth sign-in via `/auth/callback`; a returning user whose session is already active will not re-run through that page. Consider calling `posthog.identify()` on the main page's `init()` when a valid Supabase session is found.

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
