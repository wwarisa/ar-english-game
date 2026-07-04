/**
 * ============================================================
 *  app.js — AR Magic English Safari · Application logic
 * ============================================================
 *  Vanilla JS, no framework. Organised into small modules:
 *    Store   — progress & settings (localStorage)
 *    Voice   — real English pronunciation via Speech Synthesis
 *    Sfx     — reward chimes generated with Web Audio (no files)
 *    Fx      — confetti + cheer celebrations
 *    Router  — swap between splash / home / play screens
 *    Home    — category chips + word cards
 *    Play    — one-word stage + Listen / Speak / Write / AR
 *    Speak   — microphone reward (volume + word recognition)
 *    Write   — trace-the-letter canvas
 *    AR      — lazy Hiro-marker camera scene (A-Frame + AR.js)
 *
 *  ห่อทั้งหมดใน IIFE กันตัวแปรชนกัน / heavily commented TH+EN.
 * ============================================================ */
(function () {
  "use strict";

  const WORDS = window.WORDS || [];
  const WORDS_BY_ID = window.WORDS_BY_ID || {};
  const CATEGORIES = window.CATEGORIES || {};

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ==========================================================
     STORE — progress & settings (บันทึกความคืบหน้า + ตั้งค่า)
     Persisted in localStorage so kids keep their stars.
     ========================================================== */
  const Store = (function () {
    const KEY = "safari.v2";
    let data = { progress: {}, sound: true };
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) data = Object.assign(data, JSON.parse(raw));
    } catch (e) { /* private mode etc. */ }

    function save() {
      try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
    }
    // progress[wordId] = { listen, speak, write } booleans
    function wordProgress(id) {
      return data.progress[id] || { listen: false, speak: false, write: false };
    }
    // Mark an activity done; returns true if it was NEW (ให้รางวัลครั้งแรก)
    function complete(id, activity) {
      const p = wordProgress(id);
      if (p[activity]) return false;
      p[activity] = true;
      data.progress[id] = p;
      save();
      return true;
    }
    const starsFor = (id) => { const p = wordProgress(id); return (p.listen?1:0)+(p.speak?1:0)+(p.write?1:0); };
    const totalStars = () => WORDS.reduce((s, w) => s + starsFor(w.id), 0);
    const isSound = () => data.sound;
    function toggleSound() { data.sound = !data.sound; save(); return data.sound; }

    return { wordProgress, complete, starsFor, totalStars, isSound, toggleSound };
  })();

  /* ==========================================================
     VOICE — real spoken English via Speech Synthesis (TTS)
     ออกเสียงจริงด้วย TTS ของเบราว์เซอร์ ไม่ต้องมีไฟล์เสียง
     ========================================================== */
  const Voice = (function () {
    let voices = [], chosen = null, ready = false;
    const synth = window.speechSynthesis;

    function load() {
      if (!synth) return;
      voices = synth.getVoices() || [];
      // Prefer a natural en-US/en-GB voice; a female voice reads
      // friendlier for young children (เลือกเสียงอังกฤษที่ฟังนุ่ม)
      const en = voices.filter((v) => /en(-|_)?(US|GB|AU)?/i.test(v.lang));
      chosen =
        en.find((v) => /female|samantha|karen|zira|google us english|libby|aria/i.test(v.name)) ||
        en.find((v) => /google/i.test(v.name)) ||
        en[0] || voices[0] || null;
      ready = voices.length > 0;
    }
    if (synth) {
      load();
      synth.onvoiceschanged = load;
    }

    // Unlock audio on first user gesture (ปลดล็อกเสียงตอนแตะครั้งแรก)
    function prime() {
      if (!synth) return;
      try {
        const u = new SpeechSynthesisUtterance(" ");
        u.volume = 0; synth.speak(u);
      } catch (e) {}
      load();
    }

    /**
     * speak(text, opts) — say English text.
     * opts: { rate, pitch, onend }
     */
    function speak(text, opts = {}) {
      if (!synth) { if (opts.onend) opts.onend(); return; }
      synth.cancel(); // stop overlap (หยุดเสียงเก่า)
      const u = new SpeechSynthesisUtterance(text);
      if (chosen) u.voice = chosen;
      u.lang = (chosen && chosen.lang) || "en-US";
      u.rate = opts.rate != null ? opts.rate : 0.85; // slower for kids (ช้าลงให้เด็กฟังทัน)
      u.pitch = opts.pitch != null ? opts.pitch : 1.15;
      u.volume = 1;
      if (opts.onend) u.onend = opts.onend;
      synth.speak(u);
    }

    // Say the word slowly, then its sentence (พูดคำ แล้วตามด้วยประโยค)
    function teachWord(word) {
      speak(word.word, { rate: 0.7, onend: () => {
        setTimeout(() => speak(word.sentence, { rate: 0.85 }), 350);
      }});
    }
    const isSupported = () => !!synth;

    return { prime, speak, teachWord, isSupported };
  })();

  /* ==========================================================
     SFX — reward chimes generated in-code (เสียงรางวัลสังเคราะห์)
     No audio files → tiny, instant, always available.
     ========================================================== */
  const Sfx = (function () {
    let ctx = null;
    function ac() {
      if (!ctx) { const A = window.AudioContext || window.webkitAudioContext; if (A) ctx = new A(); }
      if (ctx && ctx.state === "suspended") ctx.resume();
      return ctx;
    }
    function tone(freq, start, dur, type = "sine", gain = 0.2) {
      const c = ac(); if (!c) return;
      const o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.value = freq;
      o.connect(g); g.connect(c.destination);
      const t = c.currentTime + start;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(gain, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.start(t); o.stop(t + dur + 0.02);
    }
    function play(name) {
      if (!Store.isSound()) return;
      if (name === "tap") tone(660, 0, 0.12, "triangle", 0.15);
      else if (name === "star") { tone(784, 0, 0.15, "sine", 0.2); tone(1047, 0.1, 0.25, "sine", 0.2); }
      else if (name === "win") { [523,659,784,1047].forEach((f,i)=>tone(f, i*0.11, 0.3, "sine", 0.22)); }
      else if (name === "pop") tone(880, 0, 0.1, "sine", 0.18);
    }
    return { play, ac };
  })();

  /* ==========================================================
     FX — confetti + cheer toast (ฉลอง)
     ========================================================== */
  const Fx = (function () {
    const canvas = $("#fx-canvas"), cheerEl = $("#cheer");
    let ctx, parts = [], raf = null;
    function size() { if (!canvas) return; canvas.width = innerWidth; canvas.height = innerHeight; }
    if (canvas) { ctx = canvas.getContext("2d"); size(); addEventListener("resize", size); }

    const COLORS = ["#FFC107","#FF7043","#42A5F5","#66BB6A","#EC407A","#AB47BC"];
    function burst(n = 90) {
      if (!ctx) return;
      for (let i = 0; i < n; i++) {
        parts.push({
          x: innerWidth/2, y: innerHeight*0.35,
          vx: (Math.random()-0.5)*14, vy: Math.random()*-12-4,
          g: 0.4+Math.random()*0.2, s: 6+Math.random()*8,
          c: COLORS[(Math.random()*COLORS.length)|0], r: Math.random()*Math.PI,
          vr: (Math.random()-0.5)*0.4, life: 90+Math.random()*40,
        });
      }
      if (!raf) loop();
    }
    function loop() {
      raf = requestAnimationFrame(loop);
      ctx.clearRect(0,0,canvas.width,canvas.height);
      parts.forEach((p) => { p.vy+=p.g; p.x+=p.vx; p.y+=p.vy; p.r+=p.vr; p.life--; });
      parts = parts.filter((p) => p.life>0 && p.y<canvas.height+40);
      parts.forEach((p) => {
        ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.r);
        ctx.fillStyle = p.c; ctx.fillRect(-p.s/2,-p.s/2,p.s,p.s*0.6); ctx.restore();
      });
      if (parts.length === 0) { cancelAnimationFrame(raf); raf = null; }
    }
    function cheer(text) {
      if (!cheerEl) return;
      cheerEl.textContent = text;
      cheerEl.classList.remove("hidden"); cheerEl.classList.remove("show");
      void cheerEl.offsetWidth; // reflow to restart animation
      cheerEl.classList.add("show");
    }
    return { burst, cheer };
  })();

  /* ==========================================================
     ROUTER — swap screens (สลับหน้าจอ)
     ========================================================== */
  const Router = (function () {
    function show(id) {
      $$(".screen").forEach((s) => s.classList.toggle("active", s.id === id));
    }
    return { show };
  })();

  /* ==========================================================
     Shared reward helper (ตัวช่วยให้รางวัลร่วมกัน)
     ========================================================== */
  const CHEERS = ["Great! 🎉","Well done! 👏","Amazing! 🌟","Yay! 🥳","Super! 💪","Bravo! 🎈"];
  function reward(wordId, activity, cheerText) {
    const isNew = Store.complete(wordId, activity);
    Fx.burst(isNew ? 110 : 60);
    Fx.cheer(cheerText || CHEERS[(Math.random()*CHEERS.length)|0]);
    Sfx.play(isNew ? "star" : "pop");
    if (isNew && Store.starsFor(wordId) === 3) {
      setTimeout(() => { Fx.burst(140); Fx.cheer("Word complete! 🏆"); Sfx.play("win"); }, 700);
    }
    Play.refreshStars();
    Home.refreshCard(wordId);
    Home.refreshWallet();
    return isNew;
  }

  /* ==========================================================
     HOME — category chips + word cards (หน้าเลือกคำ)
     ========================================================== */
  const Home = (function () {
    const grid = $("#word-grid"), bar = $("#category-bar"), wallet = $("#star-count");
    let filter = "all";

    function renderChips() {
      const chips = [{ id:"all", label:"All", thai:"ทั้งหมด", emoji:"✨", color:"#FF8A65" }]
        .concat(Object.values(CATEGORIES));
      bar.innerHTML = "";
      chips.forEach((c) => {
        const b = document.createElement("button");
        b.className = "chip" + (c.id === filter ? " active" : "");
        b.style.background = c.id === filter ? c.color : "#fff";
        b.innerHTML = `<span class="chip-emoji">${c.emoji}</span>${c.label}`;
        b.onclick = () => { filter = c.id; Sfx.play("tap"); renderChips(); renderGrid(); };
        bar.appendChild(b);
      });
    }

    function cardHTML(w) {
      const stars = Store.starsFor(w.id);
      const starStr = "★★★☆☆☆".slice(3 - stars, 6 - stars); // filled + empty
      return `
        <div class="wc-emoji">${w.emoji}</div>
        <div class="wc-word">${w.word}</div>
        <div class="wc-thai">${w.thai}</div>
        <div class="wc-stars">${"★".repeat(stars)}${"☆".repeat(3-stars)}</div>`;
    }
    function renderGrid() {
      grid.innerHTML = "";
      WORDS.filter((w) => filter === "all" || w.category === filter).forEach((w) => {
        const card = document.createElement("div");
        card.className = "word-card" + (Store.starsFor(w.id) === 3 ? " done" : "");
        card.id = "card-" + w.id;
        card.style.setProperty("--card-tint", w.color);
        card.innerHTML = cardHTML(w);
        card.onclick = () => { Sfx.play("tap"); Play.open(w.id); };
        grid.appendChild(card);
      });
    }
    function refreshCard(id) {
      const card = $("#card-" + id); if (!card) return;
      const w = WORDS_BY_ID[id];
      card.classList.toggle("done", Store.starsFor(id) === 3);
      card.innerHTML = cardHTML(w);
    }
    function refreshWallet() { if (wallet) wallet.textContent = Store.totalStars(); }

    function init() { renderChips(); renderGrid(); refreshWallet(); }
    return { init, renderGrid, refreshCard, refreshWallet };
  })();

  /* ==========================================================
     PLAY — one word stage (หน้าเล่นราย 1 คำ)
     ========================================================== */
  const Play = (function () {
    let current = null;
    const stage = $("#play-stage"), charEl = $("#character"), bubble = $("#speech-bubble");
    const wordEl = $("#play-word"), thaiEl = $("#play-thai"), starsEl = $("#play-stars");

    function open(id) {
      current = WORDS_BY_ID[id]; if (!current) return;
      wordEl.textContent = current.word;
      thaiEl.textContent = current.thai;
      charEl.textContent = current.emoji;
      // tint the stage to the word's color (ไล่สีเวทีตามคำ)
      const c = current.color;
      stage.style.setProperty("--stage-1", tint(c, 0.55));
      stage.style.setProperty("--stage-2", c);
      refreshStars();
      bubble.classList.remove("show");
      Router.show("screen-play");
      // Auto-introduce the word after the screen settles (แนะนำคำอัตโนมัติ)
      setTimeout(() => doListen(), 500);
    }
    const getCurrent = () => current;

    function refreshStars() {
      if (!current) return;
      const s = Store.starsFor(current.id);
      starsEl.textContent = "★".repeat(s) + "☆".repeat(3 - s);
    }

    // Listen activity: hear the word + sentence, show bubble (ฟัง)
    function doListen() {
      if (!current) return;
      showBubble(`${current.word} · ${current.thai}`);
      charCheerAnim();
      Voice.teachWord(current);
      reward(current.id, "listen", "Listen! 👂");
    }
    function showBubble(text) {
      bubble.textContent = text;
      bubble.classList.add("show");
      clearTimeout(showBubble._t);
      showBubble._t = setTimeout(() => bubble.classList.remove("show"), 3200);
    }
    function charCheerAnim() {
      charEl.classList.remove("bounce"); void charEl.offsetWidth; charEl.classList.add("bounce");
    }

    return { open, getCurrent, refreshStars, doListen, charCheerAnim, showBubble };
  })();

  // Lighten a hex color toward white by amt 0..1 (ทำสีให้อ่อนลง)
  function tint(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n>>16)&255, g = (n>>8)&255, b = n&255;
    r = Math.round(r + (255-r)*amt); g = Math.round(g + (255-g)*amt); b = Math.round(b + (255-b)*amt);
    return `rgb(${r},${g},${b})`;
  }

  /* ==========================================================
     SPEAK — microphone reward (เกมพูด)
     Web Speech recognition (says the word) + volume fallback.
     ========================================================== */
  const Speak = (function () {
    const VOLUME_THRESHOLD = 28, LISTEN_MS = 5000;
    let audioCtx, analyser, micStream, rafId, timeoutId, recognition;
    let listening = false, rewarded = false, btn;

    function init() { btn = $("#act-speak"); if (btn) btn.onclick = start; }

    async function start() {
      const word = Play.getCurrent(); if (!word || listening) return;
      Sfx.play("tap");
      Play.showBubble(`Say "${word.word}"! 🗣️`);
      Voice.speak(word.word, { rate: 0.7 }); // model the word first (พูดให้ฟังก่อน)

      try { micStream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
      catch (err) {
        Play.showBubble("Allow the microphone 🎤 · อนุญาตไมค์");
        return;
      }
      listening = true; rewarded = false; btn.classList.add("busy");
      startRecognition(word);

      const A = window.AudioContext || window.webkitAudioContext;
      audioCtx = new A();
      const src = audioCtx.createMediaStreamSource(micStream);
      analyser = audioCtx.createAnalyser(); analyser.fftSize = 512; src.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      (function tick() {
        analyser.getByteFrequencyData(data);
        let sum = 0; for (let i=0;i<data.length;i++) sum += data[i];
        if (!rewarded && sum/data.length > VOLUME_THRESHOLD) win(word, "Nice and loud! 🔊");
        rafId = requestAnimationFrame(tick);
      })();
      timeoutId = setTimeout(stop, LISTEN_MS);
    }

    function startRecognition(word) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) return;
      try {
        recognition = new SR();
        recognition.lang = "en-US"; recognition.interimResults = true; recognition.continuous = true;
        recognition.onresult = (e) => {
          let heard = "";
          for (let i=0;i<e.results.length;i++) for (let j=0;j<e.results[i].length;j++) heard += " " + e.results[i][j].transcript;
          if (!rewarded && heard.toLowerCase().includes(word.word.toLowerCase())) win(word, "Perfect! You said it! 🌟");
        };
        recognition.onerror = () => {};
        recognition.start();
      } catch (e) {}
    }
    function win(word, msg) {
      if (rewarded) return; rewarded = true;
      Play.charCheerAnim();
      reward(word.id, "speak", msg);
      setTimeout(stop, 400);
    }
    function stop() {
      if (!listening) return; listening = false;
      if (rafId) cancelAnimationFrame(rafId);
      if (timeoutId) clearTimeout(timeoutId);
      if (recognition) { try { recognition.stop(); } catch(e){} recognition = null; }
      if (micStream) micStream.getTracks().forEach((t) => t.stop());
      if (audioCtx && audioCtx.state !== "closed") audioCtx.close();
      if (btn) btn.classList.remove("busy");
    }
    return { init };
  })();

  /* ==========================================================
     WRITE — trace the letter (เกมลากเส้น)
     ========================================================== */
  const Write = (function () {
    let modal, canvas, ctx, size = 320, drawing = false, strokes = 0, current;

    function init() {
      modal = $("#write-modal"); canvas = $("#write-canvas");
      if (!canvas) return;
      ctx = canvas.getContext("2d");
      $("#act-write").onclick = open;
      $("#btn-clear").onclick = () => { Sfx.play("tap"); guide(); };
      $("#btn-close-write").onclick = done;
      ["pointerdown","pointermove","pointerup","pointercancel","pointerleave"].forEach((ev) =>
        canvas.addEventListener(ev, handler));
    }
    function res() {
      const dpr = window.devicePixelRatio || 1, rect = canvas.getBoundingClientRect();
      size = rect.width || 320; canvas.width = size*dpr; canvas.height = size*dpr;
      ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    function open() {
      current = Play.getCurrent(); if (!current) return;
      Sfx.play("tap"); strokes = 0;
      modal.classList.remove("hidden");
      Voice.speak(`Trace the letter ${current.letter}`, { rate: 0.8 });
      requestAnimationFrame(() => { res(); guide(); });
    }
    function done() {
      modal.classList.add("hidden");
      if (strokes >= 2 && current) reward(current.id, "write", "Beautiful writing! ✍️");
    }
    function guide() {
      ctx.clearRect(0,0,size,size);
      ctx.save();
      ctx.font = `bold ${size*0.7}px ${getComputedStyle(document.body).fontFamily}`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.setLineDash([10,12]); ctx.lineWidth = 3; ctx.strokeStyle = "#BDBDBD";
      ctx.fillStyle = "rgba(189,189,189,0.14)";
      const L = current ? current.letter : "A", y = size/2 + size*0.03;
      ctx.fillText(L, size/2, y); ctx.strokeText(L, size/2, y);
      ctx.restore();
      // crayon style for the child's strokes (ปากกาสีหนา)
      ctx.lineWidth = 18; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.strokeStyle = current ? current.color : "#FF7043";
    }
    function pos(e) {
      const r = canvas.getBoundingClientRect();
      return { x: (e.clientX-r.left)*(size/r.width), y: (e.clientY-r.top)*(size/r.height) };
    }
    function handler(e) {
      if (e.type === "pointerdown") { e.preventDefault(); drawing = true; strokes++; const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x,p.y); }
      else if (e.type === "pointermove") { if (!drawing) return; e.preventDefault(); const p = pos(e); ctx.lineTo(p.x,p.y); ctx.stroke(); }
      else { if (!drawing) return; drawing = false; ctx.closePath(); }
    }
    return { init };
  })();

  /* ==========================================================
     AR — lazy Hiro-marker camera scene (โหมด AR)
     Loads A-Frame + AR.js only when needed (performance).
     Pre-checks the camera to avoid AR.js's ugly error alert.
     ========================================================== */
  const AR = (function () {
    let scriptsLoaded = false, host, view, hint;
    function init() {
      host = $("#ar-scene-host"); view = $("#ar-view"); hint = $("#ar-hint");
      $("#act-ar").onclick = openAR;
      $("#btn-close-ar").onclick = closeAR;
    }
    function loadScripts() {
      if (scriptsLoaded) return Promise.resolve();
      return new Promise((resolve, reject) => {
        const a = document.createElement("script");
        a.src = "https://aframe.io/releases/1.2.0/aframe.min.js";
        a.onload = () => {
          const b = document.createElement("script");
          b.src = "https://raw.githack.com/AR-js-org/AR.js/3.3.2/aframe/build/aframe-ar.js";
          b.onload = () => { scriptsLoaded = true; resolve(); };
          b.onerror = reject; document.head.appendChild(b);
        };
        a.onerror = reject; document.head.appendChild(a);
      });
    }
    // Draw the emoji to a data URL so it can float on the marker
    // (วาดอีโมจิเป็นรูปเพื่อให้ลอยบนมาร์กเกอร์)
    function emojiURL(emoji) {
      const c = document.createElement("canvas"); c.width = c.height = 256;
      const x = c.getContext("2d");
      x.font = "200px serif"; x.textAlign = "center"; x.textBaseline = "middle";
      x.fillText(emoji, 128, 140);
      return c.toDataURL();
    }
    async function openAR() {
      const word = Play.getCurrent(); if (!word) return;
      Sfx.play("tap");
      // 1) Pre-check camera so we can fail gracefully (ตรวจกล้องก่อน)
      try {
        const test = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        test.getTracks().forEach((t) => t.stop());
      } catch (err) {
        Play.showBubble("No camera here 📷 — try on a phone! · ไม่มีกล้อง ลองบนมือถือ");
        return;
      }
      try { await loadScripts(); }
      catch (e) { Play.showBubble("Could not load AR 😢 (check internet)"); return; }
      buildScene(word);
      view.classList.remove("hidden");
      hint.classList.remove("found");
    }
    function buildScene(word) {
      host.innerHTML = `
        <a-scene embedded vr-mode-ui="enabled:false"
          renderer="antialias:true; alpha:true; precision:mediump"
          arjs="sourceType:webcam; debugUIEnabled:false; detectionMode:mono">
          <a-marker id="m" preset="hiro" smooth="true" smoothCount="8">
            <a-box position="0 0.35 0" scale="0.9 0.9 0.9" color="${word.color}">
              <a-animation attribute="rotation" to="0 360 0" dur="7000" easing="linear" repeat="indefinite"></a-animation>
            </a-box>
            <a-image src="${emojiURL(word.emoji)}" position="0 1.1 0" width="1.4" height="1.4" look-at="[camera]" transparent="true"></a-image>
            <a-text value="${word.word}" align="center" position="0 1.9 0" width="4" color="#fff" stroke="black" stroke-width="0.04" look-at="[camera]"></a-text>
          </a-marker>
          <a-entity camera></a-entity>
        </a-scene>`;
      const m = $("#m", host);
      if (m) {
        m.addEventListener("markerFound", () => {
          hint.classList.add("found");
          Voice.teachWord(word); Sfx.play("star");
        });
        m.addEventListener("markerLost", () => hint.classList.remove("found"));
      }
    }
    function closeAR() {
      view.classList.add("hidden");
      // Remove the scene → stops the camera (ลบฉากเพื่อคืนกล้อง)
      host.innerHTML = "";
    }
    return { init };
  })();

  /* ==========================================================
     BOOTSTRAP (เริ่มการทำงาน)
     ========================================================== */
  function boot() {
    // Splash → Home (แตะเริ่ม → ปลดล็อกเสียง)
    $("#btn-start").onclick = () => {
      Voice.prime(); Sfx.ac(); Sfx.play("pop");
      Router.show("screen-home");
    };
    // Voices may load async; update the loading hint (อัปเดตข้อความโหลด)
    const loadingEl = $("#splash-loading");
    if (loadingEl) loadingEl.textContent = Voice.isSupported()
      ? "Ready! 🎧 English voices on" : "Tip: works best in Chrome 🌐";

    // Sound toggle (ปุ่มเปิด/ปิดเสียง)
    const soundBtn = $("#btn-sound");
    function paintSound() { soundBtn.textContent = Store.isSound() ? "🔊" : "🔇"; soundBtn.classList.toggle("muted", !Store.isSound()); }
    if (soundBtn) { paintSound(); soundBtn.onclick = () => { Store.toggleSound(); paintSound(); Sfx.play("tap"); }; }

    // Back button (ปุ่มย้อนกลับ)
    $("#btn-back").onclick = () => { Sfx.play("tap"); Router.show("screen-home"); Home.renderGrid(); Home.refreshWallet(); };

    // Tap the character to hear the word (แตะตัวละครเพื่อฟัง)
    $("#character").onclick = () => Play.doListen();
    $("#act-listen").onclick = () => Play.doListen();

    Home.init();
    Speak.init();
    Write.init();
    AR.init();

    // Register service worker for offline/install (ลงทะเบียน SW เพื่อออฟไลน์)
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("sw.js").catch((e) => console.log("[SW] skip:", e.message));
      });
    }
    console.log("🦁 AR Magic English Safari v2 ready ·", WORDS.length, "words");
  }

  // Expose the few modules that cross-reference each other
  // (เปิด reference ข้ามโมดูล)
  window.Play = Play; window.Home = Home;

  boot();
})();
