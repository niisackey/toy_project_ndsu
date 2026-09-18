# Student Finance Coach

## Project description

A personal finance tracker built for the specific reality of a grad student on a
stipend with a couple of credit cards: track accounts and spending, budget by
category, set a savings goal, and get plain-language guidance on using credit
cards to build a healthy credit history - all in one small, self-hosted web app
(Node.js/TypeScript + Express API, React/TypeScript frontend, SQLite storage).
It implements seven major features - see [Features](#features) below - well
past the three required for this assignment.

## Open-source reference project

**[Firefly III](https://github.com/firefly-iii/firefly-iii)**
- GitHub: https://github.com/firefly-iii/firefly-iii
- A popular, mature self-hosted personal finance manager (accounts, budgets,
  recurring transactions, reports, "piggy banks" for goals).

This project is an **original implementation**, comparable in scope to Firefly
III but not copied from it - no code, schema, or assets were reused. See
[Comparison to Firefly III](#comparison-to-firefly-iii) below for a detailed
breakdown of what's implemented, what's deliberately left out, and what's
original to this project.

## AI tools used

**[Claude Code](https://claude.com/claude-code)** (Anthropic's agentic CLI
coding tool) wrote the code, but the design and direction were mine. This was
a directed, iterative build, not a single "build me an app" prompt:

- I picked the domain and the target user (a grad student managing a stipend
  and their first credit cards) and the specific pain points to solve for -
  not a generic budgeting app, but one with student-specific needs like
  semester/annual fees, biweekly work-study paychecks, and credit-building
  guidance.
- I specified each major feature myself and refined them across multiple
  rounds: adding credit card statement-closing/due-date tracking after
  reviewing the first pass, requesting biweekly/daily recurring frequencies
  for realistic pay schedules, and defining exactly how the AI-insights
  feature should behave (grounded in real account data, with a deterministic
  rule-based fallback so the app never depends on an external API to work).
- I made the product/architecture calls: no Docker, no ORM, keeping the
  stack minimal and self-contained; SQLite over a hosted database; the
  specific scope boundary against Firefly III (what to include vs.
  deliberately leave out).
- I rejected the first UI pass as too plain, directed the redesign toward a
  sidebar layout, and then specifically requested a shadcn/ui-based rebuild
  (Tailwind + Radix primitives) and further design fixes (chart styling, the
  Insights section's look) after reviewing what Claude Code produced.
- I ran and tested the app myself at each stage, catching real issues along
  the way (a timezone bug in due-date calculations, an orphaned dev-server
  process masking a fix, an Anthropic API key workspace-scoping error) that
  Claude Code diagnosed and fixed once I reported the symptoms.

In short: Claude Code is the pen; the requirements, feature set, UX
direction, and debugging feedback loop were mine.

## Features

1. **Accounts & transactions** - checking, cash, savings, and credit card
   accounts; income/expense/transfer transactions; balances (and credit
   utilization) computed automatically from transaction history.
2. **Categories & budgets** - categorize transactions and set monthly spending
   limits per category, with live spent-vs-budget tracking.
3. **Reports & dashboard** - spending by category, income vs. expense trends,
   and an account balances overview, all charted.
4. **Recurring transactions** - define recurring bills/income (rent, a
   stipend, a subscription, a *semesterly* student activity fee, a *yearly*
   renters insurance premium) on a weekly/monthly/semesterly/yearly schedule;
   the app catches up and generates the actual transactions automatically, no
   cron daemon needed.
5. **Savings goals** - set a goal (e.g. "buy a $7,000 car"), link it to a
   dedicated savings account, and see progress plus a projected completion
   date based on your recent savings pace.
6. **Credit health simulator & education** - a simulated, educational credit
   score (not a real FICO/VantageScore - no bureau ever sees your data) built
   from your own utilization, on-time payment log, and credit age, with a
   transparent factor breakdown and built-in tips on using cards to build
   credit wisely. Each card also tracks its **statement closing day and
   payment due day**, so the app can warn you before a due date is missed -
   one missed payment is one of the fastest ways to damage a credit score.
7. **Insights** - a running feed of spending-trend alerts, budget overruns,
   credit utilization/due-date warnings, income diversification tips,
   savings-rate feedback, and goal pacing advice. When an `ANTHROPIC_API_KEY`
   is configured (see below), these are generated live by Claude from a
   snapshot of your actual data instead of fixed templates; without a key,
   the app automatically falls back to an equivalent deterministic rule-based
   engine, so it's fully functional either way.

## Tech stack

- **Backend**: Node.js + TypeScript, Express, SQLite via Node's built-in
  [`node:sqlite`](https://nodejs.org/api/sqlite.html) module (no native
  addon, no ORM - just hand-written SQL and prepared statements).
- **Frontend**: React + TypeScript, Vite, React Router, Recharts, lucide-react.
  UI components follow [shadcn/ui](https://ui.shadcn.com) conventions - Tailwind
  CSS + Radix UI primitives (Select, Dialog, Progress, Label, Separator) with
  the component source living in `client/src/components/ui/`, not an installed
  package.
- **AI insights (optional)**: Anthropic's Claude API (`@anthropic-ai/sdk`) -
  entirely optional, gracefully falls back to a rule-based engine when no API
  key is configured.
- **No Docker** - it's a single SQLite file and two small processes, on
  purpose, to keep it easy to run anywhere.

## Getting started

Requires Node.js 22+ (for built-in `node:sqlite` support).

```bash
npm install
npm run dev
```

This starts the API server on `http://localhost:4000` and the frontend on
`http://localhost:5173` (which proxies `/api` to the server). The database is
seeded automatically on first run with a realistic 3-month demo scenario
(two credit cards, a stipend + freelance income, a car savings goal, budgets,
and recurring bills) so the dashboard isn't empty on first look.

To reset the demo data at any point:

```bash
npm run seed
```

### Enabling AI-generated insights (optional)

By default, the Insights feed on the Dashboard is generated by a built-in
rule-based engine - no setup required, no external calls. To switch it to
live, LLM-generated insights instead:

```bash
cp .env.example .env
# then edit .env and set:
# ANTHROPIC_API_KEY=sk-ant-...
```

Restart the server (`npm run dev`) and the Dashboard's Insights section will
switch to an "AI-generated" badge. The server sends Claude a JSON snapshot of
your accounts, spending, budgets, recurring bills, goals, and credit-health
breakdown, and asks it to return specific, actionable insights grounded only
in that data. If the API call ever fails (no key, network issue, rate limit),
the endpoint automatically falls back to the rule-based insights so the
feature never breaks the app.

### Production build

```bash
npm run build
npm run start
```

This compiles both the server and the client and serves everything - API and
frontend - from a single Node process (`http://localhost:4000` by default).

## Project structure

```
server/   Express + TypeScript API, SQLite schema, seed data
client/   React + TypeScript frontend (Vite)
```

See `server/src/modules/*` for one folder per feature (accounts, transactions,
categories, budgets, recurring, reports, goals, credit, insights), each with
its own routes, service, and (where useful) types.

## Comparison to Firefly III

This project is comparable in functionality and scope to
[Firefly III](https://github.com/firefly-iii/firefly-iii), a popular
self-hosted personal finance manager, but implements its own, much smaller
codebase from scratch - no code was copied from Firefly III.

**Implemented here, comparable to Firefly III:**
- Multiple accounts (including credit cards) with running balances
- Income / expense / transfer transactions
- Categorization
- Monthly budgets with spent-vs-limit tracking
- Recurring transactions with automatic generation
- Reports/dashboard with charts
- Goals (analogous to Firefly's "piggy banks")

**Deliberately out of scope** (kept the project toy-sized):
- Multi-currency support
- Multi-user accounts / authentication
- A rules engine for auto-categorization
- Real bill-reminder notifications (email/push)
- Bank-import pipeline (Firefly's Data Importer, API tokens)
- A full double-entry journal/transaction-group model
- Tags, attachments, a real cron-based scheduler with an admin panel

**Added here, original to this project (not in Firefly III):** a simulated,
educational credit-health score with a transparent factor breakdown, credit
card statement-closing/payment-due-date tracking, semester/yearly recurring
fee schedules, built-in credit-building education content, and a financial
insights feed (spending trends, budget overruns, upcoming due dates, income
diversification, savings rate, goal pacing) that can run either as a
deterministic rule engine or as live Claude-generated analysis - all
motivated by the target user (a student managing their first credit cards
and semester/annual fees), not present in the reference project. The credit
score and AI insights are both clearly labeled in the UI as educational
estimates, not real credit bureau data or financial advice.
