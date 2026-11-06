# Focus group 2: AP order, and rebuilding Signal Siege

**Date:** November 6, 2026
**From the owner:** order the worlds by the AP Biology course framework (aim at AP now, simplify for regular Biology later). Signal Siege is "supposed to be based heavily on Clash of Clans but it just isn't quite there." Asked which part of that feel matters most, the owner chose **both building and raiding, with raids first**.

Same panel as [session 1](01-design-session.md): students Jordan (plays a lot of games), Maya (not into biology) and Luis (AP Bio); Ms. Ortiz (biology), Mr. Kim (CTAE engineering), Ms. Patel (special-education co-teacher); Dana (GUI designer).

---

## 1. The map in AP order

**Ms. Ortiz:** The AP course framework has eight units. If the map follows them, I can point students at "Unit 4" and they know where they are.

**Dana:** Show all eight units on the route, even empty ones, as one quiet line each ("World coming"). Students see the whole course, and it doesn't clutter because the empty lines are faint and short.

**Luis:** Does Symbio still fit?

**Ms. Ortiz:** Unit 8 starts with behavior and cooperation (Topic 8.1), and it leans on natural selection from Unit 7. Codon Rush is Unit 6 (replication, transcription, translation). Signal Siege is Unit 4.

**Ms. Patel:** For regular Biology, keep the Georgia standards listed next to the AP ones, so the same worlds work for both classes.

**Agreed:** The route is the eight AP Biology units in order. Each world card sits under its unit. Each world lists AP topics plus GSE/NGSS standards. Cards drop the "Unit N" kicker, since the unit header above already says it.

## 2. What was missing from Signal Siege

The panel played the current version with preview data rebuilt from `Code.gs`.

**Jordan:** It's a tower-defense game. You build, then germs walk at you. The games it's going for are about *attacking*: you scout a base, drop troops, use spells, and get one to three stars. That's the part that's missing.

**Mr. Kim:** Its systems are great, though: cells only work if they get the right signal, paracrine range, juxtacrine contact, insulin as an endocrine boost, and cytokine storms. Keep all of that. It's the engineering of the base.

**Dana:** It's also very dense: a 13-item build list, a ligand legend always on screen, goals, a coach and a scout report. The rebuild should feel like a mobile strategy game: one big board, one big **Raid** button, and everything else a tap away.

**Ms. Patel:** And it asks for a student number and shows a leaderboard with names. Both have to go.

## 3. The rebuilt game

**Mr. Kim:** Make the biology the *rules* of the raid, not decoration. What if the enemy base runs on cell signaling too?

**Ms. Ortiz:** Quorum sensing. It's an example the AP framework lists in Topic 4.1. Bacteria release autoinducer, and once enough of it builds up they switch on virulence genes, including toxins. So: a **quorum hub** whose signal reaches the **toxin colonies** around it. Destroy the hub and they go silent.

**Luis:** That's a real strategy decision: go for the hub first, like taking out the main building.

**Ms. Ortiz:** And the hub's signal should *grow* during the fight, because autoinducer turns on more autoinducer production. That's positive feedback, which is Topic 4.5.

**Jordan:** Spells?

**Ms. Ortiz:** Signals you send: **chemokine** calls immune cells to a spot and speeds them up, and **antibodies** tag bacteria so phagocytes can destroy them (opsonization). Encapsulated bacteria, like the ones that cause pneumonia, resist phagocytes unless they're tagged.

**Mr. Kim:** And the base is where you earn those. Each working macrophage post gives a chemokine. Each B cell gives antibodies, but a B cell only works while a helper T cell touches it, and the helper T cell only works while a dendritic cell touches *it*. That's juxtacrine signaling as a build puzzle.

**Ms. Patel:** Keep inflammation: if students flood the board, a cytokine storm hurts their own cells. IL-10 from regulatory T cells calms it. That's negative feedback, and it rewards sending cells in waves.

**Maya:** Can I lose all my stuff?

**Dana:** No. The army leaves for a raid, and survivors come home. Nothing in your base can be destroyed. Failing just means trying again from another side.

**Dana (on the look):** The genre is fine, but it has to look like ours: clean isometric blocks with "cell" domes in our palette, cream and blush tissue backgrounds, our buttons and cards. No copied characters, names or art.

**Agreed:**
- **Two screens:** *your lymph node* (the base) and *the raid*. The one primary action at home is **Raid**. Build and Army are secondary, and How it works is a quiet link.
- **Base:** cells only work when they receive their signal: juxtacrine (touching), paracrine (within 2 tiles), endocrine (everywhere). Working cells make ATP, army space and raid signals. Upgrading the lymph node unlocks more cells.
- **Raids:** 8 infection sites in order (Splinter, Scraped knee, Strep throat, Sinus infection, Pneumonia, Flu then bacteria, Wound biofilm, Sepsis), each unlocked by one star on the previous site.
- **Stars:** one for destroying the quorum hubs, one for 50% cleared, one for 100%.
- **Goal:** at least one star on all 8 sites. **Stretch:** all 24 stars.
- **After every raid:** what happened (in biology terms), one quick check question, and a printable report.
- **Safety:** no login, no roster, no answer logging, no leaderboard, and no server. Progress lives in the Biodyssey save like every other world.

## 4. Balance

Simulated 50–60 raids per site per player type, using the army and signals a student would have by then. Full tables are in `docs/DESIGN.md`. Changes the simulation forced:
- Inflammation was too weak to ever cause a storm, so it now rises faster.
- Strep throat (two hubs) couldn't be cleared with a 20-space army, so its bacteria have 30% less health.
- Many toxin colonies started out of their hub's reach, so the starting signal reach went up.
- The economy took about 150 minutes, so ATP production and star bonuses went up. It's now about 50 minutes of play for the goal path.

## 5. Designer review (after the build)

- The scout map was blank: the canvas resized after drawing, so it now redraws on resize.
- A new respiring cell landed far from any fibroblast and didn't work, so new cells now land where they'll receive their signal.
- On phones, the battle board sat small in a tall frame. The frame now matches the board's shape, and the HUD labels were shortened.
- Picking a signal showed its description twice on phones, so the duplicate banner was removed.

## Still open

- A **defend** mode (infections attack your lymph node), which the old version had. Do we want it back as a later "day," once raids are solid?
- G protein toxins (cholera and pertussis, Topic 4.4) from the old version would make good later infection sites.
