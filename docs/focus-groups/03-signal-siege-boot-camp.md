# Focus group 3: a second class plays Signal Siege, and we pick the genre

**Date:** November 6, 2026
**From the owner:** on the iPhone the raid version "doesn't feel right": banners sometimes block the screen, and the area where you can do things feels really small. The owner wants a tutorial that "says what to do, you place, and then it simulates and explains," then levels as a **boot camp** that trains students on the game *and* the biology. It doesn't have to be Clash of Clans: "if there is another similar game that fits the biology better I'm open to it." The owner suggested trying it with another class.

## The panel

The original panel (Jordan, Maya, Luis; Ms. Ortiz, Mr. Kim, Ms. Patel; Dana, GUI designer), plus a **second class, "Period 5,"** who had never seen Biodyssey:

| Student | About them |
| --- | --- |
| Ana | Reads English as a second language; plays on a phone |
| Dev | Plays a lot of mobile strategy games |
| Kayla | Doesn't play games; strong student |
| Marcus | Gets impatient with long text |
| Priya | AP Bio, wants to be a nurse |
| Sam | Phone only at home, Chromebook at school |
| Tre | Plays a lot of games; competitive |
| Zoe | Anxious about "losing" in front of people |

## 1. Playtest of the raid version (phones)

- **Ana:** "The words popped up on top of the game and I couldn't see what was happening. I didn't know what to do first."
- **Marcus:** "I tapped and nothing happened, then like ten guys came out at once." (He was tapping on the red no-landing zone.)
- **Dev:** "On my phone the map is tiny. In real games like this you zoom and drag. Here you can't."
- **Kayla:** "I never understood *why* I won or lost. It was over too fast."
- **Zoe:** "Everything happens at once. I'd rather think first."
- **Priya:** "I liked the quorum hub idea. I just didn't learn it from playing. I learned it from the results screen."

**Dana:** Two problems. A real-time board with small targets is wrong for a phone, and explanations that pop up *over* the board fight the game for the screen. Explaining in a real-time game means interrupting it.

## 2. Which genre fits the biology?

| Option | What it is | Panel verdict |
| --- | --- | --- |
| Raid (current) | Drop troops on an enemy base in real time | Fun for Dev and Tre, lost everyone else. Tiny targets. Explanations interrupt. |
| Tower defense (original) | Build, then waves attack in real time | Better on phones, but you still watch chaos you can't read. |
| Real-time lane defense | Place defenders on a grid; enemies come down lanes | Big squares, works on phones. Placing *during* the wave is still frantic for Zoe and Ana. |
| **Plan → Run → Explain** | Lane puzzles: place cells, press Run, watch, read why | Chosen (below). |

**Mr. Kim:** Cell signaling is a system you *design*: who sends, who receives, how far it reaches. That's a puzzle, not a reflex test. The engineering version is "design, test, read the data, redesign."

**Ms. Ortiz:** And every AP idea maps to one rule you can show on the board: contact signals need cells that touch, paracrine signals have a range, hormones reach everything, quorum sensing needs a crowd, and feedback can run away.

**Dev:** If it's a puzzle, give me stars for doing it *perfectly*. That's the replay.

**Tre:** And a speed-up button for when I'm just watching.

**Zoe:** If I lose, I want it to tell me what to fix, and keep my layout so I can change one thing.

**Ana:** Show me where things work before I place them.

**Dana:** Then the rule for the whole screen: **the board is never covered.** Instructions, live explanations and results live in a coach panel beside the board (or above it on phones). On phones the board is full width, rows where nothing can be placed shrink to thin "travel lanes," and the squares you place on stay big.

**Agreed:**
- **Genre:** *Plan → Run → Explain* lane puzzles. Bacteria come down lanes toward your tissue. You place immune cells, press **Run**, and the simulation plays and explains itself. It's deterministic, so the same plan always gives the same result.
- **Level 1 is the tutorial.** It tells you what to tap ("Tap Macrophage," "Tap the glowing square," "Press Run") and pauses the first run to explain phagocytosis. Level 2 pauses the first time neutrophils come out to explain paracrine signaling.
- **Boot camp:** eight levels, each one game skill plus one AP idea.
- **While planning:** each cell shows a green dot when it's working or a red dot when it isn't. Tapping a cell shows what it needs and its **reception → transduction → response** steps. Signal lines show who is talking to whom. When you pick a cell that needs a signal, the squares where it *would* work turn green.
- **Stars:** one for stopping the infection, one for no bacteria reaching your tissue, and a third that is the level's lesson: spend the fewest ATP, never let them reach a quorum, or no cytokine storm.
- **Losing** says exactly why ("Your capillary never switched on: it must be within 2 squares of a cell that sends chemokine") and keeps your layout.
- A **speed button** (1× / 2×) during runs.
- **Goal:** finish boot camp (a star on all 8 levels). **Stretch:** all 24 stars.

## 3. Boot camp

| # | Level | Game skill | AP idea |
| --- | --- | --- | --- |
| 1 | First contact | Place a cell, press Run | Phagocytosis (innate immunity) |
| 2 | Call for backup | Use a signal to switch on another cell | Paracrine signaling (chemokine → capillary → neutrophils), 4.1 |
| 3 | Out of reach | Position matters | Paracrine range, 4.1 |
| 4 | Touch to talk | Build a chain | Juxtacrine signaling (dendritic → helper T → B cell), 4.1 |
| 5 | Slippery capsules | Counter a special enemy | Antibodies and opsonization |
| 6 | Through the blood | One piece affects the whole board | Endocrine signaling (epinephrine), 4.1–4.3 |
| 7 | Quorum | Stop them early | Quorum sensing, 4.1 |
| 8 | Cytokine storm | Manage a meter | Positive and negative feedback, 4.5 |

## 4. Checking every layout

Because runs are deterministic, the computer tried **every possible layout** of every level (up to about 19,000 per level). Results are in `docs/DESIGN.md`. What the checker changed:
- Macrophages that guarded neighboring lanes too made several levels trivial. They now guard their own lane ("put it in the path"), which is also easier to understand.
- Levels 6–8 could be won with an empty board. The waves were made heavier until the lesson piece was needed.
- On Quorum, every layout let the bacteria reach a quorum at some point, so the third star became "never let 4 gather."
- Inflammation could run away without limit, so it's now capped.

## 5. Designer review (after the build)

- Board size was set from the window height so the whole board fits on a Chromebook screen.
- On phones the coach sits *above* the board and the Run button below it. The pinned Run bar was dropped because it covered the bottom row.
- Bacteria were redrawn as rods, not circles.
- The lane entry tags ("↓ 8") hide once the run starts, so they don't cover incoming bacteria.

## Still open

- **Missions after boot camp:** harder mixed levels (viruses and killer T cells; cholera and pertussis toxins, which break G protein signaling, AP 4.4).
- Do we want a **free-build sandbox**?
- **Have a real class play it.** The owner's idea of a second class was the right call. Watching Period 5 is what showed the phone problems.
