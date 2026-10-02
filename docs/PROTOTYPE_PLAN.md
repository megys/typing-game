# Korean typing system prototype plan

## Goal

Prove that dialogue-based Korean typing feels satisfying and that native Korean IME input behaves reliably before integrating the system into a larger Godot narrative game.

The first audience is beginners learning Hangul. The trial supports words, short phrases, and dialogue on desktop and web. Players explicitly choose Hangul or romanization mode.

## Product decisions

| Area | Decision |
| --- | --- |
| Exercise | A short dialogue containing words and full lines |
| Hangul input | Built-in Korean two-set input by default, with native IME available as a toggle |
| Romanization | One intentionally taught spelling per answer |
| Modes | Separate Hangul and romanization sessions |
| Rhythm | Dialogue performance with gentle timing |
| Initial platforms | Desktop browsers, followed by Godot desktop and web |
| Primary proof | Satisfying feedback and reliable IME composition |

The browser prototype now includes a small Korean two-set composer so beginners can start from an English keyboard layout. Players can disable it at any time to restore native operating-system IME behavior.

## Architecture decision

Use two connected spikes:

1. Iterate quickly on feel, feedback, pacing, content, and scoring in this dependency-free browser prototype.
2. Build a minimal Godot input spike early, before expanding narrative content, to validate the same IME interactions in native and web exports.

Authored content remains separate from rendering and evaluation so its schema can transfer to Godot. The input layer may translate physical keys into composed text, but correctness remains based on Unicode NFC-normalized text.

## Milestones

### 1. Browser input feasibility

- Handle `compositionstart`, `compositionupdate`, and `compositionend` semantics.
- Score text only after IME composition has committed.
- Map physical QWERTY positions through the standard Korean two-set layout when built-in input is enabled.
- Allow players to revert to their operating-system Korean IME without restarting the scene.
- Support backspace, correction, refocusing, pause, and restart.
- Test Korean keyboard setup on Windows 11 and macOS.

Exit criterion: `안녕하세요` can be entered, corrected, and submitted without false errors.

### 2. Typing feel

- Compare pending, correct, and incorrect characters clearly.
- Advance completed lines without requiring an extra submission key.
- Keep timing gentle and avoid failure during the first trial.
- Add restrained visual and audio confirmation after the interaction is stable.

Exit criterion: players understand mistakes without composition being interrupted.

### 3. Dialogue loop

- Run one three-minute cafe scene with 8-12 lines and 15-25 unique words.
- Track accuracy, duration, and corrected mistakes.
- Keep content in authored data rather than UI code.

Exit criterion: players focus on the conversation rather than the input control.

### 4. Romanization and beginner assistance

- Display Hangul alongside the romanization target.
- Treat capitalization as flexible while keeping spaces and punctuation meaningful.
- Provide a Korean keyboard setup check and optional layout reference.
- Explore gradually reducing romanization hints in a later trial.

Exit criterion: rules remain predictable across every prompt and beginners can start without knowing the keyboard layout.

### 5. Godot compatibility spike

- Recreate one prompt using Godot's text input and IME APIs.
- Validate composition display, commit, correction, focus, fullscreen, and windowed behavior.
- Test native Windows/macOS builds and Godot web export.
- Compare the behavior with the browser prototype.

Exit criterion: the successful browser interaction can be reproduced closely enough in all target Godot builds.

### 6. Playtest decision

Test with 5-10 Korean learners, including at least two Windows devices and multiple browsers. Capture:

- False errors during IME composition
- Completion and abandonment by line
- Corrected mistakes and completion time
- Whether feedback explains the error location
- Whether timing supports or distracts from dialogue
- Whether romanization reinforces pronunciation or encourages guessing
- Operating system, browser, mode, and prior Korean keyboard experience

## Go/no-go criteria

Proceed to full Godot integration when:

- Korean composition works reliably on Windows and macOS.
- Browser and Godot behavior are acceptably close.
- At least 90-95% of playtest lines complete without input confusion.
- Players distinguish composition-in-progress from actual mistakes.
- Dialogue pacing remains enjoyable in both modes.
- The same authored content structure can drive both prototypes.

If Godot web IME behavior is unreliable, consider a desktop-first release or a narrower browser integration before considering a custom input method.

## Out of scope for this trial

- Branching narrative
- Inventory, saves, or progression systems
- Production art and voice acting
- Automatic romanization generation