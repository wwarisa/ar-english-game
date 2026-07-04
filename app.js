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
    let data = { progress: {}, sound: true, quizBest: 0, streak: 0, lastPlayed: null };
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
    const quizBest = () => data.quizBest || 0;
    function setQuizBest(s) { if (s > (data.quizBest||0)) { data.quizBest = s; save(); } return data.quizBest; }
    function reset() { data = { progress: {}, sound: data.sound, quizBest: 0, streak: 0, lastPlayed: null }; save(); }

    // Daily streak (สถิติเล่นต่อเนื่องรายวัน)
    const today = () => new Date().toISOString().slice(0, 10);
    function touchStreak() {
      const t = today();
      if (data.lastPlayed === t) return data.streak;
      const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
      data.streak = data.lastPlayed === y ? (data.streak || 0) + 1 : 1;
      data.lastPlayed = t; save();
      return data.streak;
    }
    const streak = () => data.streak || 0;

    return { wordProgress, complete, starsFor, totalStars, isSound, toggleSound,
             quizBest, setQuizBest, reset, touchStreak, streak };
  })();

  /* ==========================================================
     VOICE — real spoken English via Speech Synthesis (TTS)
     ออกเสียงจริงด้วย TTS ของเบราว์เซอร์ ไม่ต้องมีไฟล์เสียง
     ========================================================== */
  const Voice = (function () {
    const synth = window.speechSynthesis;
    let voices = [], chosen = null, unlocked = false;

    function load() {
      if (!synth) return;
      voices = synth.getVoices() || [];
      // Prefer a natural en voice; child-friendly female if available
      // (เลือกเสียงอังกฤษที่ฟังนุ่ม)
      const en = voices.filter((v) => /^en[-_]/i.test(v.lang) || /english/i.test(v.name));
      chosen =
        en.find((v) => /samantha|karen|zira|female|google us english|aria|libby|natural/i.test(v.name)) ||
        en.find((v) => /google|microsoft/i.test(v.name)) ||
        en[0] || null;
    }
    if (synth) {
      load();
      synth.onvoiceschanged = load;
      // Some browsers populate voices late — retry a few times (โหลดเสียงซ้ำ)
      [150, 500, 1200, 2500].forEach((t) => setTimeout(load, t));
    }

    function utter(text, opts) {
      const u = new SpeechSynthesisUtterance(text);
      if (chosen) u.voice = chosen;
      u.lang = (chosen && chosen.lang) || "en-US";
      u.rate = opts.rate != null ? opts.rate : 0.9;   // slower for kids
      u.pitch = opts.pitch != null ? opts.pitch : 1.1;
      u.volume = opts.volume != null ? opts.volume : 1;
      if (opts.onend) u.onend = opts.onend;
      return u;
    }

    /**
     * speak(text, opts) — say English text robustly across devices.
     * Mobile browsers need speech kicked off shortly after a gesture and
     * dislike cancel() immediately before speak(); we guard against both.
     */
    function speak(text, opts = {}) {
      if (!synth || !Store.isSound()) { if (opts.onend) opts.onend(); return; }
      try { if (synth.speaking || synth.pending) synth.cancel(); } catch (e) {}
      // tiny delay avoids the Android "cancel kills the next utterance" bug
      setTimeout(() => { try { synth.resume(); synth.speak(utter(text, opts)); } catch (e) {} }, 60);
    }

    // Unlock TTS on the first real user gesture, with an audible cue so
    // parents immediately know sound works. (ปลดล็อกเสียงพร้อมทักทาย)
    function unlock() {
      if (!synth) return;
      load();
      if (unlocked) return;
      unlocked = true;
      if (!Store.isSound()) return;
      try { synth.resume(); synth.speak(utter("Let's play!", { rate: 1 })); } catch (e) {}
    }

    // Say the word slowly, then its sentence (พูดคำ แล้วตามด้วยประโยค)
    function teachWord(word) {
      speak(word.word, { rate: 0.75, onend: () => {
        setTimeout(() => speak(word.sentence, { rate: 0.9 }), 250);
      }});
    }
    const isSupported = () => !!synth;

    return { speak, teachWord, unlock, isSupported, reloadVoices: load };
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
    function showBubble(text, sticky) {
      bubble.textContent = text;
      bubble.classList.add("show");
      clearTimeout(showBubble._t);
      if (!sticky) showBubble._t = setTimeout(() => bubble.classList.remove("show"), 3200);
    }
    function hideBubble() { clearTimeout(showBubble._t); bubble.classList.remove("show"); }
    function charCheerAnim() {
      charEl.classList.remove("bounce"); void charEl.offsetWidth; charEl.classList.add("bounce");
    }
    const charEl2 = () => charEl;

    return { open, getCurrent, refreshStars, doListen, charCheerAnim, showBubble, hideBubble, charEl: charEl2 };
  })();

  // Lighten a hex color toward white by amt 0..1 (ทำสีให้อ่อนลง)
  function tint(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n>>16)&255, g = (n>>8)&255, b = n&255;
    r = Math.round(r + (255-r)*amt); g = Math.round(g + (255-g)*amt); b = Math.round(b + (255-b)*amt);
    return `rgb(${r},${g},${b})`;
  }

  /* ==========================================================
     WATCH & LEARN — hands-free flashcards (ดูและเรียนแบบไม่ต้องแตะ)
     Auto-cycles every word, speaking each aloud. Great for the
     youngest learners / passive exposure.
     ========================================================== */
  const Watch = (function () {
    const DWELL = 4800; // ms per card (เวลาแสดงต่อคำ)
    let list = [], idx = 0, playing = true, timer = null;
    const stage = $("#watch-stage"), charEl = $("#watch-char"), label = $("#watch-label"),
          countEl = $("#watch-count"), catEl = $("#watch-cat"), playBtn = $("#watch-play");

    function start() {
      Sfx.play("tap");
      list = WORDS.slice();
      idx = 0; playing = true; updatePlayBtn();
      Router.show("screen-watch");
      setTimeout(render, 350);
    }
    function render() {
      const w = list[idx];
      charEl.textContent = w.emoji;
      label.textContent = `${w.word} · ${w.thai}`;
      countEl.textContent = `${idx + 1} / ${list.length}`;
      const cat = CATEGORIES[w.category]; catEl.textContent = cat ? cat.emoji : "✨";
      stage.style.setProperty("--stage-1", tint(w.color, 0.55));
      stage.style.setProperty("--stage-2", w.color);
      charEl.classList.remove("bounce"); void charEl.offsetWidth; charEl.classList.add("bounce");
      Voice.teachWord(w);
      schedule();
    }
    function schedule() { clearTimeout(timer); if (playing) timer = setTimeout(next, DWELL); }
    function next() { idx = (idx + 1) % list.length; render(); }
    function prev() { idx = (idx - 1 + list.length) % list.length; render(); }
    function togglePlay() {
      playing = !playing; updatePlayBtn();
      if (playing) schedule(); else { clearTimeout(timer); try { speechSynthesis.cancel(); } catch (e) {} }
    }
    function updatePlayBtn() {
      playBtn.querySelector(".act-emoji").textContent = playing ? "⏸️" : "▶️";
      playBtn.querySelector(".act-label").textContent = playing ? "Pause" : "Play";
    }
    function close() {
      playing = false; clearTimeout(timer); try { speechSynthesis.cancel(); } catch (e) {}
      Router.show("screen-home"); Home.refreshWallet();
    }
    function init() {
      $("#btn-watch").onclick = start;
      $("#btn-watch-back").onclick = () => { Sfx.play("tap"); close(); };
      $("#watch-next").onclick = () => { Sfx.play("tap"); next(); };
      $("#watch-prev").onclick = () => { Sfx.play("tap"); prev(); };
      $("#watch-play").onclick = () => { Sfx.play("tap"); togglePlay(); };
      charEl.onclick = () => Voice.teachWord(list[idx]);
    }
    return { init };
  })();

  /* ==========================================================
     SPEAK — microphone reward (เกมพูด)
     Web Speech recognition (says the word) + volume fallback.
     ========================================================== */
  const Speak = (function () {
    const VOLUME_THRESHOLD = 26, LISTEN_MS = 6000;
    let audioCtx, analyser, micStream, rafId, timeoutId, recognition;
    let listening = false, rewarded = false, peak = 0, hasSR = false, btn;

    function init() { btn = $("#act-speak"); if (btn) btn.onclick = start; }

    async function start() {
      const word = Play.getCurrent(); if (!word || listening) return;
      Sfx.play("tap");
      // 1) model the word first so the child hears the target (พูดให้ฟังก่อน)
      Play.showBubble(`Say "${word.word}"! 🗣️`, true);
      Voice.speak(word.word, { rate: 0.7 });

      try { micStream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
      catch (err) {
        Play.showBubble("Please allow the microphone 🎤 · อนุญาตไมค์", false);
        return;
      }
      listening = true; rewarded = false; peak = 0; btn.classList.add("busy");
      const charEl = Play.charEl(); charEl.classList.add("listening");
      Play.showBubble("I'm listening… 🎤 พูดเลย!", true);
      hasSR = startRecognition(word);

      const A = window.AudioContext || window.webkitAudioContext;
      audioCtx = new A(); if (audioCtx.state === "suspended") audioCtx.resume();
      const src = audioCtx.createMediaStreamSource(micStream);
      analyser = audioCtx.createAnalyser(); analyser.fftSize = 512; src.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      (function tick() {
        analyser.getByteFrequencyData(data);
        let sum = 0; for (let i = 0; i < data.length; i++) sum += data[i];
        const vol = sum / data.length; if (vol > peak) peak = vol;
        // Live feedback: the character grows with the child's voice
        // so they can SEE it's hearing them (ตัวละครโตตามเสียงพูด)
        const lvl = Math.min(1, vol / 70);
        charEl.style.transform = `scale(${(1 + lvl * 0.45).toFixed(3)})`;
        // Without SpeechRecognition (e.g. iOS Safari), loudness alone wins
        if (!rewarded && !hasSR && vol > VOLUME_THRESHOLD) win(word, `Great voice! 🔊 เยี่ยมมาก!`);
        rafId = requestAnimationFrame(tick);
      })();
      timeoutId = setTimeout(finishListening, LISTEN_MS);
    }

    function startRecognition(word) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) return false;
      try {
        recognition = new SR();
        recognition.lang = "en-US"; recognition.interimResults = true; recognition.continuous = true;
        recognition.onresult = (e) => {
          let heard = "";
          for (let i = 0; i < e.results.length; i++)
            for (let j = 0; j < e.results[i].length; j++) heard += " " + e.results[i][j].transcript;
          heard = heard.toLowerCase().trim();
          if (heard) Play.showBubble(`I heard: “${heard}” 👂`, true); // show what was heard
          if (!rewarded && heard.includes(word.word.toLowerCase())) win(word, `Perfect! You said “${word.word}”! 🌟`);
        };
        recognition.onerror = () => {};
        recognition.start();
        return true;
      } catch (e) { return false; }
    }

    function win(word, msg) {
      if (rewarded) return; rewarded = true;
      Play.charEl().style.transform = "";
      Play.charCheerAnim();
      reward(word.id, "speak", msg);
      setTimeout(stop, 600);
    }

    // Timeout with no match → encourage; reward effort if they made any sound
    // so the Speak activity never feels like a dead end (ไม่ให้รู้สึกล้มเหลว)
    function finishListening() {
      if (rewarded) { stop(); return; }
      const word = Play.getCurrent();
      if (peak > 12) win(word, "Good try! 👏 เก่งมาก ลองอีกได้นะ");
      else { Play.showBubble(`Try again — say “${word.word}” 🗣️`, false); Voice.speak(word.word, { rate: 0.7 }); stop(); }
    }

    function stop() {
      if (!listening) return; listening = false;
      const charEl = Play.charEl(); charEl.classList.remove("listening"); charEl.style.transform = "";
      if (rafId) cancelAnimationFrame(rafId);
      if (timeoutId) clearTimeout(timeoutId);
      if (recognition) { try { recognition.stop(); } catch (e) {} recognition = null; }
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
    let last = null; // last point for smoothing (จุดล่าสุดเพื่อทำเส้นให้ลื่น)

    function init() {
      modal = $("#write-modal"); canvas = $("#write-canvas");
      if (!canvas) return;
      ctx = canvas.getContext("2d");
      $("#act-write").onclick = open;
      $("#btn-clear").onclick = () => { Sfx.play("tap"); guide(); };
      $("#btn-close-write").onclick = done;
      canvas.style.touchAction = "none";
      canvas.addEventListener("pointerdown", onDown);
      canvas.addEventListener("pointermove", onMove);
      ["pointerup","pointercancel","pointerleave"].forEach((ev) => canvas.addEventListener(ev, onUp));
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
    function onDown(e) {
      e.preventDefault();
      try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
      drawing = true; strokes++;
      last = pos(e);
      // draw a dot so a simple tap leaves a mark (แตะแล้วเป็นจุด)
      ctx.beginPath(); ctx.arc(last.x, last.y, ctx.lineWidth/2, 0, Math.PI*2);
      ctx.fillStyle = ctx.strokeStyle; ctx.fill();
      ctx.beginPath(); ctx.moveTo(last.x, last.y);
    }
    function onMove(e) {
      if (!drawing) return;
      e.preventDefault();
      // Use coalesced events for high-fidelity fast strokes (เก็บทุกจุดระหว่างลาก)
      const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      for (const ev of evs) {
        const p = pos(ev);
        const mid = { x: (last.x + p.x) / 2, y: (last.y + p.y) / 2 };
        // quadratic curve through the midpoint = smooth line (เส้นโค้งลื่น)
        ctx.quadraticCurveTo(last.x, last.y, mid.x, mid.y);
        ctx.stroke();
        ctx.beginPath(); ctx.moveTo(mid.x, mid.y);
        last = p;
      }
    }
    function onUp(e) {
      if (!drawing) return;
      drawing = false;
      if (last) { ctx.lineTo(last.x, last.y); ctx.stroke(); }
      try { canvas.releasePointerCapture(e.pointerId); } catch (err) {}
    }
    return { init };
  })();

  /* ==========================================================
     QUIZ — picture matching mini-game (เกมทายคำ)
     "Find the CAT!" → tap the right emoji. Reinforces learning.
     ========================================================== */
  const Quiz = (function () {
    const ROUNDS = 5, CHOICES = 4;
    let queue = [], idx = 0, score = 0, target = null, locked = false;
    const elTarget = $("#quiz-target"), elThai = $("#quiz-target-thai"),
          elChoices = $("#quiz-choices"), elProg = $("#quiz-progress"), elScore = $("#quiz-score");

    function shuffle(a) { a = a.slice(); for (let i=a.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [a[i],a[j]]=[a[j],a[i]]; } return a; }

    function start() {
      Sfx.play("tap");
      queue = shuffle(WORDS).slice(0, ROUNDS);
      idx = 0; score = 0; updateHud();
      Router.show("screen-quiz");
      setTimeout(question, 350);
    }
    function updateHud() {
      elProg.textContent = `Q ${Math.min(idx+1,ROUNDS)} / ${ROUNDS}`;
      elScore.textContent = `⭐ ${score}`;
    }
    function question() {
      locked = false;
      target = queue[idx];
      elTarget.textContent = target.word;
      elThai.textContent = target.thai;
      // distractors: other words (ตัวเลือกลวงจากคำอื่น)
      const others = shuffle(WORDS.filter((w) => w.id !== target.id)).slice(0, CHOICES-1);
      const options = shuffle(others.concat(target));
      elChoices.innerHTML = "";
      options.forEach((w) => {
        const b = document.createElement("button");
        b.className = "quiz-choice"; b.textContent = w.emoji; b.dataset.id = w.id;
        b.onclick = () => choose(w, b);
        elChoices.appendChild(b);
      });
      updateHud();
      ask();
    }
    function ask() { Voice.speak(`Find the ${target.word}`, { rate: 0.8 }); }

    function choose(w, btn) {
      if (locked) return;
      if (w.id === target.id) {
        locked = true;
        btn.classList.add("correct");
        $$(".quiz-choice", elChoices).forEach((c) => { if (c !== btn) c.classList.add("dim"); });
        score++; updateHud();
        Fx.burst(90); Sfx.play("star");
        Voice.speak(`Yes! ${target.word}!`, { rate: 0.8 });
        setTimeout(next, 1300);
      } else {
        // gentle: shake, keep trying (ผิดแบบใจดี ให้ลองใหม่)
        btn.classList.add("wrong"); Sfx.play("pop");
        btn.classList.add("dim");
        setTimeout(() => btn.classList.remove("wrong"), 400);
        Voice.speak("Try again", { rate: 0.85 });
      }
    }
    function next() {
      idx++;
      if (idx >= ROUNDS) return finish();
      question();
    }
    function finish() {
      const best = Store.setQuizBest(score);
      const perfect = score === ROUNDS;
      $("#quiz-result-emoji").textContent = perfect ? "🏆" : score >= 3 ? "🌟" : "💪";
      $("#quiz-result-title").textContent = perfect ? "Perfect! สุดยอด!" : score >= 3 ? "Well done! เก่งมาก!" : "Good try! ลองอีกครั้ง!";
      $("#quiz-result-score").textContent = `⭐ ${score} / ${ROUNDS}`;
      $("#quiz-result").classList.remove("hidden");
      if (perfect) { Fx.burst(160); Sfx.play("win"); } else { Fx.burst(80); Sfx.play("star"); }
      Home.refreshWallet();
    }

    function init() {
      $("#btn-quiz").onclick = start;
      $("#quiz-replay").onclick = () => { Sfx.play("tap"); ask(); };
      $("#btn-quiz-back").onclick = () => { Sfx.play("tap"); Router.show("screen-home"); };
      $("#quiz-again").onclick = () => { $("#quiz-result").classList.add("hidden"); start(); };
      $("#quiz-home").onclick = () => { $("#quiz-result").classList.add("hidden"); Router.show("screen-home"); Home.refreshWallet(); };
    }
    return { init };
  })();

  /* ==========================================================
     PARENTS — dashboard behind a parental gate (หน้าผู้ปกครอง)
     ========================================================== */
  const Parents = (function () {
    let gateAnswer = 0;
    const BADGES = [
      { id:"first",  emoji:"🐣", name:"First Step",  test:(s)=>s.total>=1 },
      { id:"ten",    emoji:"⭐", name:"10 Stars",    test:(s)=>s.total>=10 },
      { id:"thirty", emoji:"🌟", name:"30 Stars",    test:(s)=>s.total>=30 },
      { id:"master", emoji:"🏆", name:"5 Mastered",  test:(s)=>s.mastered>=5 },
      { id:"quiz",   emoji:"🎯", name:"Quiz Whiz",   test:(s)=>s.quiz>=5 },
      { id:"streak", emoji:"🔥", name:"3-Day Streak",test:(s)=>s.streak>=3 },
    ];

    // ---- Parental gate (ด่านผู้ปกครอง) ----
    function openGate() {
      Sfx.play("tap");
      const a = 2 + ((Math.random()*7)|0), b = 2 + ((Math.random()*7)|0);
      gateAnswer = a + b;
      $("#gate-q").textContent = `Tap the answer: ${a} + ${b}`;
      const opts = new Set([gateAnswer]);
      while (opts.size < 4) opts.add(Math.max(2, gateAnswer + ((Math.random()*7)|0) - 3));
      const box = $("#gate-choices"); box.innerHTML = "";
      Array.from(opts).sort(() => Math.random()-0.5).forEach((n) => {
        const b2 = document.createElement("button"); b2.textContent = n;
        b2.onclick = () => { if (n === gateAnswer) { close(); openDashboard(); } else { Sfx.play("pop"); openGate(); } };
        box.appendChild(b2);
      });
      $("#parent-gate").classList.remove("hidden");
    }
    const close = () => $("#parent-gate").classList.add("hidden");

    function stats() {
      const total = Store.totalStars();
      const mastered = WORDS.filter((w) => Store.starsFor(w.id) === 3).length;
      return { total, mastered, quiz: Store.quizBest(), streak: Store.streak() };
    }

    function openDashboard() {
      const s = stats(), max = WORDS.length * 3;
      $("#p-total-stars").textContent = s.total;
      $("#p-max-stars").textContent = max;
      $("#p-bar-fill").style.width = Math.round((s.total/max)*100) + "%";
      $("#p-words-done").textContent = s.mastered;
      $("#p-quiz-best").textContent = s.quiz;
      $("#p-streak").textContent = s.streak;

      // Per-category bars (แถบความคืบหน้าแต่ละหมวด)
      const box = $("#p-categories"); box.innerHTML = "";
      Object.values(CATEGORIES).forEach((cat) => {
        const words = WORDS.filter((w) => w.category === cat.id);
        const got = words.reduce((n, w) => n + Store.starsFor(w.id), 0);
        const cmax = words.length * 3, pct = cmax ? Math.round((got/cmax)*100) : 0;
        const row = document.createElement("div"); row.className = "p-catrow";
        row.innerHTML = `<span class="cat-ico">${cat.emoji}</span>
          <span class="cat-name">${cat.label}</span>
          <span class="cat-bar"><i style="width:${pct}%;background:${cat.color}"></i></span>
          <span class="cat-num">${got}/${cmax}</span>`;
        box.appendChild(row);
      });

      // Badges (เหรียญ)
      const bb = $("#p-badges"); bb.innerHTML = "";
      BADGES.forEach((bdg) => {
        const earned = bdg.test(s);
        const el = document.createElement("div");
        el.className = "badge" + (earned ? " earned" : "");
        el.innerHTML = `<div class="b-emoji">${earned ? bdg.emoji : "🔒"}</div><div class="b-name">${bdg.name}</div>`;
        bb.appendChild(el);
      });

      Router.show("screen-parents");
    }

    function init() {
      $("#btn-parents").onclick = openGate;
      $("#gate-cancel").onclick = close;
      $("#btn-parents-back").onclick = () => { Sfx.play("tap"); Router.show("screen-home"); Home.refreshWallet(); };
      $("#p-reset").onclick = () => {
        if (confirm("Reset all progress? · ล้างความคืบหน้าทั้งหมด?")) {
          Store.reset(); openDashboard(); Home.renderGrid(); Home.refreshWallet();
        }
      };
    }
    return { init };
  })();

  /* ==========================================================
     HAND AR — "touch the word with your hand" (โหมดจิ้มคำด้วยมือ)
     Uses the live camera + MediaPipe HandLandmarker to track the
     index fingertip; the child moves their hand to touch the correct
     emoji floating over the video. Tapping also works (fallback), so
     it plays even without hand-tracking or on desktop.
     ========================================================== */
  const HandAR = (function () {
    const DWELL = 550;            // ms to hold the fingertip on a target
    const MODEL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
    const LIB = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
    let view, video, canvas, ctx, hint;
    let landmarker = null, running = false, rafId = null, stream = null;
    let targets = [], target = null, solved = false, hoverId = null, hoverStart = 0, cooldown = 0;

    function init() {
      view = $("#ar-view"); video = $("#ar-video"); canvas = $("#ar-canvas");
      ctx = canvas.getContext("2d"); hint = $("#ar-hint");
      $("#act-ar").onclick = open;
      $("#btn-close-ar").onclick = close;
      // Tap is always available as an alternative input (แตะก็ได้)
      canvas.addEventListener("pointerdown", (e) => {
        if (!running) return;
        const r = canvas.getBoundingClientRect();
        pick({ x: (e.clientX - r.left) * canvas.width / r.width, y: (e.clientY - r.top) * canvas.height / r.height }, true);
      });
      window.addEventListener("resize", () => { if (running) resize(); });
    }

    async function ensureLandmarker() {
      if (landmarker) return landmarker;
      const vision = await import(/* webpackIgnore */ LIB + "/+esm");
      const fileset = await vision.FilesetResolver.forVisionTasks(LIB + "/wasm");
      landmarker = await vision.HandLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL },
        runningMode: "VIDEO", numHands: 1,
      });
      return landmarker;
    }

    async function open() {
      target = Play.getCurrent(); if (!target) return;
      Sfx.play("tap"); solved = false; hoverId = null;
      try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false }); }
      catch (e) { Play.showBubble("No camera here 📷 — try on a phone! · ไม่มีกล้อง ลองบนมือถือ", false); return; }

      view.classList.remove("hidden");
      hint.textContent = "Loading hand tracking… ✋ กำลังโหลด";
      video.srcObject = stream;
      try { await video.play(); } catch (e) {}
      resize(); newRound();

      // Load the hand model in the background; tap already works meanwhile.
      ensureLandmarker()
        .then(() => { hint.innerHTML = `Touch the <b>${target.word}</b> with your hand ✋<br/>ใช้มือแตะคำที่ถูก`; })
        .catch(() => { hint.innerHTML = `Tap the <b>${target.word}</b> 👆<br/>(hand tracking unavailable — แตะได้เลย)`; });

      running = true; loop();
    }

    function resize() { canvas.width = view.clientWidth || innerWidth; canvas.height = view.clientHeight || innerHeight; buildTargets(); }

    function newRound() {
      solved = false; hoverId = null;
      buildTargets();
      Voice.speak(`Touch the ${target.word}!`, { rate: 0.85 });
    }

    function buildTargets() {
      const others = shuffleArr(WORDS.filter((w) => w.id !== target.id)).slice(0, 2);
      const pick = shuffleArr(others.concat(target));
      const W = canvas.width, H = canvas.height, n = pick.length, r = Math.min(W, H) * 0.14;
      targets = pick.map((w, i) => ({ w, x: W * (i + 1) / (n + 1), y: H * 0.36, r }));
      // expose normalized target centers for automated testing (ช่องทางทดสอบ)
      window.__handARTargets = targets.map((t) => ({ id: t.w.id, x: t.x / W, y: t.y / H }));
      window.__handARTarget = target.id;
    }
    function shuffleArr(a) { a = a.slice(); for (let i=a.length-1;i>0;i--){const j=(Math.random()*(i+1))|0;[a[i],a[j]]=[a[j],a[i]];} return a; }

    function fingerPoint(res) {
      if (window.__handTestPoint) return { x: window.__handTestPoint.x * canvas.width, y: window.__handTestPoint.y * canvas.height };
      if (!res || !res.landmarks || !res.landmarks.length) return null;
      const lm = res.landmarks[0][8]; if (!lm) return null;   // index fingertip
      return { x: (1 - lm.x) * canvas.width, y: lm.y * canvas.height }; // mirror x
    }

    function loop() {
      if (!running) return;
      rafId = requestAnimationFrame(loop);
      drawVideo();
      let res = null;
      if (landmarker && video.readyState >= 2 && video.videoWidth) {
        try { res = landmarker.detectForVideo(video, performance.now()); } catch (e) {}
      }
      const fp = fingerPoint(res);
      drawTargets(fp);
      if (fp) { drawCursor(fp); dwellCheck(fp); }
    }

    function drawVideo() {
      const W = canvas.width, H = canvas.height, vw = video.videoWidth || 640, vh = video.videoHeight || 480;
      const s = Math.max(W / vw, H / vh), dw = vw * s, dh = vh * s, dx = (W - dw) / 2, dy = (H - dh) / 2;
      ctx.save(); ctx.translate(W, 0); ctx.scale(-1, 1); // mirror like a selfie
      if (video.videoWidth) ctx.drawImage(video, dx, dy, dw, dh);
      else { ctx.fillStyle = "#222"; ctx.fillRect(0, 0, W, H); }
      ctx.restore();
      // dim slightly so bright targets pop (ลดความสว่างให้เป้าเด่น)
      ctx.fillStyle = "rgba(0,0,0,0.18)"; ctx.fillRect(0, 0, W, H);
    }

    function drawTargets(fp) {
      targets.forEach((t) => {
        const hovering = fp && Math.hypot(fp.x - t.x, fp.y - t.y) < t.r;
        ctx.save();
        ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
        ctx.fillStyle = hovering ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.82)";
        ctx.shadowColor = "rgba(0,0,0,0.35)"; ctx.shadowBlur = 18; ctx.fill();
        if (hovering) { ctx.lineWidth = 6; ctx.strokeStyle = t.w.color; ctx.stroke(); }
        ctx.shadowBlur = 0;
        ctx.font = `${t.r * 1.1}px serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(t.w.emoji, t.x, t.y + t.r * 0.05);
        ctx.font = `bold ${t.r * 0.34}px ${getComputedStyle(document.body).fontFamily}`;
        ctx.fillStyle = "#4E342E"; ctx.fillText(t.w.word, t.x, t.y + t.r * 0.82);
        ctx.restore();
      });
    }

    function drawCursor(fp) {
      ctx.save();
      ctx.beginPath(); ctx.arc(fp.x, fp.y, 26, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,193,7,0.35)"; ctx.fill();
      ctx.font = "44px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("👆", fp.x, fp.y + 20);
      ctx.restore();
    }

    function dwellCheck(fp) {
      if (solved || performance.now() < cooldown) return;
      const t = targets.find((t) => Math.hypot(fp.x - t.x, fp.y - t.y) < t.r);
      if (!t) { hoverId = null; return; }
      if (hoverId !== t.w.id) { hoverId = t.w.id; hoverStart = performance.now(); }
      else if (performance.now() - hoverStart > DWELL) resolve(t);
    }
    // Tap or dwell selection (เลือกด้วยการแตะหรือจิ้มค้าง)
    function pick(fp, isTap) {
      if (solved || performance.now() < cooldown) return;
      const t = targets.find((t) => Math.hypot(fp.x - t.x, fp.y - t.y) < t.r);
      if (t) resolve(t);
    }

    function resolve(t) {
      if (t.w.id === target.id) {
        solved = true;
        Fx.burst(120); Fx.cheer("You got it! 🎉"); Sfx.play("star");
        Voice.speak(`Yes! ${target.word}!`, { rate: 0.85 });
        reward(target.id, "speak", `You found the ${target.word}! ✋`);
        // next round with a fresh random target (เล่นต่อคำใหม่)
        setTimeout(() => { if (!running) return; target = WORDS[(Math.random()*WORDS.length)|0]; newRound(); }, 1700);
      } else {
        cooldown = performance.now() + 500; hoverId = null;
        Sfx.play("pop"); Voice.speak("Try again", { rate: 0.9 });
      }
    }

    function close() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; }
      video.srcObject = null;
      view.classList.add("hidden");
    }
    return { init };
  })();

  /* ==========================================================
     BOOTSTRAP (เริ่มการทำงาน)
     ========================================================== */
  function boot() {
    // Splash → Home (แตะเริ่ม → ปลดล็อกเสียง + นับ streak รายวัน)
    $("#btn-start").onclick = () => {
      Voice.unlock(); Sfx.ac(); Sfx.play("pop");
      Store.touchStreak();
      const sc = $("#streak-count"); if (sc) sc.textContent = Store.streak();
      Router.show("screen-home");
    };
    // Safety net: unlock audio/voice on the very first tap anywhere
    // (บางเบราว์เซอร์ต้องปลดล็อกเสียงจากการแตะครั้งแรก)
    const firstTap = () => { Voice.unlock(); Sfx.ac(); document.removeEventListener("pointerdown", firstTap); };
    document.addEventListener("pointerdown", firstTap, { once: false });
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
    Quiz.init();
    Watch.init();
    Parents.init();
    HandAR.init();

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
