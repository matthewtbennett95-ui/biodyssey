# Biodyssey design brief

*A journey through the worlds of biology.*

## The idea
Biodyssey gathers the owner's biology games into one free website. Students travel an **odyssey**: a map of **worlds**, each one a unit of biology with its own game, practice and notes. They earn progress as they go, keep their own notes, and print them as a study guide.

## Decided
- **Name:** Biodyssey (chosen by the focus group: one word, sounds like a game, keeps "Bio Odyssey").
- **Access:** a public website on GitHub Pages. No accounts and no personal data.
- **Look:** as professional, sleek and modern as possible, with no clutter. It starts from the Symbio design system and follows the interface bar in `CLAUDE.md`.
- **Saving:** autosave in the browser, plus backups as a downloadable save file or a pasteable save code (see `CLAUDE.md`).
- **Notes:** students can write notes anywhere (per world, per lesson). All notes print together as a study guide.
- **First world:** Symbio (cooperation, game theory and the evolution of altruism), brought in from `matthewtbennett95-ui/symbiosis`.
- **Structure:** a shared `core/` (design, saving, notes, icons, printing) plus one folder per world in `worlds/`.

## To decide in the first design session (with the focus group)
1. **The map:** how the odyssey looks and how students travel. A path, islands, a star map, a body/cell/ecosystem scale journey?
2. **Progression:** what unlocks what. Free choice versus a guided route, and what a "completed" world means (stars, badges, a checkpoint quiz?).
3. **Inside a world:** a common shape for every world. For example: briefing, play, check for understanding, notes, results.
4. **The world contract:** what each game must provide to plug in (its id, title and icon; how it reports progress and completion; where its notes go; its printable results).
5. **Notes and study guide:** how notes are written, organized and printed.
6. **Teacher tools:** a classroom link, teacher mode, answer guides, standards alignment (Symbio has a Georgia CTAE AKS and NGSS table to reuse), and a possible Google Sheets turn-in later.
7. **The list of worlds:** which existing games become which worlds, and in what order.

## Bringing in the owner's existing games
The owner has more biology games in other projects. To bring one in:
1. Upload its files into `incoming/<game-name>/` (on GitHub: **Add file → Upload files**), or paste the code into a session.
2. In a session: review it, check its science, decide which world it belongs to, then adapt it to the world contract and the design system on a branch.
3. Test it, run the focus group if it needs design changes, run the content check, open a pull request and merge.

## Later
- Cloud sync with school Google sign-in (Firebase), if the district approves.
- A Google Sheet turn-in for teachers (students' Chromebooks can already reach Google Sheets through Apps Script, as the owner's fab lab printer queue does).
- A class leaderboard that compares seasons with classmates.
