# Road to February

A 22-week plan for IB, capital markets and MBB interviews, running from 28 September 2026 to 28 February 2027, built as a static site with progress tracking. Every task is broken into its own steps, each ticked separately, with notes per task, so a two-hour task shows as eleven steps rather than one checkbox.

The Today page shows the current week's tasks, anything unfinished from earlier weeks, the Review cards due, the daily habits and the Zetamac log. The Plan page lists all 22 weeks, each week has its own page with the briefing, tasks, hard question and reflection, and each task opens in a side panel with its steps, the time you spent and notes.

Practice happens in three places. Review is a spaced-repetition deck of 74 technical interview questions that unlock as the weeks go on, plus any Brain entry you write yourself, and it brings each card back after 1, 3, 7, 14, 30 and 60 days as long as you know it. Maths is a three-minute drill of the percentages, margins, multiples, breakevens, share prices and returns that come up in cases. Benchmark scores you on the fifteen-point company test.

The logs are the Brain (concept notes), Deals, Cases (scored on structure, maths, synthesis and communication, with a target of 40 by February), Companies (one one-pager a week), Markets (a Friday snapshot of rates, currencies and commodities) and Firms. Reference pages cover the industry primers, the Excel and slide standard, the library and an After February roadmap that runs to offers in November.

Search is on ⌘K or `/`. With a task open, `j` and `k` move between tasks, and on the Review page Space shows the answer and 1, 2 and 3 grade it.

## Running it locally

```bash
node scripts/serve.js 8787
```

Then open http://localhost:8787. There is no build step.

## How progress is stored

Everything is saved in the browser first, so the site works offline and without an account. When `config.js` holds a Supabase URL and publishable key, progress is also backed up to Supabase under a private sync key, and Settings gives you a link to open once on your phone so both devices share the same progress. Each tick, note and entry carries a timestamp, so changes made on two devices merge rather than overwrite each other.

The database side is `supabase/schema.sql`. It stores one row per sync key, keyed by a SHA-256 hash of the key, and exposes only two functions, `rtf_get` and `rtf_put`, both of which need the key. The table has row level security on with no policies, so the publishable key cannot read it directly.

Settings also has a backup download and restore, which is worth doing now and then.

## Publishing

```bash
scripts/deploy.sh
```

This creates a public `road-to-february` repo under your GitHub account, pushes the site and turns on GitHub Pages from `main`. Re-running it pushes updates, and each deploy renames the offline cache so phones pick up the new version on their next visit.

Free Supabase projects pause after a week without activity, so `.github/workflows/keepalive.yml` calls the sync function every three days once `config.js` is filled in.

## Editing the plan

The weeks and tasks are in `assets/data/plan.js`, the Review questions in `assets/data/questions.js` (each with the week it unlocks), the primers, seeded Brain entries, standards and library in `assets/data/reference.js`, and every external link in `assets/data/links.js`. Task and step ids come from their position, so adding a step to the end of a task is safe, while reordering tasks or steps inside a week moves existing ticks to whatever now sits in that position.
