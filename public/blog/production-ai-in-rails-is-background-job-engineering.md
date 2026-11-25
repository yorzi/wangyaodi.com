# Production AI in Rails is mostly background‑job engineering

> What 12 merged pull requests across ActiveAgent and Lewsnetter taught me about atomic claims, expiring leases, server-side tool approvals, and replayable evals.

By Andy Wang · 25 Nov 2026 · https://www.wangyaodi.com/blog/production-ai-in-rails-is-background-job-engineering

Written with AI from my own merged pull requests, checked against GitHub. See "How this post was made" at the end.

This is the Markdown copy of the post, for AI tools and agents. The web page has the diagrams and charts; here each one is described in words.

---

Most demos of AI in Ruby on Rails fail in a boring way once real traffic arrives. It is rarely the prompt. It is a queue that delivers a job twice, a worker that holds a stale record, a scheduled job whose conditions changed while it sat in the queue, or an agent whose only guardrail against deleting customer data was a sentence in the system prompt.

Between late October and late November 2026 I had 60 pull requests merged across two open-source Rails codebases: [ActiveAgent](https://github.com/activeagents/activeagent), a Rails framework for building and evaluating AI agents, and [Lewsnetter](https://github.com/bborn/lewsnetter), a Rails newsletter and email-marketing app with an in-app AI agent and an MCP server. Twelve of those pull requests—six in each repository—all attack the same underlying problem: making asynchronous, tool-calling AI workflows behave predictably when queues redeliver, users click cancel, and models improvise.

**In short:** Twelve merged pull requests across ActiveAgent (6) and Lewsnetter (6). Almost every failure was classic Rails background-job and authorization engineering made costlier by LLM calls and side-effecting tools: atomic state claims, expiring leases, revalidation at claim time, server-side tool guardrails, and complete eval capture.

- 12 merged PRs across 2 Rails + AI repos
- 6 + 6 ActiveAgent and Lewsnetter, Oct–Nov 2026
- 4 layers: claims, leases, guardrails, evals
- 854 lines of code, against 2,170 of tests and docs

If you only have a minute, this image is the whole post:

![Summary of the post. Production AI in Rails is mostly background-job engineering: 12 merged pull requests across ActiveAgent and Lewsnetter. Atomic claims (ActiveAgent #664, #672, #713; Lewsnetter #61): replace read-then-write checks with one conditional UPDATE or row lock so duplicate deliveries cannot run twice or overwrite finished runs. Expiring leases (ActiveAgent #614, #715): take a 30-minute ownership token before calling a provider, fence writes on that token, and re-enqueue losers for expiry without holding a DB lock across network I/O. Revalidate and scope (Lewsnetter #80, #82): re-check scheduling intent at claim time and scope historical queries to the current enrollment. Guardrails and evals (Lewsnetter #35, #53, #54; ActiveAgent #665): enforce OAuth mcp:read scopes, server-side requires_approval, MCP annotations, and observe client-side MCP tool calls in eval replays. 854 lines of code against 2,170 lines of tests and docs.](https://www.wangyaodi.com/assets/blog/production-ai-in-rails-is-background-job-engineering/summary.jpg)

*The post in one image. [Open it full size](https://www.wangyaodi.com/assets/blog/production-ai-in-rails-is-background-job-engineering/summary.jpg) to save or share it.*

## Why AI amplifies ordinary Rails job bugs

Every Rails developer knows that queues are at-least-once. Solid Queue, Sidekiq, and SQS all redeliver a job when a worker restarts, times out, or drops its heartbeat. When an ordinary job runs twice, you might recompute a counter or send a duplicate notification. When an AI workflow job runs twice, it pays for a second model generation, fires the agent's tools a second time, or corrupts an evaluation run's score.

The twelve fixes sit across four places where a Rails app hands work between a user, a queue, a database, and a language model:

**In short:** Queues deliver jobs more than once, and LLM calls are slow and side-effecting. The 12 PRs guard four boundaries: atomic state claims, expiring leases for slow provider calls, claim-time revalidation and scoping, and server-side tool guardrails plus eval capture.

> **Figure 1. Where the twelve pull requests sit across ActiveAgent and Lewsnetter.**
>
> Four reliability boundaries in a Rails and AI application, and where each pull request landed.
>
> Work flows left to right across four boundaries. 1, Claim state atomically: ActiveAgent 664, 672, 713 and Lewsnetter 61. 2, Lease slow provider calls without holding a DB lock: ActiveAgent 614 and 715. 3, Revalidate at run time and scope queries to the current run: Lewsnetter 80 and 82. 4, Enforce tool permissions, approvals, and eval capture on the server: Lewsnetter 35, 53, 54 and ActiveAgent 665.

## Claim state atomically, never check-then-act (ActiveAgent #664 · #672 · #713 · Lewsnetter #61)

The single most common concurrency bug in Rails jobs looks harmless in code review:

```ruby
run = AgentRun.find(run_id)
return if run.finished? || run.awaiting_input?
run.update!(status: :running, started_at: Time.current)
```

Before [ActiveAgent #664](https://github.com/activeagents/activeagent/pull/664), that was `AgentExecutionJob#perform`. It had two gaps. First, it checked in Ruby and wrote in SQL as two separate steps: two workers that both loaded the run while it was `pending` both passed the check and started a generation. Second, it only rejected finished and paused runs, so a duplicate delivery arriving while the run was already `running` started a second provider call and overwrote `started_at`.

**In short:** Checking `run.pending?` in Ruby and then calling `update!` lets two workers pass the check and run the agent twice. Replace check-then-act with one conditional `UPDATE ... WHERE id = ? AND status = pending` so the database decides at the write, on Postgres, MySQL and SQLite alike.

> **Figure 2. Moving the status predicate into the write itself removes the check-then-act window and holds no lock while the model runs.**
>
> Check-then-act race versus one conditional UPDATE in ActiveAgent #664.
>
> Left side, before #664: Worker A and Worker B both read status pending, both pass the Ruby check, both write running, and both call the LLM provider and tools. Right side, after #664: Worker A runs UPDATE agent_runs SET status = running WHERE id = ? AND status = pending and gets 1 row changed, so it executes. Worker B runs the same UPDATE, gets 0 rows changed, and returns before calling any provider.

The fix moves the predicate into a single SQL statement:

```ruby
def claim_pending(run)
  now = Time.current
  claimed = AgentRun.where(id: run.id, status: AgentRun.statuses[:pending])
    .update_all(status: AgentRun.statuses[:running], started_at: now, updated_at: now)
  return false if claimed.zero?

  run.reload
  run.broadcast_update
  true
end
```

There is a subtle Rails-on-SQLite lesson buried inside #664. My first commit on that branch used `run.with_lock` instead of a conditional `update_all`. CI on the `rails7.gemfile` matrix caught why that wasn't good enough: SQLite under Rails 7.2 opens deferred transactions, so when two workers overlap inside `with_lock`, the loser's write after its read is refused once the winner commits, raising `SQLite3::BusyException` instead of quietly declining. A single conditional `UPDATE` works cleanly on Postgres, MySQL, and SQLite, and holds no transaction open while the LLM runs. Because `update_all` skips Active Record callbacks, the helper reloads the row and calls `broadcast_update` explicitly.

Once you spot check-then-act in one place, look for its siblings. The exact same pattern turned up three more times:

- **Cancellation ([ActiveAgent #672](https://github.com/activeagents/activeagent/pull/672)):** `AgentRun#cancel!` checked its in-memory copy and wrote `cancelled` unconditionally. If the worker finished between the controller's load and the write, a completed run became `cancelled` while keeping its output, and a failed run's real error was overwritten with `"Cancelled by user"`. Moving the guard into `where(id: id, status: CANCELLABLE_STATUSES).update_all(...)` inside the same transaction as cancelling pending input requests closed the reverse race.
- **Evaluation runs ([ActiveAgent #713](https://github.com/activeagents/activeagent/pull/713)):** `EvaluationRunJob` checked `run.pending?` while `ScenarioEvaluationRunner#call` wrote `running` later. A duplicate delivery replayed the entire eval suite—or fanned out a second copy of every child job. Moving a conditional `claim!` to the top of `ScenarioEvaluationRunner#call` covered every caller and also fixed a second bug where an error resolving scenario selection left the run stuck in `pending` forever.
- **Campaign sends ([Lewsnetter #61](https://github.com/bborn/lewsnetter/pull/61)):** `SendCampaignJob` checked `campaign.status.in?(%w[draft scheduled])` and then updated to `sending`. Two workers that read `draft` before either wrote `sending` both mailed the audience. Wrapping the check and status update in `claim_campaign` (releasing the lock before the audience query and SES calls) stopped the double send.

> **What it taught me:** Put the precondition in the write itself. A status check in Ruby only tells you what the row looked like a millisecond ago; a conditional `UPDATE` or short row lock decides ownership without ever holding a database lock across an HTTP call.

## Lease slow provider calls without holding a DB lock (ActiveAgent #614 · #715)

A status transition from `pending` to `running` solves the start of a job. What about a job that sits in `pending` while calling an external LLM judge, or a fanned-out replay whose result row does not even exist until the agent answers?

In [ActiveAgent #614](https://github.com/activeagents/activeagent/pull/614), scenario evaluation fan-out already tried to guard `EvaluationJudgeJob` with a timestamp comparison: `where(id: row.id, status: :pending, updated_at: row.updated_at).update_all(updated_at: Time.current)`. That only rejected a *stale* reader. A duplicate judge delivery that arrived after the first worker bumped `updated_at` read the fresh timestamp, bumped it again, and scored the same result a second time.

**In short:** A timestamp check only rejects stale readers; a fresh duplicate still runs the LLM twice. Add an expiring ownership token (30-minute lease), release the DB immediately before calling the provider, fence result writes on that token, and re-enqueue losers with `wait_until: expires_at` so a dead worker is still recovered.

> **Figure 3. Ownership token + expiry + fenced write handles both duplicate deliveries and dead workers.**
>
> Expiring lease with fenced writes and wait_until retry in ActiveAgent #614 and #715.
>
> Worker A writes a UUID token and a 30-minute expiry to the row, releases the database, and calls the LLM provider. While A is running, a duplicate delivery Worker B tries to claim, sees a live lease, and re-enqueues itself with wait_until set to the expiry time. When Worker A finishes, it writes the score only WHERE scoring_token matches its own token and clears the lease. If Worker A had crashed instead, Worker B wakes up after the expiry, reclaims with a new token, and any late write from A is rejected by the token fence.

The fix adds two nullable columns—`scoring_token` and `scoring_expires_at`—and three short methods:

```ruby
def claim_result!(row)
  now = Time.current
  claim = EvaluationScenarioResult.where(id: row.id, status: :pending, updated_at: row.updated_at)
  return claim.update_all(updated_at: now) == 1 unless scoring_leases?

  token = SecureRandom.uuid
  claimed = claim.where("scoring_token IS NULL OR scoring_expires_at <= ?", now)
    .update_all(scoring_token: token, scoring_expires_at: now + JUDGE_LEASE_DURATION, updated_at: now)
  @scoring_token = token if claimed == 1
end

def store_claimed_result!(row, **attributes)
  return row.update!(attributes) unless scoring_leases?

  row.assign_attributes(attributes)
  row.validate!
  EvaluationScenarioResult.where(id: row.id, status: :pending, scoring_token: @scoring_token)
    .update_all(attributes.merge(scoring_token: nil, scoring_expires_at: nil, updated_at: Time.current))
end
```

Notice two practical details that matter in real apps. First, **both successes and failures are fenced**: if a slow worker wakes up after its lease expired and fails, `fail_judging!` calls the same `store_claimed_result!` so it cannot overwrite the successor's good score with an error. Second, **rolling upgrades stay safe**: `scoring_leases?` checks whether migration 030's columns exist, so a host that upgrades the gem before migrating keeps scoring with the old timestamp check instead of crashing every judge job.

Two weeks later, [ActiveAgent #715](https://github.com/activeagents/activeagent/pull/715) applied the same lease design one step earlier, to `EvaluationReplayJob` itself. There, the result row doesn't exist until the agent finishes, so the lease lives in the run's existing fan-out JSON bookkeeping (`scores["_fan_out"]["replays"]`)—requiring no migration at all—and `fail_result!` only marks a pair errored if this runner actually owns it.

> **What it taught me:** Never hold a database lock across an LLM call, and never leave a failure handler unfenced. A lease token with an expiry separates "who may run" from "how long the network call takes", and fencing both success and error writes stops a zombie worker from corrupting a healthy retry.

## Revalidate intent at claim time, and scope history to the current run (Lewsnetter #80 · #82)

A background job does not execute the moment it is enqueued. Between dispatch and execution, users change their minds: they postpone a scheduled campaign, cancel it back to draft, or remove its target segment.

In [Lewsnetter #80](https://github.com/bborn/lewsnetter/pull/80), `ScheduledCampaignDispatchJob` checked that a campaign was due and had a valid audience, then enqueued `SendCampaignJob`. Once the job ran, it only checked `campaign.sendable?`—which is true for both `draft` and `scheduled` campaigns regardless of `scheduled_for`. So a queued scheduler job could send a campaign the user had just postponed or pulled back to draft.

**In short:** What was true when a job was enqueued may be false when a worker claims it. Carry intent on the job (`from_scheduler: true`) and re-check all scheduling preconditions under the claim lock (#80); when querying past events, scope them to the current run's timestamp (#82).

The fix was small and explicit: the dispatcher now passes `from_scheduler: true`, and inside the existing claim lock `SendCampaignJob` re-checks the full scheduling contract:

```ruby
def scheduler_sendable?(campaign)
  return false unless campaign.scheduled?
  return false if campaign.scheduled_for.blank? || campaign.scheduled_for > Time.current
  return false if campaign.segment_id.nil? && !campaign.all_subscribers_confirmed?

  true
end
```

Manual "Send now" clicks and resumes don't pass `from_scheduler: true`, so they keep working as before. Jobs already sitting in the queue during a deploy default to `false` and stay backward compatible.

[Lewsnetter #82](https://github.com/bborn/lewsnetter/pull/82) caught the mirror image of stale state: looking backwards without a boundary. An automated email sequence checked whether a subscriber had clicked a step's link by querying `ClickEvent` joined to `deliveries` by `campaign_id` and `subscriber_id`. If that subscriber ever re-entered the sequence, a click from their *previous* enrollment matched immediately and exited the new enrollment before step 2 ever went out. The fix was two lines—adding `.where("deliveries.created_at >= ?", since)`—anchored to the timestamp stamped right before the current enrollment's delivery was created.

> **What it taught me:** Enqueue-time checks are an optimization, not a guarantee. Re-check the caller's intent under the claim lock, and scope every historical lookup to the current run or enrollment—never across "all time for this user".

## Put tool permissions and approvals on the server (Lewsnetter #35 · #53 · #54)

When a Rails app gives an AI agent tools—whether through an in-app chat or an external MCP server—prompts are not a security boundary. Tool results carry text written by outsiders (subscriber names, email subjects, web pages), so any rule that lives only in the system prompt can be talked past.

Three pull requests in Lewsnetter built a three-layer server-side boundary around its 47 MCP tools:

**In short:** Never rely on a system prompt to prevent destructive tool calls. Enforce OAuth `mcp:read` scopes before execution (#35), pause destructive in-app agent calls on the server for explicit human approval (#53), and publish MCP `readOnlyHint`/`destructiveHint` annotations for external hosts (#54).

> **Figure 4. Declaring read-only, destructive, ability, and approval rules on the tool class keeps OAuth scopes, UI approvals, and MCP hints in sync.**
>
> Three server-side guardrails for AI tools in Lewsnetter #35, #53 and #54.
>
> Two callers reach the same 47 MCP tool classes. Path 1, External MCP client (Claude Desktop, Cursor): sees readOnlyHint and destructiveHint from tools/list (#54), then hits Mcp::DoorkeeperAuth and Mcp::Tool::Context#may_call? (#35), which rejects non-read_only tools on mcp:read tokens with JSON-RPC Unauthorized before the tool runs. Path 2, In-app AI agent: hits Chats::ToolAdapter#requires_approval? (#53); destructive deletes and sequence activation pause the turn and broadcast an Approve or Decline card with a plain-English record summary, and the tool only executes after approval and ability checks.

1. **Fail closed on OAuth scopes ([Lewsnetter #35](https://github.com/bborn/lewsnetter/pull/35)):** The OAuth consent screen promised that `mcp:read` could only read team data, but the middleware didn't enforce scopes yet, so a read-only token could call `campaigns_delete` or `campaigns_send_now`. Now read-only tools opt in with `read_only` (24 of 47 tools); every other tool—and every future tool by default—requires write access, and FastMcp's `authorize` hook refuses disallowed calls with JSON-RPC Unauthorized before the tool runs.
2. **Pause destructive calls on the server ([Lewsnetter #53](https://github.com/bborn/lewsnetter/pull/53)):** Four delete tools, `sequences_set_enabled`, and conditional `sequences_update` (only when setting `status: "active"`) declare `requires_approval`. RubyLLM 2.2 saves the call as pending instead of executing it, ActionCable broadcasts an Approve/Decline card with a human-readable summary fetched from the team's own record (`Delete campaign "Spring launch" (#12)`, never a bare ID), and approving re-checks the user's team membership and CanCan ability before executing.
3. **Surface the same metadata to external MCP hosts ([Lewsnetter #54](https://github.com/bborn/lewsnetter/pull/54)):** External clients run calls immediately after token consent, so `Mcp::Server.tool_annotations` translates `read_only`, `destructive`, and `requires_approval` into MCP's `readOnlyHint` and `destructiveHint`—and deliberately omits `destructiveHint: false` on ordinary writes so nothing claims safety that hasn't been checked.

```ruby
# app/mcp/tools/sequences/update.rb (Lewsnetter #53)
class Update < Mcp::Tool::Base
  tool_name "sequences_update"
  requires_ability :manage, ::Team
  # An active sequence enrolls and mails subscribers by itself.
  requires_approval { |arguments| arguments["status"] == "active" }

  def approval_summary(arguments:, context:)
    "Activate sequence #{record_label(context.team.sequences, arguments["id"], :name)}: " \
      "it enrolls and sends while Sequences is on"
  end
end
```

> **What it taught me:** Declare risk once, on the tool class itself, and fail closed. New tools should require write access until marked `read_only`, approvals should show the real record name rather than an opaque ID, and hints sent to clients never replace server-side authorization.

## Make evals see what the agent actually called (ActiveAgent #665)

The last failure mode is quieter than a double charge, and just as expensive over time: an evaluation suite that looks green while missing half of what the agent did.

In [ActiveAgent #665](https://github.com/activeagents/activeagent/pull/665), `Evals::Capture` recorded tool calls by wrapping the agent's `tools_function`. That worked for local Ruby tools, but tools served by a client-side MCP server were dispatched inside `BaseProvider#call_tool_function` *before* execution ever reached `tools_function`. The result: `replay.tool_names` came back empty for MCP-backed agents, `assert_tool_called` failed on tools that genuinely ran, and an MCP server returning `isError` (wrapped in `MCPBridge::ErrorResult` so the model can recover without raising) left no trace in `failed_tool_calls`.

**In short:** Evals that wrap only local Ruby tool dispatch miss every client-side MCP tool call and silent `isError` response. Passing a per-instance `tool_observer` callback into the provider records MCP calls and failures alongside local tools with zero global hooks.

The fix passed an optional per-instance `tool_observer` callback from the agent into `BaseProvider`, wrapping only the bridged MCP branch and feeding both local and MCP calls through the same `Capture.record_call` helper:

```ruby
# lib/active_agent/providers/_base_provider.rb (ActiveAgent #665)
def observe_mcp_tool_call(name, arguments, &call)
  return yield unless tool_observer

  tool_observer.call(name, arguments, &call)
end
```

Because the observer lives on the agent instance rather than a global hook or monkey-patch, concurrent evaluation runs never leak records into each other, and `ErrorResult` payloads are recorded as failed tool calls while still returned unchanged to the model.

| Agent with `mcps:`, `mcp_strategy: :client` | Before #665 | After #665 |
|---|---|---|
| `replay.tool_names` for one `get_page` call | `[]` | `["get_page"]` |
| MCP server answers `isError` | Not recorded | Recorded in `failed_tool_calls` with detail |
| MCP tool raises `IOError` | Not recorded | Recorded with error, exception still propagates |

> **What it taught me:** Observability and eval capture have to sit at the real dispatch boundary—and understand soft errors like MCP's `isError`, not just Ruby exceptions.

## The fix is still the small part

Across all twelve pull requests, the pattern from [my RubyLLM MCP post](https://www.wangyaodi.com/blog/learning-mcp-by-fixing-rubyllm) held up almost to the decimal: roughly five lines of tests and documentation for every two lines of application or library code. Every race was reproduced with tests that fail deterministically before the fix and pass after it—and for #80 and #61, reverting any single guard breaks a test.

**In short:** Across the 12 pull requests: 854 lines of application and library code against 2,170 lines of tests and docs (excluding #53's commit from #54's stacked diff). Most of the work is writing deterministic failure tests for overlapping deliveries and edge states.

> **Figure 5. Lines added plus removed per pull request, from GitHub. Lewsnetter #54 was stacked on #53 before merge, so only its net 27 + 14 lines are counted.**
>
> Lines changed per pull request across ActiveAgent and Lewsnetter, code against tests and docs.
>
> Lines added plus removed, from GitHub. ActiveAgent #614: 95 code, 340 tests and docs. #664: 32 code, 180 tests and docs. #665: 100 code, 440 tests and docs. #672: 31 code, 201 tests and docs. #713: 31 code, 227 tests and docs. #715: 109 code, 163 tests and docs. Lewsnetter #35: 79 code, 151 tests and docs. #53: 313 code, 274 tests and docs. #54 (net of #53): 27 code, 14 tests. #61: 12 code, 25 tests. #80: 21 code, 118 tests. #82: 4 code, 37 tests. Total: 854 lines of code and 2,170 of tests and docs.

| Repo & PR | Topic | Code | Tests & docs | Merged |
|---|---|---|---|---|
| ActiveAgent #614 | Judge scoring leases | 95 | 340 | 30 Oct 2026 |
| ActiveAgent #664 | Claim pending agent run | 32 | 180 | 31 Oct 2026 |
| ActiveAgent #665 | Record client-side MCP tool calls | 100 | 440 | 31 Oct 2026 |
| ActiveAgent #672 | Cancel only while in progress | 31 | 201 | 6 Nov 2026 |
| ActiveAgent #713 | Claim pending evaluation run | 31 | 227 | 17 Nov 2026 |
| ActiveAgent #715 | Claim fanned-out replay | 109 | 163 | 17 Nov 2026 |
| Lewsnetter #35 | Enforce `mcp:read` scopes | 79 | 151 | 14 Nov 2026 |
| Lewsnetter #53 | Approval for deletes & activation | 313 | 274 | 16 Nov 2026 |
| Lewsnetter #54* | MCP tool annotations (net of #53) | 27 | 14 | 16 Nov 2026 |
| Lewsnetter #61 | Claim campaign before send | 12 | 25 | 18 Nov 2026 |
| Lewsnetter #80 | Revalidate scheduled sends | 21 | 118 | 22 Nov 2026 |
| Lewsnetter #82 | Scope clicks to enrollment | 4 | 37 | 22 Nov 2026 |

## Six rules for production Rails + AI workflows

1. **Claim state in the write, not in Ruby.** Use a conditional `UPDATE ... WHERE status = pending` so duplicate deliveries decline quietly across Postgres, MySQL, and SQLite. (ActiveAgent #664, #672, #713; Lewsnetter #61)
2. **Use expiring leases and fenced writes for slow LLM calls.** Never hold a database lock across a provider request, and fence both success and failure writes on the lease token. (ActiveAgent #614, #715)
3. **Revalidate intent when the worker starts.** Carry why a job was enqueued (like `from_scheduler: true`) and re-check the full contract under the claim lock. (Lewsnetter #80)
4. **Scope historical queries to the current run.** Never let a prior enrollment or run satisfy a condition for the current one. (Lewsnetter #82)
5. **Keep permissions and approvals on the server, fail closed.** Enforce OAuth scopes before dispatch, require human approval with a clear record label on destructive tools, and expose MCP hints honestly. (Lewsnetter #35, #53, #54)
6. **Capture at the real dispatch boundary.** If your evals miss client-side MCP tools or silent `isError` results, your suite is grading a partial trace. (ActiveAgent #665)

None of these requires a new infrastructure stack. They are ordinary Active Record, Active Job, and authorization habits applied where AI makes mistakes louder and more expensive. If you run a Rails app with background workflows or AI integrations that need this kind of hardening, my [open-source record](https://www.wangyaodi.com/oss) has the full history and my [Rails maintenance](https://www.wangyaodi.com/rails-maintenance) page explains how I work with teams.

## Limits worth knowing

**In short:** Leases prevent ordinary duplicate calls, not true exactly-once remote execution. A worker that crashes right after a provider responds will still be retried after expiry, and provider-hosted MCP tools never pass through your Rails process.

- **Not exactly-once remote calls:** In ActiveAgent #614 and #715, a 30-minute lease stops overlapping deliveries, but a provider call exceeding 30 minutes—or a worker dying after the provider answers and before the database write—can still run again on redelivery.
- **Mid-execution worker death on simple claims:** ActiveAgent #664 and #713 leave a run in `running` if the worker dies after claiming it; recovering stuck runs needs a separate lease or heartbeat sweeper.
- **SQLite transaction semantics differ:** As #664 hit on Rails 7.2, a read-then-write under `with_lock` can raise `SQLite3::BusyException` on deferred transactions; conditional `update_all` avoids that, at the cost of handling broadcasts and callbacks explicitly.
- **Backward compatibility during deploys:** Both ActiveAgent #614 (checking for migration 030 columns) and Lewsnetter #80 (defaulting missing `from_scheduler` to `false`) intentionally degrade gracefully for in-flight jobs queued before the deploy.
- **Hosted MCP tools stay invisible to local capture:** ActiveAgent #665 records client-side MCP tool calls (`mcp_strategy: :client`). Tools executed remotely by a model provider's hosted MCP never enter your Rails process and cannot be observed there.

## Read this with an AI

This post is structured so you can hand it directly to a chat assistant or a coding agent inside your own Rails repository. A plain Markdown copy lives at [`/blog/production-ai-in-rails-is-background-job-engineering.md`](https://www.wangyaodi.com/blog/production-ai-in-rails-is-background-job-engineering.md).

**In short:** A Markdown copy of this post for chat assistants and coding agents is at [`/blog/production-ai-in-rails-is-background-job-engineering.md`](https://www.wangyaodi.com/blog/production-ai-in-rails-is-background-job-engineering.md). The full post includes ready-made audit prompts.

Or start from one of these prompts. The first works in any chat; run the second and third inside a coding agent with access to your Rails repository.

**Walk through the patterns**

```text
Read https://www.wangyaodi.com/blog/production-ai-in-rails-is-background-job-engineering.md and walk me through its six rules for production Rails and AI workflows, one section at a time, with a concrete failure scenario and one question for me before moving on.
```

**Audit your Rails jobs**

```text
Read https://www.wangyaodi.com/blog/production-ai-in-rails-is-background-job-engineering.md and audit every ActiveJob class and service runner in this repository. List each place where a job checks status in Ruby before updating, holds a database lock across an external HTTP or LLM call, skips revalidating scheduled state at claim time, or queries historical events without scoping to the current run—with file and line numbers.
```

**Audit your AI tool guardrails**

```text
Read https://www.wangyaodi.com/blog/production-ai-in-rails-is-background-job-engineering.md, then inspect every AI or MCP tool in this repository. Flag any tool that mutates or deletes data without server-side authorization or human approval, any read-only OAuth scope that isn't enforced before execution, and any tool dispatch path that bypasses eval capture or logging.
```

## How this post was made

I wrote this post with AI, and every post here says how it was made. All twelve pull requests, their code, specs and descriptions are my own public work on GitHub:

- **Sources:** My twelve merged pull requests across `activeagents/activeagent` and `bborn/lewsnetter` (diffs, tests, and PR descriptions), listed under [References](#references).
- **Draft:** The article text, inline SVG diagrams, bar chart, and share cards, drafted with Antigravity from the fetched GitHub diffs and PR descriptions.
- **Checks:** Every PR number, merge date, file path, code snippet, and line count verified directly against the GitHub API on 25 November 2026 (including subtracting #53's stacked commit from #54's diff).
- **Review:** Read and approved by me before publishing.

If you find a mistake, tell me on X and I'll fix it here.

## References

**In short:** All twelve pull requests are public and merged on GitHub across [activeagents/activeagent](https://github.com/activeagents/activeagent/pulls?q=is%3Apr+author%3Ayorzi+is%3Amerged) and [bborn/lewsnetter](https://github.com/bborn/lewsnetter/pulls?q=is%3Apr+author%3Ayorzi+is%3Amerged).

Pull requests to [activeagents/activeagent](https://github.com/activeagents/activeagent):

1. [#614](https://github.com/activeagents/activeagent/pull/614) Prevent overlapping evaluation jobs from scoring twice (merged 30 Oct 2026)
2. [#664](https://github.com/activeagents/activeagent/pull/664) Claim a pending run before executing it (merged 31 Oct 2026)
3. [#665](https://github.com/activeagents/activeagent/pull/665) Record client-side MCP tool calls in eval replays (merged 31 Oct 2026)
4. [#672](https://github.com/activeagents/activeagent/pull/672) Cancel a run only while it is still in progress (merged 6 Nov 2026)
5. [#713](https://github.com/activeagents/activeagent/pull/713) Claim a pending evaluation run before replaying it (merged 17 Nov 2026)
6. [#715](https://github.com/activeagents/activeagent/pull/715) Claim a fanned-out replay before the agent runs (merged 17 Nov 2026)

Pull requests to [bborn/lewsnetter](https://github.com/bborn/lewsnetter):

1. [#35](https://github.com/bborn/lewsnetter/pull/35) Keep `mcp:read` tokens to read-only tools (merged 14 Nov 2026)
2. [#53](https://github.com/bborn/lewsnetter/pull/53) Ask before deletes and sequence activation (merged 16 Nov 2026)
3. [#54](https://github.com/bborn/lewsnetter/pull/54) Mark read-only and destructive tools for hosts (merged 16 Nov 2026)
4. [#61](https://github.com/bborn/lewsnetter/pull/61) Claim campaigns before starting a send (merged 18 Nov 2026)
5. [#80](https://github.com/bborn/lewsnetter/pull/80) Revalidate scheduled sends when claiming queued jobs (merged 22 Nov 2026)
6. [#82](https://github.com/bborn/lewsnetter/pull/82) Scope click actions to the current enrollment (merged 22 Nov 2026)

---

Discuss this post on X: reply to [@yorzi](https://x.com/yorzi) with a link to https://www.wangyaodi.com/blog/production-ai-in-rails-is-background-job-engineering
