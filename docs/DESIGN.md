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

### 1. The map: the AP Biology course (updated in session 2)
*Session 1 chose a journey through scale. Session 2 (owner's request) changed it to the AP Biology course framework.* The route shows all eight AP units in order, and each world sits under its unit. Units without a world yet are one faint line ("World coming"). Worlds aim at AP Biology first and also list GSE/NGSS standards, so regular Biology classes can use them too (simplify later rather than expand). Full discussion: [`focus-groups/02-ap-order-and-signal-siege.md`](focus-groups/02-ap-order-and-signal-siege.md).

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
| AP unit | World | Status |
| --- | --- | --- |
| 4. Cell Communication and Cell Cycle | **Signal Siege** (signaling, quorum sensing, feedback) | Live (boot camp, session 3) |
| 6. Gene Expression and Regulation | **Codon Rush** (replication, transcription, translation) | Live |
| 8. Ecology (with Unit 7) | **Symbio** (the evolution of cooperation) | Live |

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

### Signal Siege: plan, run, explain (session 3)
*Session 2 built a real-time raid game. On the owner's iPhone it felt wrong (banners over the board, tiny targets), so session 3 ([focus group](focus-groups/03-signal-siege-boot-camp.md)) compared genres with a second class and chose lane puzzles.*

You place immune cells on a 5 × 7 board, press **Run**, and bacteria come down the lanes toward your tissue. Runs are deterministic. A coach panel beside the board (above it on phones) gives instructions, live explanations and results, and **never covers the board**. Code: `worlds/signal-siege/engine.js` (rules), `levels.js` (boot camp) and `game.js` (screens). The raid version is in git history; the original upload is in `_archive/incoming/`.

- **Signals:** paracrine (within 2 squares: chemokine, IL-10), juxtacrine (cells that share an edge: antigen, T cell help) and endocrine (the whole board: epinephrine). Each working cell shows a green dot. Tapping a cell shows its reception → transduction → response steps.
- **Boot camp:** 8 levels, one AP idea each (table in the focus group record). Level 1 is a step-by-step tutorial, and levels 1–2 pause the first run to explain.
- **Stars:** stop the infection; no bacteria reach your tissue; and a lesson star (cheapest plan, never reach a quorum, or no cytokine storm). **Goal:** a star on all 8 levels. **Stretch:** all 24 stars.

**Balance: every layout tried.** For each level the checker ran every legal placement of the available cells and recorded the result.

| Level | Layouts | Win | 3 stars | Cheapest perfect plan |
| --- | --- | --- | --- | --- |
| 1. First contact | 16 | 31% | 31% | 50 ATP (any square in the lane) |
| 2. Call for backup | 13 | 46% | 46% | 50 ATP |
| 3. Out of reach | 277 | 45% | 2 layouts | 50 ATP (the one sweet spot) |
| 4. Touch to talk | 2,773 | 4 layouts | 4 layouts | 110 ATP (the full contact chain) |
| 5. Slippery capsules | 9,079 | 6 layouts | 6 layouts | 150 ATP (chain plus two B cells) |
| 6. Through the blood | 29 | 48% | 48% | 60 ATP (the adrenal gland, anywhere) |
| 7. Quorum | 11,371 | 59% | 1% (never reach a quorum) | 40 ATP wins, 3★ needs a high defense |
| 8. Cytokine storm | 18,939 | 17% | 8.8% (no storm) | 40 ATP wins, 3★ needs IL-10 |

An empty board loses every level. Levels 4 and 5 have very few answers, so their briefs give a hint, and the dots and signal lines show the chain working as you build it. The goal needs each level understood once. The stretch needs the efficient, lesson-perfect plan on all eight.

### Open questions for next time
- Signal Siege: missions after boot camp (viruses and killer T cells; cholera and pertussis toxins for Topic 4.4)? A free-build sandbox? A real class playtest.
- Which worlds come next for AP Units 1, 2, 3, 5 and 7?
- Should the old Symbio site link to Biodyssey (a "Symbio has moved" banner)?

## Content check log
**Round 3 (November 6, 2026): Signal Siege boot camp.** Carries over the round 2 sources (quorum sensing, contact signaling between immune cells, opsonization, chemokines, IL-10 and cytokine storms). New in this round:
- *Epinephrine (endocrine):* catecholamines rapidly raise circulating neutrophils by releasing cells marginated along vessel walls (Benschop, Rodriguez-Feuerhahn and Schedlowski 1996, *Brain Behav. Immun.*). The game shows this as "twice as many neutrophils released" at every capillary. Epinephrine acting through a G protein-coupled receptor and cAMP is the classic AP Topic 4.3 example.
- *Reception → transduction → response* text for each signal: chemokine receptors are G protein-coupled (CXCR1/2); T cell receptor signaling runs through a kinase cascade; CD40 on B cells is activated by CD40L on helper T cells; the IL-10 receptor signals through JAK/STAT kinases.
- *Simplifications, stated in the game's wording:* signals have a fixed range of 2 squares; neutrophils live seconds, not hours; "double damage" stands for faster phagocytosis of tagged bacteria.
- *Appropriateness:* no gore, no names or rankings, and losing is framed as "change my plan."

**Round 2 (November 6, 2026): Signal Siege.**
- *Quorum sensing:* bacteria release autoinducers and switch on shared genes (including virulence factors and biofilm formation) once the signal is strong enough (Miller and Bassler 2001, *Annu. Rev. Microbiol.*; Rutherford and Bassler 2012, *Cold Spring Harb. Perspect. Med.*). Autoinducer raises its own production, which is positive feedback (Fuqua, Winans and Greenberg 1994, *J. Bacteriol.*). Toxins under quorum control are real: *Staphylococcus aureus* regulates toxins through its *agr* quorum system. Quorum sensing is an AP Topic 4.1 example.
- *Contact signaling between immune cells* (dendritic cell → helper T cell → B cell and killer T cell) is an AP Topic 4.1 example. Helper T cells activate B cells through CD40L contact plus cytokines (Janeway's *Immunobiology*).
- *Opsonization:* capsules (e.g., *Streptococcus pneumoniae*, the pneumonia site) resist phagocytosis, and antibody coating speeds it up (Janeway's *Immunobiology*).
- *Chemokines:* IL-8 (CXCL8) recruits neutrophils by chemotaxis (Baggiolini 1998, *Nature*). Neutrophils are short-lived (Summers et al. 2010, *Trends Immunol.*); the game compresses their hours into seconds.
- *Feedback:* uncontrolled inflammation (cytokine storm) damages the host. IL-10 from regulatory T cells and other cells is anti-inflammatory (Saraiva and O'Garra 2010, *Nat. Rev. Immunol.*). Sepsis is life-threatening organ dysfunction caused by a dysregulated host response to infection (Singer et al. 2016, *JAMA*, Sepsis-3), so that site has the lowest storm threshold.
- *Sites:* bacterial pneumonia often follows influenza (McCullers 2014, *Nat. Rev. Microbiol.*); chronic wounds harbor biofilms (James et al. 2008, *Wound Repair Regen.*).
- *Base:* growth factors signal through receptor tyrosine kinases (paracrine); insulin travels in the blood (endocrine) and increases glucose uptake. "Makes 50% more ATP" is a stated game simplification.
- *Simplifications, stated in the game's wording:* a "quorum hub" stands for a dense cluster releasing autoinducer; infected cells "barely" take phagocyte damage (killer T and NK cells are the main killers).
- *Appropriateness:* no gore ("destroy," not graphic language). No names, rankings or leaderboards. The old version's student-number login, roster, answer logging and leaderboard were removed.

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
