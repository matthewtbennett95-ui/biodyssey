# Focus group 1: the first design session

**Date:** November 6, 2026
**Question from the owner:** design a site that *safely* lets students travel through biology knowledge, using Symbio and the two games in `incoming/` (Codon Rush and Signal Siege).

## The panel

| Who | Role | What they watch for |
| --- | --- | --- |
| Jordan | Student, 10th grade, plays a lot of games | Is it fun? Does it feel like a real app? |
| Maya | Student, 9th grade, not into biology | Is it obvious what to do? Can I finish? |
| Luis | Student, 11th grade, AP Bio | Is there a real challenge? |
| Ms. Ortiz | Biology teacher | Standards, accuracy, class time |
| Mr. Kim | CTAE engineering teacher | Systems, simulation, design process |
| Ms. Patel | Special-education co-teacher | Reading load, accommodations, losing work |
| Dana | Professional GUI designer | Clutter, consistency, the interface bar |

Before the session the panel looked at Symbio (live), Codon Rush and Signal Siege. Two facts shaped everything:

- **Signal Siege asks for a student number**, checks it against a roster, saves to a Google Sheet, logs quiz answers and shows a leaderboard with students' names. Its building list and settings also live on that server, so the uploaded file can't run by itself.
- **Codon Rush asks for "First and last name"** for its results card. It saves nothing else.

---

## 0. What "safe" means here (added by the owner's request)

**Ms. Patel:** Safe means three things to me: no student data leaves the room, kids can't wander off into the internet, and nobody loses an hour of work because a Chromebook wiped itself.

**Ms. Ortiz:** And the content is safe to put in front of any class: accurate, nothing graphic, nothing that singles a kid out.

**Mr. Kim:** I'd make it something we can *prove*, not just promise. A web page can carry a rule (a Content Security Policy) that tells the browser "this page may not send data anywhere." Then even a bug can't leak anything.

**Dana:** Same idea for fonts. Symbio loads Inter from Google, which means every student's browser contacts Google. Put the font files in the site.

**Jordan:** Leaderboards are fun though.

**Luis:** Not when you're last and your name is on the projector.

**Ms. Patel:** A ranked list of names is also student data. If a class wants to compete, the teacher can do it out loud or on their own device, the way Symbio's class tournament already works.

**Maya:** Does it need my name at all?

**Ms. Ortiz:** Only on what gets turned in. Students submit a printout or PDF, so the name has to be on it.

**Dana:** Then the name is optional, asked for only on printouts, and it stays on the device.

**Agreed (the safety charter):**
1. No accounts, logins, student numbers or emails. Signal Siege's login, roster saving, answer logging and leaderboard come out when it is brought in.
2. Nothing is sent anywhere. No server, analytics, ads, cookies or trackers. Every page carries a Content Security Policy that blocks sending data (`connect-src 'none'`, `form-action 'none'`), and fonts are self-hosted.
3. The only outside content is a teacher-chosen video, played in YouTube's privacy-enhanced mode with no related videos. No social media links (Symbio's Facebook backup link comes out).
4. No student-to-student contact: no chat, shared boards or public leaderboards.
5. A name is optional, used only on printouts, and kept on the device.
6. Work can't be lost silently: autosave, backups, and reminders at stopping points.
7. Restoring a backup is checked: only Biodyssey data, a size limit, and a confirmation before anything is replaced. Student text is always shown as text, never run as code.
8. Every page has a way back to the map, and the browser's Back button always works.
9. Every world passes the content check (cited science, classroom-appropriate) before it goes live.
10. A plain-language **Safety and privacy** page that a teacher can show a parent or an administrator.

---

## 1. The map

Options on the table: a winding path, islands, a star map, or a journey through scale.

**Mr. Kim:** Scale is the one that teaches something. Codon Rush is molecules, Signal Siege is cells, Symbio is populations. Students would literally zoom out through the levels of organization.

**Ms. Ortiz:** Levels of organization is a standard we teach in week one anyway.

**Dana:** Islands and star maps look great in a pitch deck and terrible on a phone. A vertical route reads top to bottom on a phone and stays clean on a Chromebook. Put a thin "scale rail" down the left with the size labels.

**Jordan:** Can it feel like you're traveling, though?

**Dana:** The rail and the markers do that. Big numbers ("World 1"), a line that fills in as you finish worlds. No decoration for its own sake.

**Maya:** I just want to see where I am.

**Dana:** The world you were last in gets a "You are here" marker, and the main button says "Continue Codon Rush."

**Agreed:** The odyssey is a **journey through scale**, from molecules to ecosystems, drawn as a vertical route with a scale rail. Only levels that have worlds are shown, with a quiet "More worlds on the way" at the end.

## 2. Progression

**Ms. Ortiz:** I don't teach units in the same order every year. Don't lock World 3 behind World 1.

**Ms. Patel:** Locks also punish the kid who was absent.

**Luis:** Then what does "finishing" a world mean?

**Mr. Kim:** Symbio's games already have a goal and a stretch goal. Use that everywhere.

**Dana:** And show it the same way on every card: a green check for the goal, an amber star for the stretch goal.

**Jordan:** Points? XP?

**Ms. Patel:** Points across worlds turn into a ranking. Goals are personal.

**Agreed:** **Free choice, with a suggested order** (the order on the map). Each world has **one goal and one stretch goal**. A world is *complete* when its goal is reached. No cross-world points and no rankings. Worlds that aren't ready show a designed "Coming soon" state.

## 3. Inside a world

**Dana:** Each game already has its own flow, and Symbio's is a full two-day expedition. Don't force them into one template. Give every world the same *frame*: a slim bar with "Odyssey" (back to the map), the world's name, **Notes**, and **Back up**.

**Ms. Ortiz:** New worlds should still follow a shape: a short briefing, play, a check for understanding, and printable results.

**Ms. Patel:** And the briefing must be short. Directions behind "How it works."

**Agreed:** Every world shares the **world bar** (Odyssey · title · Notes · Back up). New worlds follow **Brief → Play → Check → Results**, with directions behind a "How it works" tap.

## 4. The world contract

**Mr. Kim:** Write down exactly what a game has to provide, like an interface spec.

**Agreed:** See [`docs/WORLD-CONTRACT.md`](../WORLD-CONTRACT.md). In short, a world provides a registry entry (id, title, level, one-line goal, its goal and stretch goal, note prompts, time, standards) and reports progress through `Biodyssey.world(id).report({ goal, stretch, summary })`. It stores data only through `Biodyssey.store`, never sends data anywhere, and prints through `Biodyssey.print`.

## 5. Notes and the study guide

**Maya:** If I have to write notes, give me something to start with.

**Ms. Patel:** Two or three prompts per world. Sentence starters help my students a lot.

**Dana:** One notebook per world, opened from the world bar as a side panel (a bottom sheet on phones). Autosaves, no Save button.

**Ms. Ortiz:** One study guide that prints all of it, with name, date and lines.

**Agreed:** One notebook per world, with prompts, opened from **Notes** anywhere. A **My notes** page shows every notebook and prints them as one **Study guide**.

## 6. Teacher tools

**Ms. Ortiz:** I need a page with times, standards and how to run it, and a link per world I can post in Classroom.

**Mr. Kim:** A Google Sheet turn-in would send data out. That waits for district approval.

**Agreed:** A **Teacher guide** page: how a class period runs, each world's time and standards, a copyable link per world, how students turn work in (printouts, PDFs, save codes), and the safety summary. Teacher mode stays inside Symbio for now. Sheets turn-in stays on the "Later" list.

## 7. The list of worlds

| # | Level | World | Biology |
| --- | --- | --- | --- |
| 1 | Molecules | **Codon Rush** | DNA replication, transcription and translation |
| 2 | Cells | **Signal Siege** (coming soon) | Cell communication and immune defense |
| 3 | Populations | **Symbio** | The evolution of cooperation |

**Luis:** Signal Siege says "AP Biology." Is it too hard for a regular class?

**Ms. Ortiz:** We'll decide that when it comes in. It needs its missing files first, and its login and leaderboard have to go.

## Design review of the screens (Dana, after the build)

- One primary button per screen: the map's **Continue** / **Start**, Codon Rush's **Start round**, the backup window's **Copy save code**.
- Codon Rush's setup screen was long (demo, example, settings, scoring, best scores). The demo, the example and the scoring moved behind **How it works**; best scores only appear once there are some.
- Codon Rush's own fonts (Chakra Petch, Atkinson) and teal accent were replaced with Inter and the indigo brand color, so it looks like part of the same app. Its base colors stay, because they're game pieces.
- The backup reminder only appears when it is needed: there is progress and no backup in the last 3 days.
