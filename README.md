# Jamo Cafe

A Korean typing game about a foreigner's first cafe shift in Seoul. Listen to each customer's drink order, write it down, prepare it, and serve the finished drink before closing time.

## Run locally

The app uses browser ES modules, so serve it over HTTP rather than opening `index.html` directly.

```sh
npm start
```

Open <http://localhost:5173>.

## Test

```sh
npm test
```

The project intentionally has no runtime dependencies. The current machine has Node 14, so the test command uses a small compatible runner rather than Node's newer built-in test API.

## Game loop

- Built-in Korean two-set composition from physical English keyboard positions
- Compact Korean keyboard under every active Hangul input with physical keys highlighted in real time and a persisted show/hide switch
- One-toggle fallback to the device's native Korean IME
- Bilingual Hangul and English prompts, with the selected typing language emphasized in both rooms
- Randomized customer and drink combinations
- Two-room loop: take and serve orders at the cafe front, then prepare drinks at the kitchen workbench
- The kitchen is an illustrated countertop navigable by mouse, arrow keys, or WASD; tea, syrup, fridge, and extras stations open compact ingredient menus
- Orders are typed directly onto a notepad, then the torn note follows the player into the kitchen
- Selecting a kitchen object opens its Korean typing prompt; cancel with the close button, backdrop, or Escape
- The prepared cup visibly changes as vessels, coffee, tea, syrups, milks, toppings, and ice are added
- The kitchen's serve button remains disabled until the recipe is complete
- Throwing out a drink requires selecting the sink and typing its guided Korean action
- Page-turning recipe book with all 23 drinks and clear unlock milestones
- Wrong preparation can be thrown out and remade; handing it off fails the order
- Two missed Korean submissions fail an order, while a correct handoff earns a celebration
- Four starter recipes expand every two served orders, reaching 23 drinks and the full ingredient catalog after 14 orders, including five Korean cafe-style ades
- Varied Korean customer remarks with English meaning during order taking
- Easy, Medium, and Rush shift lengths
- Live order count, typing streak, and end-of-shift accuracy
- Responsive cafe counter layout for desktop and mobile

See [docs/PROTOTYPE_PLAN.md](docs/PROTOTYPE_PLAN.md) for milestones and go/no-go criteria.