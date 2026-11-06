# The world contract

Everything a game must provide to become a Biodyssey world. Decided in [focus group 1](focus-groups/01-design-session.md).

## 1. A folder

`worlds/<world-id>/index.html`, plain HTML, CSS and JavaScript with no build step. It loads the shared code instead of copying it:

```html
<link rel="stylesheet" href="../../core/biodyssey.css">
...
<script src="../registry.js"></script>
<script src="../../core/biodyssey.js"></script>
<script>Biodyssey.page({ world: '<world-id>', footer: false });</script>
```

`Biodyssey.page()` adds the **world bar** (Odyssey · title · Notes · Back up · More), the notes panel, the backup window and the printing tools.

## 2. A registry entry

Add the world to `worlds/registry.js`:

| Field | Meaning |
| --- | --- |
| `id` | Folder name and storage namespace, e.g. `codon-rush` |
| `n`, `level` | World number and level of organization (`molecules`, `cells`, `populations`, ...) |
| `status` | `open`, or `soon` for a designed "Coming soon" card |
| `title`, `art`, `tint` | Name, one organism or game-piece emoji, soft background color |
| `goal` | One plain line: what the student does |
| `path`, `time` | Link from the site root; class periods needed |
| `goals.goal`, `goals.stretch` | The goal and the stretch goal, calibrated by simulation |
| `prompts` | Two or three note prompts |
| `topics`, `standards` | For the Teacher guide |

## 3. Progress

```js
const W = Biodyssey.world('<world-id>');
W.report({ goal: true|false, stretch: true|false, summary: 'Best: 1200 pts' });
```

Goals are sticky: once reached they stay reached. The map shows a green check for the goal and an amber star for the stretch goal. Reaching one for the first time offers a backup.

## 4. Storage

Use `W.store.get(key, fallback)` and `W.store.set(key, value)`. Data lands in `localStorage` under `biodyssey.<world-id>.*`, so it is part of every backup automatically. Never use another prefix.

## 5. Printing

```js
W.print('Codon Rush results', '<h2>My round</h2> ...');
```

This asks for an optional name (kept on the device), adds name, date and class lines, and prints. Printouts are emoji-free, with lines for writing.

## 6. Safety rules (non-negotiable)

- No logins, names (except the optional printout name), student numbers or emails.
- Nothing sent anywhere: no `fetch`, forms, analytics or third-party scripts. Every page carries the Content Security Policy from `index.html` (`connect-src 'none'`, `form-action 'none'`). Only a world that plays a teacher-chosen video may add YouTube's privacy-enhanced hosts.
- No leaderboards, chat or shared boards.
- Student text is shown with `textContent` or escaped with `Biodyssey.esc`, never inserted as HTML.
- No links to social media. Any other outside link needs the owner's approval.

## 7. Before release

Test at 1366×768 and iPhone 13 with Playwright (no page errors, no horizontal overflow, screenshots reviewed), balance goals by simulation, run the content check, then open a pull request.
