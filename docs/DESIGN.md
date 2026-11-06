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

## Decided in design session 1 (November 6, 2026)
Full discussion: [`focus-groups/01-design-session.md`](focus-groups/01-design-session.md).

### Safety charter
The owner asked for a site that *safely* lets students travel through biology. The panel agreed:
1. **No accounts:** no logins, student numbers or emails. A name is optional, only used on printouts, and stays on the device.
2. **Nothing is sent anywhere:** no server, analytics, ads, cookies or trackers. Every page has a Content Security Policy that blocks sending data (`connect-src 'none'`, `form-action 'none'`), and fonts (Inter, JetBrains Mono) are self-hosted in `core/fonts/`.
3. **Outside content:** only Symbio's teacher-chosen video, in YouTube's privacy-enhanced mode with no related videos. No social media links.
4. **No student-to-student contact:** no chat, shared boards or public leaderboards.
5. **Work can't be lost silently:** autosave, backups, a reminder when there's progress and no backup in 3 days, and a backup prompt when a goal is reached.
6. **Restores are checked:** only Biodyssey keys, a size limit, valid saved data, and a confirmation before replacing anything. Student text is always shown as text.
7. **No dead ends:** every page links back to the map, and Back always works.
8. **Content check** before every release, and a plain-language [Safety and privacy](../privacy.html) page for families and administrators.

### 1. The map: a journey through scale
The odyssey zooms out through the levels of organization (molecules → cells → populations, with organisms and ecosystems to come). It is a vertical route with a scale rail, which reads the same on a phone and a Chromebook. Only levels with worlds are shown.

### 2. Progression: free choice
No locks between worlds; the map's order is the suggested route. Each world has **one goal** (green check) and **one stretch goal** (amber star). A world is complete when its goal is reached. No points across worlds and no rankings. The home page's one primary button continues the last unfinished world.

### 3. Inside a world
Every world shares the **world bar**: Odyssey (back to the map) · title · Notes · Back up · More. New worlds follow **Brief → Play → Check → Results**, with directions behind "How it works." Existing games keep their own inner flow (Symbio's two-day Expedition).

### 4. The world contract
See [`WORLD-CONTRACT.md`](WORLD-CONTRACT.md).

### 5. Notes and the study guide
One notebook per world with two or three prompts, opened from **Notes** in the world bar (a side panel, or a bottom sheet on phones). It autosaves. **My notes** shows every notebook and prints them all as one **Study guide** with name, date and lines.

### 6. Teacher tools
A **Teacher guide** page: the worlds with time, topics, standards and goals, a **Copy link** per world for Classroom, how to run a period, and how work is turned in (PDF printouts and save codes). Symbio keeps its own Teacher tab and teacher mode. A Google Sheets turn-in stays on the Later list, because it would send data.

### 7. The worlds
| # | Level | World | Status |
| --- | --- | --- | --- |
| 1 | Molecules | **Codon Rush** (replication, transcription, translation) | Live |
| 2 | Cells | **Signal Siege** (cell communication, immune defense) | Coming soon: see below |
| 3 | Populations | **Symbio** (the evolution of cooperation) | Live |

### Codon Rush goal calibration
Simulated 20,000 rounds per player type (time per base and per codon, error rates):

| Player | Goal per round (Standard, 90%+) | Stretch per round (Challenge, no mistakes, under par) | Stretch within 5 tries |
| --- | --- | --- | --- |
| Rushes (12% base errors) | 27% | 0% | 1% |
| Careful, first rounds | 92% | 0% | 2% |
| Careful, practiced | 99% | 31% | 85% |
| Expert | 100% | 49% | 97% |

An 85% goal let rushing players through too often (82% within 3 rounds), and a "95%, under par" stretch was reached by 88% of practiced players' rounds, so both were tightened.

### Symbio as a world
Symbio now lives in `worlds/symbio/`. Its data moved to `biodyssey.symbio.*`. Students who used the old Symbio site keep their progress, because both sites share one web address (matthewtbennett95-ui.github.io), so the first visit copies it over (teacher mode excluded). Old `SYMBIO-SAVE:` codes still restore. Goal: all 8 Expedition chapters. Stretch: 9+ on the Check-in Quiz. Changes from the original: self-hosted fonts, the security policy, Symbio's Save/Load buttons open the Biodyssey backup window, and the Facebook backup video link was removed.

### Signal Siege: waiting on files
The uploaded `incoming/signal_siege.html` can't run by itself: its building list, signals and settings come from a Google Apps Script server (`Code.gs`) or a preview data file, neither of which was uploaded. Bringing it in needs:
1. The owner uploads the rest of the project (`Code.gs`, the preview/mock data file, `teacher.html`).
2. Remove the student-number login, roster check, server saving, answer logging and leaderboard. Save through `Biodyssey.store` instead.
3. Restyle to the design system (it currently uses its own dark theme and fonts), calibrate its goals by simulation, run the content check, and decide whether it fits regular Biology or only AP.

### Open questions for next time
- Should Signal Siege be AP-only, or have a Standard level?
- Which world comes next for Organisms and Ecosystems?
- Should the old Symbio site link to Biodyssey (a "Symbio has moved" banner)?

## Content check log
**Round 1 (November 6, 2026).**
- *Codon Rush, fixed:* Replication mode built the new strand in the 3′→5′ direction. DNA polymerase only adds nucleotides to a 3′ end, so new strands grow 5′→3′ (Kornberg's work on DNA polymerase; any intro text such as Campbell Biology, ch. 16). The parent strand is now shown 3′→5′ and the new strand 5′→3′, and the directions say so.
- *Codon Rush, checked and accurate:* the standard genetic code table (all 64 codons, AUG start, UAA/UAG/UGA stop); template strand read 3′→5′ while mRNA is built 5′→3′; base pairing (A–U in RNA, A–T in DNA); stop codons are recognized by release factors rather than tRNA; proteins grow from the N- to the C-terminus.
- *Symbio:* unchanged science, previously checked (Axelrod 1984; Wilkinson 1984; Carter and Wilkinson 2013; Kiers et al. 2003; Bshary and Grutter 2006; Sherman 1977).
- *Classroom appropriateness:* no graphic content; neutral, encouraging language; no names or rankings shown to other students; printouts are emoji-free.
- *Standards cited:* GSE Biology SB2a and NGSS HS-LS1-1 (Codon Rush); NGSS HS-LS2-8 and HS-LS4-4 (Symbio).

## Bringing in the owner's existing games
The owner has more biology games in other projects. To bring one in:
1. Upload its files into `incoming/<game-name>/` (on GitHub: **Add file → Upload files**), or paste the code into a session.
2. In a session: review it, check its science, decide which world it belongs to, then adapt it to the world contract and the design system on a branch.
3. Test it, run the focus group if it needs design changes, run the content check, open a pull request and merge.

## Later
- Cloud sync with school Google sign-in (Firebase), if the district approves.
- A Google Sheet turn-in for teachers (students' Chromebooks can already reach Google Sheets through Apps Script, as the owner's fab lab printer queue does).
- A class leaderboard that compares seasons with classmates.
