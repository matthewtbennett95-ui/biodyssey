# Biodyssey

*A journey through the worlds of biology.*

Biodyssey is a free website of biology games for high school classrooms. Students travel the AP Biology course one world at a time, each world a game about one unit. They save their progress, keep their own notes, and print those notes as a study guide.

- **No accounts:** anyone can use it, and no personal data is collected or sent anywhere. See [Safety and privacy](privacy.html).
- **Progress saves automatically** in the browser. Students can also back it up as a save file or a save code and restore it on any device.
- **Works on Chromebooks and phones.**

## The worlds

The odyssey follows the AP Biology course, unit by unit. Each world also lists GSE/NGSS standards for regular Biology.

| AP unit | World | Biology |
| --- | --- | --- |
| 4. Cell Communication | Signal Siege | Signaling, quorum sensing, feedback, immune defense |
| 6. Gene Expression | Codon Rush | DNA replication, transcription and translation |
| 8. Ecology | Symbio | The evolution of cooperation |

## How it's built

Plain HTML, CSS and JavaScript with no build step: open `index.html` locally, or use GitHub Pages.

- `index.html`: the odyssey map. `notes.html`: My notes and the study guide. `teacher.html`, `privacy.html`.
- `core/`: the design system, fonts, saving, backups, notes, icons and printing (`biodyssey.css`, `biodyssey.js`).
- `worlds/registry.js`: the list of worlds. `worlds/<id>/`: one folder per world.
- `docs/DESIGN.md`: decisions, goal calibration and the content check log. `docs/WORLD-CONTRACT.md`: how a game plugs in. `docs/focus-groups/`: design sessions.
- `incoming/`: games waiting to be brought in. `_archive/`: original uploads already brought in (kept off the published site).

Fonts: Inter and JetBrains Mono, SIL Open Font License (see `core/fonts/`).
