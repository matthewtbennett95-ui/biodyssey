# Biodyssey: notes for Claude

Biodyssey is a free website of classroom biology games, organized as an **odyssey** that students travel through, **world** by world. Read `docs/DESIGN.md` before starting any work. It holds the decisions made so far and the open questions.

## Who it is for
- High school biology students, mostly on **school Chromebooks** (managed devices that may block file access). The owner, a teacher, tests on an **iPhone**, so every page must also work at phone width.
- Classes use it over one or two class periods per world, so directions must be short and plain.
- **Anyone can use it.** There are no accounts, no logins and no personal data sent anywhere.

## How the owner works
- The owner is new to GitHub. Explain steps plainly and avoid jargon.
- Work on a branch, test, open a pull request, then **merge it once it is tested** (the owner has approved this workflow), and tell them when it is live.
- GitHub Pages serves `main`. Changes go live a minute or two after merging.
- Commit or push only finished, tested work. Never commit the owner's district files (such as standards spreadsheets).
- Larger decisions (naming, game design, interface) go through a short **focus group**, then get built. The panel is high school students with varied interest levels, a few teachers (biology, CTAE engineering, special-education co-teacher) and a professional GUI designer. The owner has said "whatever the focus group agrees on is fine."
- **Every round of work ends with a content check** for scientific accuracy (cite the real research) and classroom appropriateness. Fix anything that fails.

## Technical rules
- Plain HTML, CSS and JavaScript with **no build step**, so files open locally and on GitHub Pages as-is.
- Shared code lives in `core/` (design system, save system, notes, icons, printing). Each world is a folder in `worlds/<world-id>/` that uses `core/` instead of copying it.
- Games that involve chance or strategy are **balanced by simulation** before release. Goals and stretch goals are calibrated so the goal is achievable for a thoughtful player and the stretch goal really is a stretch.
- Test with Playwright (already installed in Claude Code cloud sessions: `require('playwright')`, use `NODE_PATH=$(npm root -g)`) at **1366×768** (Chromebook) and **iPhone 13**. Check for no page errors and no horizontal overflow. Look at screenshots before calling the visual work done.
- Use button ids (not button text) in tests.

## The interface bar (the owner's top priority)
The owner wants Biodyssey to look and feel as **professional, sleek and modern as possible**, like a polished app rather than a school worksheet. **Avoid clutter.** Before calling any screen done, check it against these:
- **One clear primary action per screen.** Secondary actions are quieter (secondary or ghost buttons), and rarely used tools hide in a menu or "more" control.
- **Progressive disclosure.** Show only what the student needs right now. Explanations, rules and details go behind a tap ("How it works"), and long content is split into steps.
- **Generous whitespace and a strict rhythm.** Use a 4px/8px spacing scale, consistent paddings and aligned edges. Never cram.
- **Short copy.** Headlines of a few words; one-line goals; plain language. Cut any sentence that doesn't help the student act.
- **Consistent components.** Reuse the same buttons, cards, chips, headers and modals everywhere, and never invent a one-off style when a component exists.
- **Restraint with color.** Mostly neutral surfaces; the brand color marks the primary action and the current location. Semantic colors (green, rose, amber) only where they carry meaning.
- **Motion is subtle and purposeful:** short fades and transitions that explain a change, never decoration.
- **Every state is designed:** empty, loading, success, error, locked and completed screens all look intentional.
- **Accessible:** readable contrast, 44px touch targets on phones, visible focus rings, labels on every icon.
- Review real screenshots at Chromebook and phone sizes, and include the GUI designer's eye in every focus group.

## Design system (inherited from Symbio, the first world)
- One brand color, indigo `#4f46e5` (hover `#4338ca`, soft `#eef2ff`). Green `#059669` means cooperate or good; rose `#e11d48` means defect or bad; amber `#d97706` means caution or stretch goal.
- Soft gray canvas `#f4f5f9`, white page panels (radius 20px), cards (radius 16px), 1px borders `#e4e7ee`, soft shadows.
- Inter typeface (Google Fonts) with system-font fallbacks, because some school networks block Google Fonts.
- **Interface icons are inline SVG with text labels**, never icon-only buttons. **Emojis are only for organisms, characters and game pieces**, never for buttons, headings or printouts.
- Every page has a header with a kicker, a title and a one-line plain-language goal.
- Printouts (journals, results, study guides) are clean and emoji-free, with name, date and lines for writing.

## Saving progress (decided)
- Progress and notes **autosave in the browser** (`localStorage`, keys prefixed `biodyssey.`). Clearing browsing data, or a Chromebook set to wipe data at sign-out, deletes it, so backups are first-class:
  - **Download a save file** (`.json`) to Downloads or Google Drive, and **upload it** to restore.
  - **Copy a save code** (plain text) to paste into a Google Doc or a Classroom comment, for Chromebooks that block files.
  - Show a gentle "last backed up …" reminder, and prompt for a backup at natural stopping points (finishing a world, ending a session).
- Teacher mode is never included in a save.

## Related repositories
- `matthewtbennett95-ui/symbiosis`: **Symbio** (the evolution of cooperation), live at https://matthewtbennett95-ui.github.io/symbiosis/. It is the first world to bring in. Its `index.html` holds the design system, icon sprite, save code and game patterns to reuse.
