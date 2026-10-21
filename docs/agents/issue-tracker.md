# Issue tracker: Local Markdown

Specs live in `.scratch/<feature-slug>/spec.md`. Tickets live in `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, one file per ticket, numbered in dependency order.

When a skill says to publish, create these local files. When it says to fetch, read the referenced file and its comments. Do not publish to GitHub as part of this local workflow.

Record `Status: ready-for-agent` for approved, actionable work, `in-progress` while implementing, and `done` only when its acceptance criteria pass. Keep incomplete device checks explicit. Use `Blocked by:` to declare prerequisite tickets. Work only on tickets whose blockers are complete. Append discussion under `## Comments`.

The user approved this local tracker for the Android port. The GitHub remote remains `agustinrosano/DanteSurvivor`.
