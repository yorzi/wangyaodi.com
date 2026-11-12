# What stays worth doing as AI gets better

> A map of 24 roles in six domains, each defined by the problem it solves, the responsibility it holds and how you prove it worked. Then five tests for any career direction, and a 90-day way to try one before you commit.

By Andy Wang · 12 Nov 2026 · https://www.wangyaodi.com/blog/future-work-map-2026-2036

Written with AI from my own research notes, with outside figures checked against WEF, BLS and Microsoft. See "How this post was made" at the end.

This is the Markdown copy of the post, for AI tools and agents. The web page has the diagrams and charts; here each one is described in words.

---

Most career advice about AI starts from a list of what AI can't do yet. That list gets shorter with every model release, so a career built on it has to move every few months. The question I ended up with is a different one: **what remains worth doing as AI gets better?**

To answer it, I worked through the question with ChatGPT and then took the result apart: six domains of work, 24 roles, and for each role the problem it solves, what it delivers, how you would measure it and where it breaks. I archived those notes on 10 November 2026. This post is the cleaned-up guide, checked against outside data: Microsoft's 2026 Work Trend Index, the World Economic Forum's Future of Jobs Report 2025 and the US Bureau of Labor Statistics' 2025–35 projections.

I wrote it for software engineers first, because that is my work, but the map and the tests apply to any knowledge job. It is not a forecast. Most of the roles are existing jobs being reorganized, a few are educated guesses, and each one is labelled.

**In short:** When AI makes producing work cheap, value moves to the steps around it: choosing the problem, proving the result, connecting it to real systems, earning trust and answering for the outcome. This post maps 24 roles built on those steps, gives five tests for any career direction, and a 90-day way to try one before you commit.

- 24 roles in six domains of work
- 4 · 17 · 3 roles established, evolving, still unproven
- 5 tests to run on any career direction
- 90 days to test one direction with real buyers

The post starts with the shift underneath everything, then the map. After that comes how to choose: maturity labels, what the outside numbers say, five tests, the positions that look safe and aren't, how to combine roles, three phases to 2036 and a 90-day test. It ends with where a software engineer fits, including where I sit. If you only have a minute, this image is the whole post:

![Summary of the post. Title: What stays worth doing as AI gets better. AI makes producing work cheap; value moves to choosing the problem, proving the result, connecting it to real work, earning trust and answering for the outcome. Six domains with four roles each. A, problems and decisions: vertical problem architect, outcome product owner, decision intelligence analyst, AI value realization analyst. B, AI systems and reliability: human–AI workflow architect, agent reliability engineer, AI evaluation and verification engineer, agent security and identity engineer. C, trust, evidence and accountability: verifiable trust architect, data and knowledge provenance steward, AI risk and governance lead, AI incident and accountability specialist. D, markets and distribution: agent-ready commerce architect, search and answer distribution strategist, complex deal and solution advisor, customer relationship and retention strategist. E, original knowledge: first-hand evidence researcher, research reproducibility engineer, experience-led content producer, AI-augmented learning experience designer. F, real-world delivery: AI-assisted care coordinator, field automation integration engineer, supply chain resilience architect, energy systems and retrofit advisor. Five tests: who pays, what does the problem cost, can the result be checked, will the need last, is it still worth it as AI improves. A 90-day test: find the problem, run one bounded pilot, check the evidence; payment, not praise. 24 roles in six domains; 4 established, 17 evolving, 3 unproven; 5 tests for any direction; 90 days with real buyers. Deep expertise plus AI leverage plus outcome ownership.](https://www.wangyaodi.com/assets/blog/future-work-map-2026-2036/summary.jpg)

*The post in one image. [Open it full size](https://www.wangyaodi.com/assets/blog/future-work-map-2026-2036/summary.jpg) to save or share it.*

## Producing gets cheap. The rest of the chain doesn't

Every result that reaches a customer passes through six steps. Someone finds a problem worth solving. Someone produces a solution. Someone verifies that it works. The customer has to trust it. It has to fit into the way real work is done. And when it goes wrong, someone has to answer for it.

**In short:** A result passes through six steps: find the problem, produce a solution, verify it, earn trust, fit it into real work, and answer for the outcome. AI is cutting the cost of the second step fastest. The other five are where value moves.

AI changed the second step first. Code, text, analyses, images and plans now cost a fraction of what they did, and AI is starting to help with the other steps too. But the deeper a system reaches into money, health, company processes, supply chains or research, the less "the output looks right" means "the result is right".

> **Figure 1. AI makes step 2 cheap first. The other five steps don't get cheaper at the same rate, so that is where value moves.**
>
> The six steps from a problem to a result, and where AI cuts the cost.
>
> Six steps in a row, joined by arrows: 1, find the problem; 2, produce a solution; 3, verify the result; 4, earn trust; 5, fit it into real work; 6, answer for the outcome. Step 2 is drawn dashed and labelled "AI cuts this cost first". Steps 1 and 3 to 6 are underlined in the accent colour and labelled: value moves to the steps AI doesn't make cheap: choose, prove, connect, earn trust, answer for it.

If you only look at step 2, four wrong conclusions follow:

- **"Generated content is cheap, so content is worthless."** Content that changes how people think, carries first-hand evidence or gives an experience a summary can't is still scarce.
- **"Code is cheap, so software has no moat."** Integration, data, process, compliance, service quality and distribution can be harder than the code.
- **"AI can do the marketing, so customers get cheap."** When every seller can reach everyone, buyers filter harder and ignore more.
- **"The model can answer, so the judge can leave."** In high-stakes work someone still has to catch the error, decide whether to ship, explain the risk and answer for the result.

The people already using AI at work seem to agree. In Microsoft's 2026 Work Trend Index, a survey of 20,000 knowledge workers who use AI, across 10 markets, 86% said they treat AI output as a starting point, not a final answer. The two human skills they ranked most important were quality control of AI output (50%) and critical thinking (46%).

So define a job by what doesn't get cheap: **a problem that keeps existing, a responsibility someone clearly holds, and a result that can be checked.** Not by a tool. "Prompt engineer" names a tool skill. "The person who makes sure the support agent can't refund the wrong order, and can show it" names a problem, a responsibility and a check.

One caution before the map. A lasting need doesn't mean a job with that title. The same responsibility can be a full-time role at a large company, a contract service, or a small product.

> **What it taught me:** Ask "which step of the chain do I own?" before "which tool do I use?". Tools change every few months. The steps don't.

## The map: six questions, 24 roles

**In short:** The 24 roles fall into six domains. Each domain answers one question that stays hard as AI improves: what is worth doing, is it done right and safely, can it be checked and corrected, how do we get chosen, what can't be summarized away, and how does it become real in the physical world.

Each domain answers one question that stays hard as AI gets better. Within each, four roles describe a concrete way to answer it. The names are mine, from the research notes; most are not standard job titles yet, and some may never be.

> **Figure 2. The map. Filled dots are work that already has a market; hollow ones are existing jobs being reorganized; dashed ones are reasonable but unproven.**
>
> Six domains of future work, with four roles each and their maturity.
>
> A, problems and decisions, asks what is worth doing: 01 vertical problem architect, 02 outcome product owner, 03 decision intelligence analyst (all evolving), 04 AI value realization analyst (established). B, AI systems and reliability, asks whether it is done right and safely: 05 human–AI workflow architect, 06 agent reliability engineer (evolving), 07 AI evaluation and verification engineer (established), 08 agent security and identity engineer (evolving). C, trust, evidence and accountability, asks whether it can be checked and corrected: 09 verifiable trust architect (unproven), 10 provenance steward (evolving), 11 AI risk and governance lead (established), 12 AI incident specialist (unproven). D, markets and distribution, asks how we get chosen: 13 agent-ready commerce architect (unproven), 14 search and answer distribution (evolving), 15 complex deal advisor (established), 16 relationship and retention (evolving). E, original knowledge, asks what can't be summarized away: 17 first-hand researcher, 18 reproducibility engineer, 19 experience-led producer, 20 learning experience designer (all evolving). F, real-world delivery, asks how it becomes real: 21 AI-assisted care coordinator, 22 field automation engineer, 23 supply chain resilience, 24 energy and retrofit advisor (all evolving).

For each role below: what it does, what it delivers, how you'd know it worked, and the trap. Skim the domain closest to your work first.

### A. Problems, strategy and decisions

Finding problems worth solving, defining success, and turning analysis into results someone can check.

- **01 Vertical problem architect** (evolving). Works inside one industry's processes to find problems customers hit again and again, and that cost them real money. Delivers problem maps, diagnostic reports and paid pilots. Measured by losses reduced and willingness to pay. Trap: a problem with no budget is not a market.
- **02 Outcome product owner** (evolving). Answers for whether a product changes user and business outcomes, not for shipping features. Delivers outcome contracts, roadmaps, pilot analyses and acceptance reports. Measured by retention, task completion, revenue and cost per delivery. Trap: a short-term proxy metric isn't long-term value.
- **03 Decision intelligence analyst** (evolving). Turns incomplete or conflicting information into options you can trace back to evidence: graded evidence, scenarios, sensitivity analysis, counter-examples. Delivers decision memos, assumption registers and risk matrices. Measured by decision quality and how well the key assumptions held. Trap: the analyst doesn't own the decision.
- **04 AI value realization analyst** (established). Checks whether an AI project really improved quality, speed or cost, or only created a feeling of productivity: a baseline to compare against, model and human costs, the reasons things failed. Delivers ROI reports and continue-or-stop advice. Measured by net benefit, payback time, quality and adoption. Trap: mistaking a correlation for the AI's contribution.

### B. AI systems, verification and reliability

Moving from demo AI to production systems with permissions, limits and a way to recover.

- **05 Human–AI workflow architect** (evolving). Designs who does what between people, agents, ordinary software and outside services: task splits, approval points, tool interfaces, exceptions and human takeover. Delivers workflow specs, runbooks and acceptance criteria. Measured by task success, cost per task and the human review load. Trap: skipping the approval a high-risk action needs.
- **06 Agent reliability engineer** (AgentOps) (evolving). Keeps agents stable, observable and recoverable in production: task state, idempotency, retries, timeouts, concurrency, monitoring, replay and incident reviews. Delivers recovery mechanisms, runbooks and incident reports. Measured by success rate, wrong-action rate, time to recover and cost. Trap: more monitoring doesn't automatically mean more reliability.
- **07 AI evaluation and verification engineer** (established). Builds repeatable checks of quality, safety and task correctness: test sets, edge cases, adversarial tests, human labels, calibrated graders and regression gates. Delivers eval suites, defect reports and release gates. Measured by critical errors caught, errors missed and how consistently graders agree. Trap: overfitting to a fixed benchmark; keep some tests independent.
- **08 Agent security and identity engineer** (evolving). Limits who an agent is, what it can touch and what it can do: least privilege, threat models, secrets, policy enforcement, isolation and audit. Delivers a permission architecture, penetration tests and fixes. Measured by unauthorized-access risk, control coverage and incident response. Trap: a policy document is not a control you can test.

### C. Trust, evidence and accountability

Making reputation checkable, sources traceable, and mistakes explainable and correctable.

- **09 Verifiable trust architect** (unproven). Builds evidence of who a business or professional is, what they delivered and how well: sources, independent client cases, credential checks, third-party verification and correction logs. Delivers evidence files and public verification pages. Measured by independent verification success and lower due-diligence cost. Trap: bought reviews aren't independent reputation, and nobody knows yet how big this market is.
- **10 Data and knowledge provenance steward** (evolving). Tracks the source, license, version and corrections of data, AI output and knowledge. Delivers traceable knowledge bases and version and correction logs. Measured by source completeness, freshness and license compliance. Trap: a traceable source isn't necessarily a true one.
- **11 Responsible AI and risk governance lead** (established). Turns safety, privacy, compliance, fairness and accountability principles into internal controls: risk tiers, impact assessments, reviews and spot checks. Delivers risk registers, control matrices and audit evidence. Measured by high-risk issues fixed and controls that work. Trap: rules and liability differ by country and industry.
- **12 AI incident and accountability specialist** (unproven). Investigates real errors or losses caused by automation: preserves the execution records, rebuilds the timeline, finds the root cause, talks to the people affected and changes the mechanism. Delivers incident timelines, investigation reports and fixes. Measured by investigation speed, recurrence and how well the harm was remedied. Trap: it doesn't replace a legal investigation or a legal finding of liability.

### D. Markets, relationships and distribution

Letting real value be found, compared, trusted and chosen again, by people and by machines.

- **13 Agent-ready commerce architect** (unproven). Makes products and services accurately searchable, comparable and buyable by purchasing agents: structured product data, current stock, clear terms and transaction tests. Delivers machine-readable catalogs and interfaces. Measured by data accuracy and valid orders. Trap: it depends on agent commerce standards that are still forming, and nobody can guarantee an agent recommends you.
- **14 Search and answer distribution strategist** (evolving). Builds visibility and a trustworthy path to customers across search, AI answers and communities: research into what people ask, content structure, evidence pages and outside mentions. Measured by qualified inquiries, conversions, return visits and content accuracy. Trap: the rules change often, so nobody can promise rankings.
- **15 Complex deal and solution advisor** (established). Builds the business case and rollout path for high-risk B2B purchases with many stakeholders: interviews, pilots, risk and benefit analysis, and support for the internal champion. Measured by qualified deals, sales cycle and customer benefit after launch. Trap: what is promised in the sale has to match what can be delivered.
- **16 Customer relationship and retention strategist** (evolving). Builds direct, permission-based relationships and long-term value instead of depending on one-off exposure: lifecycle design, membership and community, retention analysis and customer success. Measured by retention, renewals, repeat purchases and referrals. Trap: a contact list is not trust, and privacy comes first.

### E. Original knowledge, research and experience

Independent evidence and real experience that pure summaries and bulk generation can't fully replace.

- **17 First-hand evidence researcher** (evolving). Finds what public sources don't have, through interviews, field observation and experiments, and cross-checks it against other sources and counter-examples. Delivers original research and evidence archives. Measured by accuracy and how the research gets used. Trap: exclusive information can be wrong too, and ethics and privacy rules apply.
- **18 Research reproducibility engineer** (evolving). Turns scientific and AI research claims into experiments anyone can rerun, by checking data, code, environment and statistical assumptions. Delivers replication repositories and validation reports. Measured by replication success and important errors found. Trap: one successful replication doesn't rule out a systematic measurement bias.
- **19 Experience-led content producer** (evolving). Makes work from real experience and personal judgment that a summary can't replace, uses AI for editing and keeps the source files. Measured by return visits, deep engagement and a lasting audience. Trap: real experience can be performed too, so be honest and respect copyright.
- **20 AI-augmented learning experience designer** (evolving). Combines instructional design with AI personalization so learners master knowledge and can use it elsewhere: diagnosis, learning paths, practice with feedback, and retention checks. Measured by mastery, long-term retention and transfer. Trap: measure learning, not time spent in the app.

### F. Real-world services and delivery

Real results under the constraints of physical sites, professional licenses, supply chains and public services.

- **21 AI-assisted care coordinator** (evolving). Uses AI, with authorization and professional supervision, to coordinate care plans, appointments, handovers and referrals. Measured by continuity of care, coordination errors and satisfaction. Trap: never diagnose or treat beyond one's license; privacy and credential rules apply.
- **22 Field automation integration engineer** (evolving). Deploys sensors, vision, robots and AI on real sites and keeps them running: site surveys, integration, safety acceptance, repairs and training. Measured by uptime, productivity, safety and failure rates. Trap: site safety can't be signed off from a software simulation.
- **23 Supply chain resilience architect** (evolving). Keeps a business running through supply disruption, price swings and logistics risk: single points of failure, alternate suppliers, scenarios and recovery plans. Measured by stockout cost, recovery time and delivery stability. Trap: resilience costs money and has to be balanced against efficiency.
- **24 Energy systems and retrofit advisor** (evolving). Assesses energy use in buildings and facilities, plans equipment retrofits and verifies the actual savings. Measured by real energy use, reliability and payback time. Trap: work that needs a license has to be done by qualified people.

> **What it taught me:** Every role on the map is defined by a question that a better model doesn't answer for you: what's worth doing, is it right, can it be checked, will anyone choose it, is it original, does it work on site. A role defined by a tool doesn't have that question.

## Read the maturity label before you bet

**In short:** Only 4 of the 24 roles are established work today: AI value analysis, AI evaluation, AI risk governance and complex deal advising. 17 are existing jobs being reorganized, and 3 are reasonable ideas without proven buyers yet. Explore the unproven ones from a job next to them.

Each role carries one of three labels:

- **Established** (4 roles: 04, 07, 11, 15). The work, and jobs close to it, already have a market. The name I use may still not be the standard job title.
- **Evolving** (17 roles). An existing function reorganized around AI. Most of the map is here.
- **Unproven** (3 roles: 09, 12, 13). The definition is reasonable, but there is no evidence yet of standalone jobs or buyers with budgets.

The notes also rank nine roles by how strong the evidence of need is and how well each could be done independently, as a freelancer or a small company. This is a qualitative judgement, not a ranking by job counts or pay:

| Role | Evidence of need | On your own | What has to be true |
|---|---|---|---|
| 07 AI evaluation | Strong | High | Ongoing testing and independent acceptance |
| 06 Agent reliability | Strong | High | Systems actually running in production |
| 05 Human–AI workflow | Strong | Very high | A clear business outcome, and the authority to change the process |
| 01 Vertical problem architect | Strong | Very high | An industry with budget and expensive problems |
| 08 Agent security | Strong | Medium | Compliance needs, and technical skill buyers trust |
| 15 Complex deal advisor | Strong | High | Buyers facing complex decisions with many parties |
| 18 Reproducibility | Medium | High | Research groups with budget for verification |
| 09 Verifiable trust | Unproven | High | Businesses willing to pay to manage their evidence |
| 13 Agent-ready commerce | Unproven | Medium | Purchasing agents and their standards maturing |

> **What it taught me:** An unproven role is something to explore, not something to stake a career on. Stand in an established or evolving role next to it, and let the new one grow out of real work if buyers show up.

## What the outside numbers say, and what they can't

**In short:** The big studies point the same way: heavy churn, growth in data, care and energy work, and a shrinking share of routine office work. None of them can confirm these 24 roles, their pay or when they'll appear.

Three public sources give the background. Each says something useful, and each has a limit:

| Source | What it found | What it can't tell you |
|---|---|---|
| WEF, Future of Jobs Report 2025 | More than 1,000 large employers, representing more than 14 million workers, expect 170 million jobs to be created and 92 million displaced by 2030: a net gain of 78 million. | These are employer expectations for 2025–2030, not observed jobs, and they don't name these roles. |
| US BLS, Employment Projections 2025–35 (27 Aug 2026) | Total US employment grows 3.5%. Nurse practitioners grow fastest (+41.0%); solar installers (+36.5%) and wind turbine technicians (+29.5%) are in the top five; data scientists +34.6%. Office and administrative support shrinks fastest (−4.0%, about 752,100 jobs), with AI-powered automation named as a reason. | US only, and by existing occupation codes. |
| Microsoft, Work Trend Index 2026 (5 May 2026) | Organizational factors (culture, manager support, talent practices) account for 67% of the associated AI impact, individual mindset and behavior for 32%. Only 13% of AI users say they are rewarded for reinventing their work with AI. | A survey by a vendor of AI tools; the report itself calls these associations, not causes. |

Two things in this data matter for the map. First, domain F is where the government projections point, and it is the domain software people skip. Care, energy and on-site work grow because they need someone physically present and licensed. Second, the Microsoft numbers say individuals can't capture AI's value alone: most of it depends on how the organization works. That is why roles like 02 (outcome product owner), 04 (AI value realization) and 05 (workflow architect) exist at all.

## Five tests for any career direction

**In short:** Before you commit to a direction, ask: who pays, what does the problem cost, can the result be checked, will the need last, and is it still worth doing as AI improves. Illegal or unmanageable risk, no real customer, no definable outcome or no workable business model rules it out.

The map gives you options. These tests tell you which ones are worth your next few years. Run every direction you're considering through all five:

> **Figure 3. Five tests, then four vetoes. Test 5 is the one people skip.**
>
> Five tests for a career direction, and the conditions that rule one out.
>
> Five tests in a row, joined by arrows. Test 1: who pays, who holds the budget and decides. Test 2: what does the problem cost, the time, money or quality lost. Test 3: can the result be checked, with independent proof it was solved. Test 4: will the need last, or is it a one-off windfall. Test 5, highlighted: is it still worth it as AI improves, does it become stronger or redundant. Below, a dashed box lists the vetoes: illegal or unmanageable risk, no real customer, no definable outcome, no workable business model.

1. **Who pays?** Name the person who holds the budget and makes the decision. "Companies" is not an answer; "the head of support at a 200-person software company" is.
2. **What does the problem cost?** How much time, money or quality is lost if nobody solves it? A real cost is what makes someone pay.
3. **Can the result be checked?** Can you show, with independent evidence, that the problem was solved? If not, your work is hard to buy and easy to cut.
4. **Will the need last?** Is this a long-term need, or a one-off windfall from a new tool or a platform loophole?
5. **Is it still worth it as AI improves?** Does a better model make this work stronger, or does it remove it?

Then the vetoes. Any one of these rules a direction out, however good it scores elsewhere: illegal or unmanageable safety risk, no real customer, no way to define the result you're responsible for, or no business model anyone would accept.

For test 5, the sharpest form of the question I know is this one: *if the strongest model were free tomorrow, would what I do become more valuable, or redundant overnight?* Work that gets more valuable usually sits on steps 1 and 3 to 6 of Figure 1. Work that becomes redundant usually is step 2.

> **What it taught me:** Most career plans pass tests 1 to 4 and never ask test 5. A direction that only exists because today's models are weak at something is a contract with an end date you don't control.

## Five positions that look safe and aren't

**In short:** Prompt writing, template content, simple automation scripts, search loopholes and manual review of AI output all earn money today, and all shrink as tools absorb them. Each has an upgrade one step up the chain.

Each of these earns money today. Each is exposed for the same reason: it is step 2 work, or checking step 2 by hand, so better tools absorb it. Each also has a direction that keeps the skill and moves up the chain:

| Position | Why it's fragile | Move toward |
|---|---|---|
| Prompt writer | Models and product interfaces absorb the tricks | Human–AI workflow design (05) |
| Template content in bulk | Supply explodes, and the pieces look alike | Real experience and first-hand research (17, 19) |
| Simple automation scripts | Platforms build the feature in | Deep workflow integration, with acceptance tests |
| Short-term search loopholes | The platform controls the rules | Search and answer distribution (14) |
| Manual review of AI output | The checking itself gets automated | Eval design, quality ownership and review systems (07) |

The last row deserves a note. "A human is responsible" doesn't mean "a human reads every line". The durable version of that job designs layers of checks, and spends human attention where it matters most: on high-risk actions, on things that can't be undone, and on judgement calls.

A skill that pays today won't necessarily carry a ten-year career. Tie it to a real problem and to evidence that the problem got solved, and it can.

## Combine roles; don't pick just one

**In short:** The profile that lasts is deep expertise, plus AI leverage, plus outcome ownership. Some roles make a complete offer together, such as workflow design plus evaluation (05 + 07). And each role can be a job, an independent service or a product.

The org chart thinks in single functions. The work that lasts tends to be a combination, which the notes write as one line:

> Deep expertise + AI leverage + outcome ownership.

Deep expertise is the domain you understand better than a model can from public text: how customers make money, which error is the most expensive, who signs off. AI leverage is how much more you deliver because of the tools. Outcome ownership is being the one who answers for the result. Take away any one and you're back to a fragile position: expertise without leverage is slow, leverage without expertise is step 2, and both without ownership is a contractor nobody can hold to anything.

Some roles make a complete offer together:

- **05 + 07, workflow plus evaluation.** Design the human–AI workflow, build it, and prove it works with evals. That is a full delivery service.
- **01 + 02, problem plus outcome.** Find the expensive problem inside an industry, then stay responsible for the customer's result.
- **17 + 14 + 16, research plus distribution plus relationship.** Original research, content people and AI answers can find, and a direct, lasting relationship with the readers.
- **09 + 10, trust plus provenance.** Verified reputation and traceable knowledge together, as trust infrastructure. Only if buyers turn out to pay for it.

And each role can take three forms:

> **Figure 4. The same responsibility can be a job, a service or a product. Choosing the form is a separate decision from choosing the role.**
>
> One responsibility, three forms of work.
>
> At the top, one responsibility: keep agents running safely in production. It branches into three forms. Form 1, a company role: holds the responsibility inside one organization. Form 2, an independent service: sold to several clients as projects or ongoing care. Form 3, a product: the repeatable part, as software or a hosted service.

Selling outcomes instead of hours sounds attractive in every form. It only works once you and the buyer can agree what caused the outcome and who carries the risk when it doesn't come.

## 2026 to 2036, as scenarios, not a schedule

**In short:** 2026–2028: existing jobs reorganize around agents. 2028–2031: if agents take on consequential work, evaluation, permissions and incident handling mature. 2031–2036: careers may be re-divided by outcome. Revisit the map every two years.

> **Figure 5. Three phases. Each depends on the one before it actually happening.**
>
> Three phases of work from 2026 to 2036, as scenarios.
>
> A timeline from 2026 to 2036 with marks at 2028 and 2031. 2026 to 2028, workflows reorganize: agents join existing jobs, and titles mostly stay. 2028 to 2031, verification matures: if agents act with real consequences, evaluation, permissions and incident handling become more mature specialties. 2031 to 2036, highlighted, careers are re-divided by outcome: problem choice, evidence, integration, relationships and accountability at the core. A note below: scenarios, not a schedule; revisit the map every two years.

**2026–2028: workflows reorganize.** Engineering, product, operations, research and consulting bring in more agents. The early work is task splitting, human approval, quality control and measuring the real gains. Job titles mostly stay; what changes is what's inside them.

**2028–2031: verification, security and governance deepen.** If agents take on more work with real consequences, evaluation, permissions and incident handling may become more mature specialties. Platforms may also automate part of that work themselves, so this doesn't imply a wave of new jobs.

**2031–2036: careers re-divided by outcome.** If AI keeps getting better at execution, the core of a career may become problem choice, data and evidence, industry integration, long-term customer relationships and accountability. Regulation, company culture and actual adoption will make this uneven across regions.

The notes behind this post go one step further and keep three different worlds in view for 2036: agents stay strong assistants and people still choose brands themselves; agents become a common way to buy, so machine-checkable evidence gains value; or platforms concentrate and change rules often, so owning your customer relationships matters more. The strategy that holds in all three is the same: build real value, keep your evidence, stay directly connected to the people you serve, avoid depending on a single channel, and keep your options open.

## A 90-day test instead of a ten-year plan

**In short:** Days 1–30: pick one domain and two candidate roles, and talk to about ten real users and buyers. Days 31–60: run one bounded pilot with a baseline and acceptance criteria. Days 61–90: check for payment, repeat use, referrals and delivery cost. If people love the demo but won't buy, change the market, not the output.

A ten-year direction can be firm. The next six months of tactics have to be allowed to be wrong. So don't commit to a role from a map; test one with real buyers for 90 days:

> **Figure 6. Ninety days, three phases, and the signal that matters at the end: payment, not praise.**
>
> A 90-day test of a career direction, in three phases.
>
> Days 1 to 30, find the problem: one domain and two candidate roles, about ten users and buyers, how they solve it now and who pays. Days 31 to 60, run one bounded pilot: a baseline and acceptance criteria, the cost of an error, human approval points. Days 61 to 90, check the evidence: real payment and repeat use, referrals and net delivery cost, whether it can be standardized. Two outcomes: they pay, come back and refer others, so standardize it; or they love the demo but won't buy, so change the market, not the output.

### Days 1–30: find the problem

Pick one domain and two candidate roles from the map. Talk to about ten people who would use the work and the people who would pay for it. Learn how they solve the problem today, where it hurts, and where the budget comes from. Ten is a practical number for an experiment, not a statistically sufficient sample. Write one page on what you will *not* solve.

### Days 31–60: run one bounded pilot

Offer one pilot with clear edges. Before it starts, define the baseline, what "accepted" means, what an error costs and where a human has to approve. Don't treat generated material as a verified result. Aim for a customer who has a real budget, not a friend doing you a favor.

### Days 61–90: check the evidence

Look for real payment, repeat use, referrals, the net cost of delivering, and whether the work can be standardized. Then ask the question from the research notes: did I build anything that rerunning a model can't copy? Customer permission, real cases, original data, a deep integration, an independent recommendation. If customers like the demo but won't buy, change your assumption about the market. Producing more won't fix it.

> **What it taught me:** The output of the 90 days isn't a product. It's evidence about a market: who paid, what they paid for, and what you can now show the next buyer.

## Where a software engineer fits

**In short:** For software engineers, domain B is the shortest move: workflow design, agent reliability, evaluation and security reuse what we already know about state, failure, tests and permissions. Five skills carry across every role: problem framing, verification, integration, trust building and accountability.

If you build software for a living, domain B will look familiar, because it's old engineering applied to a new kind of actor. Role 06's list (task state, idempotency, retries, timeouts, concurrency, replay, incident reviews) reads like the checklist for background jobs in any Rails app. Role 08 is least privilege and secrets management for something that improvises. Role 07 is testing, with a grader that can itself be wrong.

That's the case for the old crafts. Readable code, sound architecture, tests, security and code review aren't a craft competing with AI. They are what lets AI output go into production safely. The engineers who treat them that way are already doing roles 05 to 08, whatever their title says.

Five skills carry across every role on the map, and they're the ones worth practicing whatever you choose:

- **Problem framing:** picking, from many possible problems, the one most worth solving.
- **Verification:** designing independent tests, evidence and ways to correct mistakes.
- **Integration:** connecting people, systems, company processes and the physical world.
- **Trust building:** earning trust through honest delivery over time, not packaging.
- **Accountability:** making the call, owning it and fixing it, within clear authority.

### Where I sit on the map

I ran the tests on my own work. Most of it sits in domain B. The nine fixes in [my last post](https://www.wangyaodi.com/blog/learning-mcp-by-fixing-rubyllm) were role 06 work: sessions that end mid-request, a token refresh racing a user's disconnect, one tenant's outage hiding tools from everyone else. [VibeCare](https://www.wangyaodi.com/vibecare), my monthly maintenance for apps built with AI tools, is role 06 sold as an independent service, with some of 07: someone answers for the app after an AI has written it.

The five tests, answered honestly for that service:

1. **Who pays?** The owner of an app that real users now depend on, who built it with Cursor, Lovable or Claude Code and needs someone to keep it working.
2. **What does it cost?** Sign-ups that fail, orders that don't go through, and the owner's weekends spent on errors they don't understand.
3. **Can it be checked?** Yes: I add tests around what I change, and the error tracker shows whether it stays fixed.
4. **Will it last?** Apps keep changing, and their dependencies keep moving under them.
5. **Still worth it as AI improves?** More people building apps with AI means more apps that need someone to answer for them. The honest risk is that tools get better at fixing their own bugs. My bet is that owning the result, and the judgement about what to fix first, stays with a person longer than writing the code does.

## Six things to take with you

1. **Define your work by problem, responsibility and proof.** Not by the tool you use. Tools change every few months.
2. **Own a step AI doesn't make cheap.** Choose the problem, verify the result, fit it into real work, earn trust, answer for the outcome.
3. **Check maturity before you bet.** Of 24 roles, 4 are established, 17 evolving and 3 unproven. Explore unproven ones from a job next to them.
4. **Run the five tests, and take the fifth seriously.** If the strongest model were free tomorrow, would your work be worth more, or nothing?
5. **Combine roles.** Deep expertise, AI leverage and outcome ownership together; pairs like 05 + 07 make a complete offer.
6. **Test for 90 days, revise every two years.** Real buyers, a bounded pilot, payment as the signal; then update the map.

None of this is specific to AI. Choosing the right problem, proving your work and owning the result have always been what separated senior people from busy ones. AI just makes the difference visible sooner, because the busy part is the part it does.

## Limits worth knowing

**In short:** The 24 roles are a research synthesis, not an official classification or a jobs forecast, and the outside data supports the direction only. A responsibility that must be held doesn't mean anyone will hire for it under that title.

- The 24 role names, the combinations and the three phases are a synthesis from my research notes and a conversation with AI. They are not an official job classification, and no outside report lists them.
- WEF's numbers are employer expectations, Microsoft's come from its own survey and product data, and the BLS projections cover the US only. None of them confirms the pay, market size or timing of any role here.
- Someone having to be responsible doesn't mean a company will hire a person with that title.
- AI making work more efficient can create more demand, or need fewer people. The map doesn't assume either.
- A hard problem isn't the same as a buyer with budget, and a role being socially necessary doesn't make it well paid or workable as freelance work.
- Care, on-site installation and security audits may need licenses, supervision or an organization to deliver them.
- Models will keep improving, and today's professional services may be automated in turn. Recheck where the irreplaceable value in your role comes from, at least every two years.
- This was written in November 2026. If you read it much later, check the dates on everything.

## Start this week

**In short:** Write three lines: the problem you solve, the responsibility you hold and the evidence you can show. Then pick two roles from the map, run the five tests on each, and book the first interview.

Write three lines about your current work:

1. The problem I solve, and who has it.
2. The responsibility I hold: what I answer for when it goes wrong.
3. The evidence I can show that I solved it.

If any line is hard to write, that's the gap to work on first. Then pick two roles from the map that sit next to what you already do, run the five tests on each, and book the first of those ten conversations. Ask these three questions again every six months: would a free, stronger model make my work worth more or less? Am I saving people time, or quietly moving the reviewing, debugging and risk onto them? Will what I did this year become next year's evidence, reputation or insight?

## Read this with an AI

This post is long and structured on purpose, so you can hand it to an AI and work through it together. A plain Markdown copy, without the page around it, lives at [`/blog/future-work-map-2026-2036.md`](https://www.wangyaodi.com/blog/future-work-map-2026-2036.md). Chat assistants and coding agents such as Claude Code or Codex can read it straight from that address.

**In short:** A Markdown copy of this post, made for chat assistants and coding agents, is at [`/blog/future-work-map-2026-2036.md`](https://www.wangyaodi.com/blog/future-work-map-2026-2036.md). The full post has ready-made prompts.

Or start from one of these prompts. The first two work in any chat. Run the third from a coding agent inside your own repository, where it can read your code.

**Learn the map**

```text
Read https://www.wangyaodi.com/blog/future-work-map-2026-2036.md and walk me through its map of future work: one section at a time, in plain words, with one question for me after each section before you move on.
```

**Test my direction**

```text
Read https://www.wangyaodi.com/blog/future-work-map-2026-2036.md. Then interview me about my current work, one question at a time, until you can write my three lines: the problem I solve, the responsibility I hold, and the evidence I can show. Suggest two roles from the map that sit next to my work, run the five tests and the vetoes on each, and be blunt about test 5. End with a 90-day plan, including who my first three interviews should be with.
```

**Audit an AI feature**

```text
Read https://www.wangyaodi.com/blog/future-work-map-2026-2036.md, then review the AI features and agents in this repository through roles 05 to 08 (workflow, reliability, evaluation, security). List each place where a model or agent can take an action without a human approval it should have, retry without idempotency, ship without an eval or regression check, or reach data and tools beyond what it needs, with the file and line and a one-line fix.
```

## How this post was made

I wrote this post with AI, and every post here says how it was made. The thinking behind it is mine, worked out with AI: research notes on where work is going, archived on 10 November 2026. Here is who did what:

- **Sources:** My research notes (in Chinese, not public): a map of 24 roles and a companion piece on what grows more valuable as AI improves. The public reports they lean on are under [References](#references).
- **Study notes:** The map, the role definitions, the five tests and the 90-day plan were first worked out in a conversation with ChatGPT, which I then archived and edited as notes.
- **Draft:** This English post, its six diagrams and its images, drafted with Claude Code from those notes. Claude Code also added the outside data and expanded the section on software engineers.
- **Checks:** Every role, label and test checked against the notes, and the Microsoft and BLS figures against their own pages, on 12 November 2026. The WEF figures were checked against quotes of the report, because its site refused automated reads.
- **Review:** Read and approved by me before publishing.

If you find a mistake, tell me on X and I'll fix it here.

## References

**In short:** The role map comes from my own research notes. The outside data is from the WEF Future of Jobs Report 2025, the US BLS 2025–35 projections and Microsoft's Work Trend Index 2026.

Outside data used in this post:

- [World Economic Forum, The Future of Jobs Report 2025](https://www.weforum.org/publications/the-future-of-jobs-report-2025/) (January 2025): employer survey, 2025–2030.
- [US Bureau of Labor Statistics, Employment Projections 2025–35](https://www.bls.gov/news.release/ecopro.nr0.htm) (27 Aug 2026): US occupations.
- [Microsoft, Work Trend Index 2026](https://www.microsoft.com/en-us/worklab/work-trend-index/agents-human-agency-and-the-opportunity-for-every-organization) (5 May 2026): 20,000 knowledge workers who use AI, 10 markets.

On this site:

- [Learning MCP by fixing it](https://www.wangyaodi.com/blog/learning-mcp-by-fixing-rubyllm): the reliability work mentioned in "Where I sit on the map".
- [VibeCare](https://www.wangyaodi.com/vibecare): maintenance for apps built with AI tools.

---

Discuss this post on X: reply to [@yorzi](https://x.com/yorzi) with a link to https://www.wangyaodi.com/blog/future-work-map-2026-2036
