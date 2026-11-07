# Focus group 4: making Signal Siege think harder

**Date:** November 7, 2026
**From the owner:** the phone interface "worked well," but the game "feels a little too elementary and not too difficult or challenging or involving additional thinking."

Same panel as [session 3](03-signal-siege-boot-camp.md): the original panel plus the Period 5 class. Each person played all eight boot camp levels first.

## 1. Why it feels elementary

- **Priya (AP Bio):** "Every level tells you the answer. 'Put the B cell behind the macrophage.' I didn't figure anything out, I followed directions."
- **Dev:** "There's one right answer and the game basically points at it. No reason to replay except the cheapest-plan star."
- **Kayla:** "I always knew exactly what was coming down each lane. No surprises."
- **Tre:** "More cells is always better. I never had to choose."
- **Ms. Ortiz:** "It stops at *which kind* of signal. AP asks what happens inside the cell, at reception, transduction and response, and what happens when a part of the pathway breaks. That's Topic 4.4, and it's where students struggle."
- **Mr. Kim:** "Nobody has to think before pressing Run. In engineering you predict, test, and compare. Here you just test."
- **Ms. Patel:** "The boot camp is right for my students. Don't make *it* harder. Add something after it."

**Agreed:** keep boot camp as training, and build the challenge after it.

## 2. What gets added

**Ms. Ortiz:** Toxins that hijack signal transduction are perfect, and they're real. *Pertussis toxin* (whooping cough) disables Gi, the G protein that chemokine receptors use, so cells receive the signal but can't relay it. *Cholera toxin* locks Gs in the "on" position, so the cell keeps responding with no signal at all. Those are textbook examples of a broken pathway.

**Mr. Kim:** Then every cell should show which relay its receptors use. The student has to reason: "pertussis breaks Gi; my capillaries use Gi; keep the bacteria away from them, or kill those bacteria before they get close."

**Priya:** And don't tell me what's coming. Give me a case like a patient: symptoms and lab results. I'll figure out what that means.

**Dana:** That's a *case file*: a short story and three findings. The board only shows how many bacteria come down each lane, not what kind. It collapses after the first run so it doesn't crowd the board on phones.

**Mr. Kim:** Before each run in a case, make them **predict**: all stopped, some get through, or the infection wins. Then show whether they were right. Predicting forces them to run the system in their head.

**Tre:** Make the budgets tight and give me more lanes than I can cover, so I have to choose.

**Zoe:** If they're hard, don't make me do them in order. Let me skip one I'm stuck on.

**Priya:** And let AP students skip boot camp if they already know it.

**Agreed:**
- **Six cases** after boot camp, playable in any order:
  1. *The cough that won't stop* (pertussis toxin blocks Gi, Topic 4.4)
  2. *Stuck on* (cholera toxin locks Gs on, plus a cytokine storm, Topics 4.4 and 4.5)
  3. *Slippery and crowded* (capsules plus quorum sensing)
  4. *Two fronts* (more lanes than resources, amplification)
  5. *Sepsis* (when the immune response is the danger)
  6. *The unknown patient* (diagnose from three lab findings)
- **Case files** replace tips. Cell info shows each receptor's relay ("Chemokine → G protein (Gi)"). Toxin effects appear on the board ("Gi blocked," "Gs stuck on") and are explained cause-first in the results.
- **Predict before every case run.** Results say whether you were right, and the printout counts correct predictions.
- **"Already know the basics? Unlock the cases"** lets AP students test out of boot camp.
- **Goal:** solve 4 of the 6 cases. **Stretch:** 3 stars on all 6 cases. (Boot camp stars are optional practice.)
- **Dana:** In this world, all messages (even "goal reached, back up?") appear *inside* the coach panel, never as a pop-up over the board.

## 3. Balance

Cases have too many layouts to try them all, so each was tested three ways: 3,000 random layouts (how often you could win by luck), a search from hand-built plans (proof that 3 stars is possible, and the cost targets), and "move one piece of a winning plan anywhere" (how forgiving the answer is). Tables are in `docs/DESIGN.md`. In short:
- **Luck almost never works:** 0–5% of random layouts win.
- **Every case has a 3-star plan.**
- Several cases are unforgiving: moving one piece of a good plan still wins only 4–10% of the time. That's why the goal is 4 of 6 cases, not all 6.
- **Changes the search forced:**
  - *Slippery and crowded* and *The unknown patient* were impossible within budget, so their budgets rose and the unknown patient's waves were thinned.
  - *Sepsis* turned out to have a satisfying answer: more cells earns 1–2 stars, but the third star needs a regulatory T cell placed behind a macrophage, where it is protected and still in range.

## Still open

- Watch a real class play the cases. Are the case files readable for regular Biology?
- A "missions" mode for regular Biology with lighter case files?
