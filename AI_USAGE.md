# How I used AI on this build

The hiring brief says: _"We strongly expect candidates to use AI as much as possible. We only ask that you share how you used AI tools."_

The interesting part of that question isn't _"which model did you use?"_ — it's _"can you direct AI well enough to ship something that actually works?"_ This document is about my prompting and review discipline.

## My working principle

AI assistants are fast but will happily commit to a bad approach if you don't constrain them. The candidate's value-add is the **constraints** — the upfront instructions that force the AI down a defensible path, and the **review** — catching the moments where it goes off-script.

I went into this build with a clear policy: _no code until there is a plan I have signed off on, and no "it builds locally" claims that aren't verified by an automated browser session._

## Tools

- **Claude Code (Anthropic)** — driver for planning, code generation, SDK exploration.
- **agent-browser** — headless-browser CLI driven by Claude Code over Bash, used as my acceptance harness.

## Non-negotiable instructions I gave at the start

Before a single file was written, I gave Claude Code two hard constraints:

1. **"Plan properly before writing any code. Use plan mode."**
   I would not accept a "just-build-it" approach. I wanted a written architectural plan I could review — stack choice, adapter boundary, chunking strategy, aggregation logic, failure-mode handling — and I refused to greenlight implementation until that plan looked correct. The plan ended up at `.claude/plans/i-need-to-make-cryptic-sloth.md` (gitignored) and the final code maps almost 1:1 to it.

2. **"Use agent-browser and test the build using bash commands."**
   I would not accept "the build passed locally" as the acceptance bar. The proxy route had to be hit, the SDK module had to load in a real browser, and the toggles had to register clicks. _"It compiles"_ is not the same as _"it works."_

Both constraints were written into the prompts before implementation started, not added as fixes after a failure.

## Where my judgment redirected the AI

These are real moments where I caught the AI going wrong and pulled it back:

- **"We don't want to use their package, why do you think so?"** — Claude jumped to "use the SDK" because it was the convenient default. I read the brief literally: it says _"may use,"_ not _"must use."_ Forced a re-evaluation. After confirming the SDK was actually the right tool for the job (not just the convenient one), we used it — but the decision was deliberate, not assumed.

- **"Where did we get the API key from?"** — I sanity-checked that the AI knew the provenance of the credentials it was wiring up. Cheap test, important answer.

- **"Flip the video preview as it looks mirrored — but make sure no calculation changes."** — I specified the constraint up front. It's easy to "flip the video" by transforming the `MediaStream` before the SDK reads it, which would silently corrupt every HR estimate. By stating the invariant in the prompt, I forced a CSS-only fix (`scaleX(-1)` on the `<video>` element) that leaves the underlying frames untouched.

- **"The progress bar is not split into 60, correct it."** — Caught a UX issue (a single fill bar tells the user nothing about chunk boundaries) and prescribed the fix.

- **"What the fuck did you write here? When did I ask you to just build it?"** — Claude had drafted an `AI_USAGE.md` containing a fabricated "early prompts asked me to just build it" anecdote. That never happened — I demanded planning from the start. Hard correction.

- **"Why the fuck do we need to push DEPLOY.md? Same for WHAT_AND_HOW.md?"** — Those files were my personal interview-prep and deploy cheat sheets. The hiring panel doesn't need them. Cleaned the git push set down to actual deliverables.

- **"In git changes, make sure I have only the files I need to push for this assignment."** — Forced an audit of `.gitignore`, caught a real API key hardcoded in `DEPLOY.md` that would have been published if I hadn't asked.

Each of those is a place where the AI's first answer would have shipped a worse outcome.

## What my prompting style bought me

| | Without my constraints | With them |
| --- | --- | --- |
| Architecture | Likely a plausible-looking shell with placeholder SDK calls | An adapter-first integration informed by reading `RestClient.browser.js` line-by-line — that file revealed the exact `x-api-key` header convention, which made the proxy correct on the first try |
| Verification | "Build passed, ship it" | `agent-browser` smoke test caught the SDK's `new URL(proxyUrl)` rejecting our relative path — a bug that `next build` _cannot_ catch because it only fires at runtime in the browser |
| Doc honesty | Generic "AI saved time" platitudes | This file, which credits the actual prompts that shaped the build |
| Git hygiene | `.claude/` plus a real API key in `DEPLOY.md` pushed to a public repo | A clean push set with the key fully redacted, because I asked for an audit |

## On time saved

I'd estimate **6–8x speedup** vs. building this without AI. The more interesting number is **integration confidence**: the SDK source was read line-by-line rather than skimmed, the running app was verified by an automated browser session, and every documented "this works" claim has a corresponding agent-browser command in the transcript. That confidence wouldn't have existed if I'd let the AI move at its own pace without the constraints.

## What I'd want the hiring panel to take from this doc

I treat AI assistants the way I'd treat a fast, capable, slightly overconfident junior engineer: useful, sometimes brilliant, but only as good as the constraints and review you put around them. The constraints I chose for this build — plan-first, verified-via-browser, audit-the-deliverables — are the constraints I'd put on any production-shaped feature.
