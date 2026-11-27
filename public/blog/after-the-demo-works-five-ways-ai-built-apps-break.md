# After the demo works: five checks for an AI‑built app

> Five checks to run before trusting an AI-built app with payments and customer data, illustrated with fixes from public Ruby and Rails projects.

By Andy Wang · 27 Nov 2026 · https://www.wangyaodi.com/blog/after-the-demo-works-five-ways-ai-built-apps-break

Written with AI from my open-source fixes and AI & codebase audit framework. See "How this post was made" at the end.

This is the Markdown copy of the post, for AI tools and agents. The web page has the diagrams and charts; here each one is described in words.

---

A checkout demo ends when the order confirmation appears. The payment provider still has a webhook to deliver, the app has access to provision, and a worker can stop between those two steps. I start a production review by following that order one step further.

I chose five checks from bugs I fixed in public Ruby and Rails projects. They apply to apps built with AI coding tools as well. The pull requests document specific failures and fixes. They do not tell us how the original code was written or how often these failures occur.

**In short:** Try a duplicate delivery, a second account, a cancelled request, an unexpected input, and a tool that reports failure. Start with the flow whose failure would cost a user money or access.

- 5 production checks
- 4 steps to build a minimum safety net without rewriting
- 3 options: rescue, monthly care, or a planned rewrite
- 7 public projects represented

If you only have a minute, this image is the whole post:

![Summary of the post. After the demo works: five checks for an AI-built app. Five failure points: 1, Webhooks, payments and jobs without idempotency (duplicates run twice). 2, Auth and tenant isolation enforced only in the UI or prompt (missing server checks). 3, External APIs and AI calls without timeouts, cancellation or tenant isolation. 4, Dependency drift, edge inputs like NaN/Infinity, and fragile deploys. 5, Swallowed errors and missing regression tests so every fix risks breaking something else. Four-step minimum safety net: wrap the 3 paths that matter in tests, wire real error tracking, add idempotency and timeouts around external calls, then schedule small updates and review the error log. The decision table covers repair, maintenance, and replacement.](https://www.wangyaodi.com/assets/blog/after-the-demo-works-five-ways-ai-built-apps-break/summary.jpg)

*The post in one image. [Open it full size](https://www.wangyaodi.com/assets/blog/after-the-demo-works-five-ways-ai-built-apps-break/summary.jpg) to save or share it.*

## Why a passing demo hides five specific faults

Take an order that should grant one month of access. A passing demo shows that one payment can create an entitlement. Deliver the same event twice to a test handler, then count entitlements and queued notifications. Checking only for a successful HTTP response misses both duplicates.

**In short:** Demos test one user, one click, and one clean network response. All five production faults sit right outside that happy path.

> **Figure 1. Five places to inspect. The PR numbers give a worked example in each area.**
>
> Five production checks for an AI-built app.
>
> Five review areas group examples from public pull requests. 1, Webhooks and jobs: duplicate deliveries run twice. 2, Auth and tenant checks: hidden in UI or prompt instead of enforced on the server. 3, External APIs and AI calls: no timeout, cancellation, or route isolation. 4, Inputs and dependencies: edge values and overdue upgrades break deploys. 5, Tests and error tracking: silent rescues hide failures and fixes cause regressions.

## 1. Webhooks, payments, and background jobs have no idempotency

[Stripe documents duplicate webhook deliveries](https://docs.stripe.com/webhooks#handle-duplicate-events). Queue redelivery depends on the adapter and its retry policy. If your handler checks `if order.pending?` in memory and then charges, mails, or provisions access, two overlapping deliveries both pass the check. Even OAuth callbacks suffer from this: in [Chatwoot #16699](https://github.com/chatwoot/chatwoot/pull/16699), consuming an OAuth callback state had to be made atomic so a replayed callback couldn't reuse it.

**In short:** Payment webhooks, OAuth callbacks, and queued jobs arrive more than once. Without a duplicate guard, repeated deliveries can send emails twice, bill LLM calls twice, or corrupt state.

[Lewsnetter #61](https://github.com/bborn/lewsnetter/pull/61) moved a campaign’s eligibility check and transition to sending under one row lock. [ActiveAgent #664](https://github.com/activeagents/activeagent/pull/664) claims a pending run with one conditional update. In each case, overlapping deliveries get one winner. If the winner dies after an external service acts, its local claim cannot tell a successor what happened. Persist an operation ID, reuse it where the provider supports idempotency, and reconcile an unknown outcome before retrying.

> **Figure 2. Two overlapping deliveries, one local claim. A remote operation with an unknown outcome still needs reconciliation.**
>
> Duplicate webhook or job delivery without versus with an atomic claim.
>
> Top row, without idempotency: Stripe or the queue sends event evt_123 twice; both handlers read status pending and both provision or mail the customer. Bottom row, with an idempotency key or conditional update: the first write inserts the unique event key or updates status from pending to processing and wins the claim. The second finds the key present or updates zero rows and skips the claimed work.

## 2. Auth, tenant isolation, and tool permissions live in the wrong layer

In a demo built for one founder account, hiding a Delete button in React or writing "always ask the user before deleting" in a system prompt looks like it works. With real customers, every security check has to live on the server, scoped to the authenticated account or team.

**In short:** Never trust hidden buttons or system prompts for security. Enforce tenant scoping, OAuth scopes, file path boundaries, and destructive-action approvals on the server.

Even well-maintained open-source apps miss these boundaries until someone probes them:

- **Unchecked token scopes:** In [Lewsnetter #35](https://github.com/bborn/lewsnetter/pull/35), OAuth consent advertised `mcp:read` as read-only, while the middleware let read-only tokens call destructive tools until explicit `read_only` opt-ins were enforced before execution.
- **Prompt-only guardrails:** In [Lewsnetter #53](https://github.com/bborn/lewsnetter/pull/53), destructive agent tools needed server-side `requires_approval` pauses because untrusted text inside tool results can steer a model past a system prompt.
- **Missing tenant scoping on child records:** In [Lewsnetter #97](https://github.com/bborn/lewsnetter/pull/97), events created under a subscriber were missing the subscriber's `team` association. Authorization denied a legitimate creation: the API returned 404 and the account form redirected. The fix assigns the subscriber’s team before authorization.
- **File-store boundary:** In [RubyLLM #1677](https://github.com/crmne/ruby_llm/pull/1677), chat-store paths needed to refuse symlinks pointing to folders inside the store boundary.

> **What it taught me:** When reviewing an AI-built app, ignore the UI first. Open every controller, API route, and tool handler and ask: "What stops user A from reading or mutating user B's ID?"

## 3. External calls can keep retrying after cancellation

For each external call, find the timeout, the retry policy, and the point at which cancellation takes effect. If callers share a failure cache, find which connection settings identify a route.

**In short:** Every outside HTTP or LLM call needs an explicit timeout, a cancellation check before retrying, clean error handling when credentials disappear, and tenant-isolated outage keys.

Four public fixes show why those details matter.

- **A shared outage key:** In [RubyLLM #1577](https://github.com/crmne/ruby_llm/pull/1577), outage backoff was keyed only on the server URL, so a failed proxy route could hide tools from a healthy direct connection to the same URL in the same process.
- **Cancelled work keeps retrying:** In [RubyLLM #1729](https://github.com/crmne/ruby_llm/pull/1729), GET and DELETE requests kept retrying after the user had already cancelled the chat; in [MCP Ruby SDK #709](https://github.com/modelcontextprotocol/ruby-sdk/pull/709), a terminated session had to cancel in-flight requests before closing streams.
- **Missing credentials crash instead of returning 401:** In [RubyLLM #1578](https://github.com/crmne/ruby_llm/pull/1578), a job whose user disconnected threw an uncaught `NoMethodError` instead of a typed `UnauthorizedError` the app knew how to handle.
- **Operational check:** Count provider attempts per logical user request so retries appear in usage reports.

## 4. Dependencies drift, edge inputs slip through, and deploys turn stressful

An upgrade and an input check solve different problems. [Lewsnetter #55](https://github.com/bborn/lewsnetter/pull/55) updated Puma for seven advisories. In [Rails #59853](https://github.com/rails/rails/pull/59853), an odd/even validation raised an exception on a non-finite value. [Chatwoot #16718](https://github.com/chatwoot/chatwoot/pull/16718) and [RubyLLM #1697](https://github.com/crmne/ruby_llm/pull/1697) rejected non-finite numbers before they reached JSON serialization.

**In short:** Apps rot even when you stop editing them. Packages accrue CVEs, providers change APIs, and weird real-world inputs break unvalidated assumptions—so updates feel scary whenever there are no automated checks.

For an import, check the meaning of the accepted value. In [Sure #5690](https://github.com/we-promise/sure/pull/5690), the sample Mint CSV’s debit of `-8.55` became income. A regression test can assert the direction and amount of the saved transaction even when the import itself reports success.

## 5. Error reporting can miss a failed tool call

A tool can return an error in an otherwise successful response. If the caller treats an empty result as success, the UI and the error tracker can both miss the failure. Test the outcome the user sees and the signal the operator gets.

**In short:** Broad `rescue`/`catch` blocks hide real failures, and missing regression tests mean every change can introduce a regression.

In [ActiveAgent #665](https://github.com/activeagents/activeagent/pull/665), the evaluation trace omitted client-side MCP calls. An assertion could report a missing call even when the tool had run. The fix also records a tool’s `isError` response, so the trace distinguishes a failed call from a successful one.

## Don't rewrite it: build the smallest safety net first

Before replacing a working app, pick a broken user task, reproduce it, and record an observable outcome. A bounded repair gives you evidence for the larger decision.

**In short:** Start with a bounded repair. Keep what works, wrap the top three revenue/trust paths in tests, wire up error tracking, harden external boundaries, and review monthly.

> **Figure 3. The smallest safety net that turns a fragile AI-built app into something you can update without holding your breath.**
>
> Four-step minimum safety net for stabilizing an AI-built app without rewriting.
>
> Four sequential steps. Step 1, Wrap 3 critical paths in tests: sign-up, payment or checkout, and the core user task. Step 2, Turn on real error tracking: remove silent catches and clear existing noise so new errors stand out. Step 3, Harden external boundaries: add idempotency keys, explicit timeouts, and server-side auth checks. Step 4, Establish a calm monthly rhythm: small tested dependency updates, log reviews, and plain-English release notes.

For checkout, one useful assertion is “one paid order, one entitlement” after two deliveries. For a failed AI request, assert that the user gets a retryable status and the operator can find the failure by request ID.

## Rescue, monthly care, or a rewrite?

If you are trying to decide what kind of help your app actually needs, use this table before committing to anything bigger:

**In short:** Use rescue when specific flows are broken or unfinished; use monthly care once the app is stable; only plan a rewrite when the underlying data model or stack genuinely blocks the business.

| Situation | Right move | What "done" looks like |
|---|---|---|
| Sign-up, checkout, webhooks, or an AI feature are actively broken or half-finished | **Rescue** (fixed scope) | Agreed bugs fixed in your repo, regression tests around each fix, and a plain-English handover of what changed and what's still risky |
| The app works for real users, but updates feel risky and small bugs pile up | **Monthly care** | Tested package updates, regular error-tracker reviews, prioritized bug fixes, and a short monthly note on what changed |
| The core data model cannot support multi-tenancy or compliance, or the prototype was built on throwaway mock storage | **Planned rewrite** (separate project) | An explicit scope and migration plan, keeping the old app running while real users move over safely |

The same questions guide my [codebase reviews](https://www.wangyaodi.com/ai-audits) and [Rails maintenance work](https://www.wangyaodi.com/rails-maintenance).

## Limits worth knowing

**In short:** This checklist covers the selected failure modes from fixes in public Rails and AI codebases; it is not a full penetration test, legal compliance audit, or substitute for a staged deploy environment.

- **Examples are from public open-source fixes, not private client stories:** Every linked pull request above is my own public work across RubyLLM, ActiveAgent, Lewsnetter, MCP Ruby SDK, Chatwoot, Sure, and Rails. I don't publish unnamed or invented client case studies.
- **Tests prove only what they cover:** A small safety net around sign-up, billing, and the core workflow catches the expensive regressions fast—it doesn't guarantee zero bugs elsewhere.
- **Stack fit matters:** Ruby on Rails is where I am deepest. For apps built in other stacks, an honest first look should always tell you up front whether a specialist in that stack is a better fit.

## Read this with an AI

You can hand this checklist straight to Cursor, Claude Code, or Codex inside your own repository. A plain Markdown copy lives at [`/blog/after-the-demo-works-five-ways-ai-built-apps-break.md`](https://www.wangyaodi.com/blog/after-the-demo-works-five-ways-ai-built-apps-break.md).

**In short:** A Markdown copy of this post lives at [`/blog/after-the-demo-works-five-ways-ai-built-apps-break.md`](https://www.wangyaodi.com/blog/after-the-demo-works-five-ways-ai-built-apps-break.md). The full post has prompts you can paste straight into Cursor or Claude Code.

Or paste one of these prompts into your coding agent:

**Pre-launch health check**

```text
Read https://www.wangyaodi.com/blog/after-the-demo-works-five-ways-ai-built-apps-break.md and audit this repository against its five failure modes: (1) webhooks, payments and jobs without idempotency, (2) missing server-side auth or tenant scoping, (3) external API and LLM calls without explicit timeouts or error handling, (4) unvalidated edge inputs and outdated dependencies, and (5) broad catch/rescue blocks that swallow errors. Report only findings backed by exact file paths and line numbers, ranked by user impact.
```

**Build the minimum safety net**

```text
Read https://www.wangyaodi.com/blog/after-the-demo-works-five-ways-ai-built-apps-break.md, then propose the smallest set of 3–5 integration tests that would protect our sign-up, payment/webhook, and core user flow from regressions. Show what each test verifies and which exact files it exercises before writing any code.
```

**Rescue vs. care vs. rewrite**

```text
Read https://www.wangyaodi.com/blog/after-the-demo-works-five-ways-ai-built-apps-break.md. Inspect this codebase's schema, auth, deploy setup, and test suite, and give me a blunt assessment: what can be kept as-is, what needs a bounded rescue first, and whether anything genuinely justifies a rewrite.
```

## How this post was made

I wrote this post with AI, and every post here says how it was made:

- **Sources:** My [AI & codebase audits](https://www.wangyaodi.com/ai-audits) service framework and my merged public pull requests across RubyLLM, ActiveAgent, Lewsnetter, MCP Ruby SDK, Chatwoot, Sure, and Rails, listed under [References](#references).
- **Draft:** The article text, inline SVG diagrams, decision table, and share cards, drafted with Antigravity from those sources.
- **Checks:** Codex compared the examples with the original GitHub PRs and checked Stripe’s delivery guidance on 27 November 2026.
- **Review:** Reviewed and approved for publication by Andy Wang.

If you find a mistake, tell me on X and I'll fix it here.

## References

**In short:** Every bug example links to a real merged pull request on GitHub, alongside the [AI & codebase audits](https://www.wangyaodi.com/ai-audits) and [open-source](https://www.wangyaodi.com/oss) pages.

Public merged pull requests referenced in this post:

- [chatwoot/chatwoot#16699](https://github.com/chatwoot/chatwoot/pull/16699) Consume OAuth callback state atomically
- [bborn/lewsnetter#61](https://github.com/bborn/lewsnetter/pull/61) Claim campaigns before starting a send
- [activeagents/activeagent#664](https://github.com/activeagents/activeagent/pull/664) Claim a pending run before executing it
- [bborn/lewsnetter#35](https://github.com/bborn/lewsnetter/pull/35) Keep `mcp:read` tokens to read-only tools
- [bborn/lewsnetter#53](https://github.com/bborn/lewsnetter/pull/53) Ask before deletes and sequence activation
- [bborn/lewsnetter#97](https://github.com/bborn/lewsnetter/pull/97) Give events created under a subscriber its team
- [crmne/ruby_llm#1677](https://github.com/crmne/ruby_llm/pull/1677) Refuse chat-store paths through links to folders inside the store
- [crmne/ruby_llm#1577](https://github.com/crmne/ruby_llm/pull/1577) Key MCP outages on the context's connection settings
- [crmne/ruby_llm#1729](https://github.com/crmne/ruby_llm/pull/1729) Stop retrying a GET or DELETE once its chat is cancelled
- [modelcontextprotocol/ruby-sdk#709](https://github.com/modelcontextprotocol/ruby-sdk/pull/709) Cancel a terminated session's requests before closing its streams
- [crmne/ruby_llm#1578](https://github.com/crmne/ruby_llm/pull/1578) Send no MCP token once forgotten credentials expire
- [bborn/lewsnetter#55](https://github.com/bborn/lewsnetter/pull/55) Update Puma 8.0.3 for seven new advisories
- [rails/rails#59853](https://github.com/rails/rails/pull/59853) Fix numericality parity checks raising for non-finite values
- [chatwoot/chatwoot#16718](https://github.com/chatwoot/chatwoot/pull/16718) Reject non-finite Captain fixed numbers
- [crmne/ruby_llm#1697](https://github.com/crmne/ruby_llm/pull/1697) Reject non-finite answers to numeric questions
- [we-promise/sure#5690](https://github.com/we-promise/sure/pull/5690) Read Mint amounts as magnitudes in Mint imports
- [activeagents/activeagent#665](https://github.com/activeagents/activeagent/pull/665) Record client-side MCP tool calls in eval replays

Related pages on this site:

- [AI & codebase audits](https://www.wangyaodi.com/ai-audits): audits, AI & MCP architecture reviews, and production hardening
- [Rails maintenance](https://www.wangyaodi.com/rails-maintenance): for established Rails SaaS applications
- [Open-source record](https://www.wangyaodi.com/oss): all 147 merged upstream pull requests

---

Discuss this post on X: reply to [the thread](https://x.com/yorzi/status/2126234984105308423)
