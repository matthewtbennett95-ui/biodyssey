# Biodyssey

*A journey through the worlds of biology.*

Biodyssey is a free website of biology games for high school classrooms. Students zoom out through the levels of life, from molecules to populations, one world at a time. They save their progress, keep their own notes, and print those notes as a study guide.

- **No accounts:** anyone can use it, and no personal data is collected or sent anywhere. See [Safety and privacy](privacy.html).
- **Progress saves automatically** in the browser. Students can also back it up as a save file or a save code and restore it on any device.
- **Works on Chromebooks and phones.**

## The worlds

| # | Level | World | Biology |
| --- | --- | --- | --- |
| 1 | Molecules | Codon Rush | DNA replication, transcription and translation |
| 2 | Cells | Signal Siege (coming soon) | Cell communication and immune defense |
| 3 | Populations | Symbio | The evolution of cooperation |

## How it's built

Plain HTML, CSS and JavaScript with no build step: open `index.html` locally, or use GitHub Pages.

- `index.html`: the odyssey map. `notes.html`: My notes and the study guide. `teacher.html`, `privacy.html`.
- `core/`: the design system, fonts, saving, backups, notes, icons and printing (`biodyssey.css`, `biodyssey.js`).
- `worlds/registry.js`: the list of worlds. `worlds/<id>/`: one folder per world.
- `docs/DESIGN.md`: decisions, goal calibration and the content check log. `docs/WORLD-CONTRACT.md`: how a game plugs in. `docs/focus-groups/`: design sessions.
- `incoming/`: games waiting to be brought in.

Fonts: Inter and JetBrains Mono, SIL Open Font License (see `core/fonts/`).
