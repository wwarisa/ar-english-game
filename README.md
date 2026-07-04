# 🦁 AR Magic English Safari

A premium, **web-based English learning game for little explorers aged 0–5**.
เกมเรียนภาษาอังกฤษบนเว็บ ระดับพรีเมียม สำหรับเด็ก 0–5 ปี

100% free to host (GitHub Pages). Pure **HTML / CSS / Vanilla JS** + **A-Frame** + **AR.js**.
No frameworks, no build step, works offline as an installable app (PWA).

**Live:** https://wwarisa.github.io/ar-english-game/

---

## ✨ What makes it special (จุดเด่น)

- 🔊 **Real spoken English** — every word & sentence is pronounced aloud using the
  browser's Speech Synthesis. No audio files needed. (ออกเสียงจริงด้วย TTS)
- 🎮 **3 learning activities per word** — Listen 👂, Speak 🎤, Write ✍️.
- 🎯 **Quiz game** — "Find the Cat!" picture-matching to reinforce learning; 5 rounds,
  friendly retries, a results screen with a best-score record. (เกมทายคำ)
- ⭐ **Stars & progress** — kids earn stars, saved on the device; complete a word to
  win a 🏆. Confetti + happy chimes reward every success. (ระบบดาว + บันทึกความคืบหน้า)
- 📱 **Works everywhere, no setup** — a beautiful *Screen Mode* plays instantly with
  **no camera and no printed marker required**. AR (camera) is an optional bonus.
- 📷 **AR bonus** — point the phone camera at a Hiro marker to see the animal pop up.
- 🌏 **Bilingual** — English + Thai translation on every word.
- 💾 **Installable & offline** — add to home screen; plays without internet after first load.
- 🧒 **Child-first UX** — huge tappable buttons, rounded toy-like design, friendly voice.

## 📚 Curriculum (หลักสูตร)

21 words across 5 categories, each with emoji character, Thai meaning, phonic sound and
an example sentence. Edit / extend in [`config/vocabulary.js`](config/vocabulary.js).

| Animals 🐾 | Food 🍎 | Nature 🌳 | Colors 🎨 | Numbers 🔢 |
|---|---|---|---|---|
| Cat, Dog, Bird, Fish, Lion, Elephant | Apple, Banana, Egg | Sun, Moon, Tree | Red, Blue, Green, Yellow | One–Five (trace the digit) |

---

## 📁 Project structure
```
ar-english-game/
├── index.html          # SPA shell: Splash → Home → Play
├── style.css           # Full child-first design system
├── app.js              # Modules: Store, Voice(TTS), Sfx, Fx, Router, Home, Play, Speak, Write, AR
├── config/
│   └── vocabulary.js   # Curriculum data (12 words, 3 categories)
├── manifest.json       # PWA manifest (installable)
├── sw.js               # Service worker (offline caching)
└── assets/
    ├── icons/          # PWA app icons (192 / 512 / maskable)
    ├── audio/          # Optional real recordings (TTS used by default)
    ├── models/         # Optional .glb models (emoji used by default)
    └── markers/PRINT_ME.html   # Printable Hiro marker for AR mode
```

## 🎮 How to play
1. **Tap to Start** (unlocks sound on mobile).
2. **Pick a word** from the colorful grid (filter by category).
3. On the **Play** screen:
   - 👂 **Listen** — hear the word + sentence (tap the character too).
   - 🎤 **Speak** — say the word; loud/correct speech makes the character celebrate.
   - ✍️ **Write** — trace the letter with a chunky crayon line.
   - 📷 **AR** — (on a phone) launch the camera and aim at the Hiro marker.
4. Earn ⭐⭐⭐ per word and collect a 🏆.

## ▶️ Run locally
Camera & mic need a server (not `file://`):
```bash
npx http-server .
# open http://localhost:8080
```

## 🚀 Deploy (GitHub Pages)
Already live at **https://wwarisa.github.io/ar-english-game/**.
Repo must be **public** for free Pages. Push to `main` → auto-published.

## 🖨️ AR marker
Open [`assets/markers/PRINT_ME.html`](assets/markers/PRINT_ME.html), print it, and aim
the in-app 📷 AR camera at it. Best on a phone with a rear camera.

---

## 🧠 Notes
- Pronunciation uses TTS; quality/voice depends on the device (Chrome/Edge/Android best).
- Emoji are the animated characters — crisp on every device, zero asset downloads.
- Optional real audio (`assets/audio/*.wav` placeholders) and 3D models (`assets/models/*.glb`)
  can be dropped in later; the app already works without them.
- Tune mic sensitivity via `VOLUME_THRESHOLD` in [`app.js`](app.js).

## 💛 Made for little explorers · เพื่อการเรียนรู้ของหนู ๆ
