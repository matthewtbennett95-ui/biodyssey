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
| 4. Cell Communication and Cell Cycle | **Signal Siege** (signaling, quorum sensing, feedback) | Live (rebuilt in session 2) |
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

### Signal Siege (rebuilt in session 2)
Build a lymph node, then raid infection sites, in the base-building strategy genre (original names, art and look). Code: `worlds/signal-siege/engine.js` (rules, also used by the simulations) and `game.js` (drawing and screens). The original upload is kept in `_archive/incoming/`.
- **Base:** cells work only when they receive their signal. Fibroblasts send growth factor (paracrine, 2 tiles) to respiring cells, which make ATP. Dendritic cells present antigen to helper T cells by touch (juxtacrine), and helper T cells activate B cells and killer T barracks by touch. A pancreatic islet sends insulin to every respiring cell (endocrine). Macrophage posts give Chemokine signals, B cells give Antibodies, and regulatory T cells give IL-10.
- **Raids:** neutrophils (fast, cheap, short-lived), macrophages (tough, target toxin colonies) and killer T cells (destroy infected cells). Quorum hubs send autoinducer to toxin colonies, whose toxins only fire while they receive it. The hub's reach grows during the raid (positive feedback). Capsules resist phagocytes unless antibodies tag them. Inflammation rises faster the higher it gets, and above the threshold a cytokine storm damages your own cells. IL-10 slows it (negative feedback).
- **Stars:** quorum hubs destroyed, 50% cleared, 100% cleared. Each new star pays bonus ATP. Replays pay half loot.

**Balance.** Simulated raids per site with the army and signals a student would have by then.

| Site | Careless, one try (≥1 star) | Careful, 3 tries (≥1 star) | Careful, 3 tries (3 stars) |
| --- | --- | --- | --- |
| Splinter | 88% | 100% | 100% |
| Scraped knee | 57% | 100% | 93% |
| Strep throat | 100% | 100% | 100% |
| Sinus infection | 0% | 100% | 53% |
| Pneumonia | 22% | 100% | 100% |
| Flu, then bacteria | 42% | 100% | 53% |
| Wound biofilm | 32% | 100% | 100% |
| Sepsis | 28% | 100% | 35% |

"Careless" sends only neutrophils, all at once, from a random side. "Careful" reads the map (attacks from the side with the easiest path), sends macrophages first and neutrophils in two waves, tags capsules, and uses chemokine on the hub. After a loss it tries a different side. So the **goal** (a star on every site) is reachable for a careful player, and a careless one stalls by Sinus. The **stretch** (all 24 stars) comes out at about 9% for a careful player allowed three tries per site, so it takes practice and experimenting. Players who try every approach per site reach it.

**Economy.** A careful student walking the campaign (building what each site needs, two raids per site) reaches Sepsis after about 50 minutes of play, so the goal fits in one or two class periods.

### Open questions for next time
- Signal Siege: bring back a "defend your lymph node" mode as a later day? Add G protein toxin sites (Topic 4.4)?
- Which worlds come next for AP Units 1, 2, 3, 5 and 7?
- Should the old Symbio site link to Biodyssey (a "Symbio has moved" banner)?

## Content check log
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
