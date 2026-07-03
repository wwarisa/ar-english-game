/**
 * ============================================================
 *  app.js — Game logic (ตรรกะเกมทั้งหมด)
 * ============================================================
 *  Vanilla JS only. Organised into small modules:
 *    1) AR / Marker handling      (จัดการมาร์กเกอร์ + โมเดล)
 *    2) Speak feature (mic reward) (เกมพูด/ตะโกน ด้วยไมค์)
 *    3) Write feature (tracing)    (เกมลากเส้นตัวอักษร)
 *
 *  Everything is wrapped in one IIFE to avoid polluting the
 *  global scope. (ห่อทั้งหมดไว้ใน IIFE กันตัวแปรชนกัน)
 * ============================================================
 */
(function () {
  "use strict";

  // The active vocabulary item chosen in vocabulary.js
  // (คำศัพท์ที่กำลังใช้งาน มาจาก vocabulary.js)
  const WORD = window.ACTIVE_WORD || {
    word: "Cat", letter: "C", fallbackColor: "#FF7043",
    phonicsSound: "", animalSound: "", model3d: "",
  };

  /* ==========================================================
     0) Tiny helpers (ฟังก์ชันช่วยเล็ก ๆ)
     ========================================================== */

  // Safe query selector (หา element แบบปลอดภัย)
  const $ = (sel) => document.querySelector(sel);

  /**
   * Play an audio file safely. If the file is missing/blocked,
   * we log instead of crashing. (เล่นเสียงแบบปลอดภัย ถ้าไม่มีไฟล์ก็ไม่พัง)
   * Browsers require a user gesture before audio can play; the
   * first successful marker sound may be silent until the child
   * taps a button — that is expected on mobile.
   */
  function playSound(path, label) {
    if (!path) {
      console.log(`[SOUND] (no file) would play: ${label}`);
      return;
    }
    try {
      const audio = new Audio(path);
      audio.play().catch((err) => {
        // Autoplay blocked or file missing (เสียงถูกบล็อกหรือไม่มีไฟล์)
        console.log(`[SOUND] "${label}" blocked/missing:`, err.message);
      });
    } catch (err) {
      console.log(`[SOUND] error for "${label}":`, err.message);
    }
  }

  /* ==========================================================
     1) AR / MARKER MODULE (โมดูลมาร์กเกอร์ AR)
     ========================================================== */
  const AR = (function () {
    let marker, box, label, hint;
    let isVisible = false;

    function init() {
      marker = $("#hiro-marker");
      box = $("#animal-box");
      label = $("#animal-label");
      hint = $("#status-hint");

      // Apply the chosen word's data to the scene
      // (ใส่ข้อมูลคำศัพท์ลงในฉาก)
      if (box) box.setAttribute("color", WORD.fallbackColor);
      if (label) label.setAttribute("value", WORD.word);

      // Try to load a real 3D model if the path is provided.
      // If it 404s, A-Frame keeps the colored box as fallback.
      // (ลองโหลดโมเดลจริง ถ้าไม่มีก็ใช้กล่องสีแทน)
      maybeLoadModel();

      // Marker events fired by AR.js (เหตุการณ์จาก AR.js)
      if (marker) {
        marker.addEventListener("markerFound", onFound);
        marker.addEventListener("markerLost", onLost);
      }
    }

    // Attempt to swap the box for a glTF model (สลับกล่องเป็นโมเดล 3 มิติ)
    function maybeLoadModel() {
      if (!WORD.model3d) return;
      // Probe the file with fetch(HEAD) so a missing model never
      // breaks the scene. (ตรวจว่ามีไฟล์โมเดลจริงไหมก่อนใช้)
      fetch(WORD.model3d, { method: "HEAD" })
        .then((res) => {
          if (!res.ok) throw new Error("model not found");
          const model = document.createElement("a-gltf-model");
          model.setAttribute("id", "animal-model");
          model.setAttribute("src", WORD.model3d);
          model.setAttribute("position", "0 0 0");
          model.setAttribute("scale", "0.5 0.5 0.5");
          marker.appendChild(model);
          if (box) box.setAttribute("visible", "false"); // hide placeholder
          console.log("[AR] 3D model loaded:", WORD.model3d);
        })
        .catch(() => {
          console.log("[AR] No 3D model, using colored box fallback.");
        });
    }

    // ----- markerFound: play phonics + animal sound (เจอมาร์กเกอร์) -----
    function onFound() {
      if (isVisible) return;
      isVisible = true;
      console.log(`[AR] markerFound → "${WORD.word}"`);

      // 1) phonics letter sound, 2) then the animal sound
      // (เล่นเสียงโฟนิกส์ก่อน แล้วตามด้วยเสียงสัตว์)
      playSound(WORD.phonicsSound, `phonics /${WORD.letter}/`);
      setTimeout(() => playSound(WORD.animalSound, `${WORD.word} sound`), 900);

      if (hint) hint.classList.add("found"); // fade the hint out
    }

    // ----- markerLost (มาร์กเกอร์หายไป) -----
    function onLost() {
      isVisible = false;
      console.log("[AR] markerLost");
      if (hint) hint.classList.remove("found");
    }

    // Trigger the celebratory jump/scale on the 3D model.
    // Called by the Speak module as positive reinforcement.
    // (สั่งให้โมเดลกระโดด/ขยาย เป็นรางวัลกำลังใจ)
    function celebrate() {
      const target = $("#animal-model") || box;
      if (!target) return;

      // Use A-Frame's animation component for a bouncy jump.
      // We remove then re-add so it re-triggers each time.
      // (ใช้ระบบ animation ของ A-Frame ให้เด้งใหม่ทุกครั้ง)
      target.removeAttribute("animation__jump");
      target.removeAttribute("animation__grow");

      // next frame so the removal registers (รอเฟรมถัดไป)
      requestAnimationFrame(() => {
        target.setAttribute("animation__jump", {
          property: "position",
          from: "0 0.5 0",
          to: "0 1.6 0",
          dur: 350,
          dir: "alternate",
          loop: 3,           // up-down 3 times (เด้ง 3 ครั้ง)
          easing: "easeOutQuad",
        });
        target.setAttribute("animation__grow", {
          property: "scale",
          from: "1 1 1",
          to: "1.4 1.4 1.4",
          dur: 350,
          dir: "alternate",
          loop: 3,
          easing: "easeOutQuad",
        });
      });

      console.log("[AR] 🎉 Reward animation played!");
    }

    return { init, celebrate };
  })();

  /* ==========================================================
     2) SPEAK MODULE — microphone volume reward
        (โมดูลพูด: วัดความดังเสียงแล้วให้รางวัล)
     ========================================================== */
  const Speak = (function () {
    const VOLUME_THRESHOLD = 30;   // 0–255. Tune for your room (ปรับตามห้อง)
    const LISTEN_MS = 5000;        // stop mic after 5s (ปิดไมค์ใน 5 วินาที)

    let audioCtx, analyser, micStream, rafId, timeoutId;
    let recognition;               // Web Speech recognizer (ตัวรู้จำคำพูด)
    let listening = false;
    let rewarded = false;          // reward only once per session (ให้รางวัลครั้งเดียว)
    let btn;

    function init() {
      btn = $("#btn-speak");
      if (btn) btn.addEventListener("click", start);
    }

    /**
     * Try to recognise the actual word being said (การรู้จำคำพูด).
     * Optional upgrade: if the browser supports the Web Speech API
     * (Chrome/Edge/Android), we listen for WORD.word. Matching the
     * word is a *better* reward signal than just shouting.
     * On unsupported browsers this silently does nothing and we
     * fall back to the volume detector. (เบราว์เซอร์ที่ไม่รองรับก็ใช้ความดังแทน)
     */
    function startRecognition() {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) {
        console.log("[SPEAK] Web Speech not supported → using volume only.");
        return;
      }
      try {
        recognition = new SR();
        recognition.lang = "en-US";
        recognition.interimResults = true;   // react to partial results (เร็วขึ้น)
        recognition.continuous = true;
        recognition.maxAlternatives = 3;

        recognition.onresult = (e) => {
          // Gather all heard text (รวมข้อความที่ได้ยินทั้งหมด)
          let heard = "";
          for (let i = 0; i < e.results.length; i++) {
            for (let j = 0; j < e.results[i].length; j++) {
              heard += " " + e.results[i][j].transcript;
            }
          }
          heard = heard.toLowerCase();
          console.log("[SPEAK] heard:", heard.trim());

          if (!rewarded && heard.includes(WORD.word.toLowerCase())) {
            console.log(`[SPEAK] ✅ Said the word "${WORD.word}"!`);
            reward();
          }
        };

        // Errors (no-speech, denied, etc.) are non-fatal (ไม่ทำให้พัง)
        recognition.onerror = (e) =>
          console.log("[SPEAK] recognition error:", e.error);

        recognition.start();
      } catch (err) {
        console.log("[SPEAK] recognition start failed:", err.message);
      }
    }

    // Central reward action, shared by voice + volume (รางวัลกลาง ใช้ร่วมกัน)
    function reward() {
      if (rewarded) return;
      rewarded = true;
      AR.celebrate();                       // 3D model jumps (โมเดลกระโดด)
      btn.classList.add("reward");
      setTimeout(() => btn.classList.remove("reward"), 600);
      playSound(WORD.animalSound, `${WORD.word} cheer`);
    }

    async function start() {
      if (listening) return; // ignore double taps (กันกดซ้ำ)
      console.log("[SPEAK] Requesting microphone…");

      try {
        // Ask for mic permission (ขอสิทธิ์ใช้ไมโครโฟน)
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        console.log("[SPEAK] Mic denied/unavailable:", err.message);
        alert("Please allow microphone 🎤\nกรุณาอนุญาตให้ใช้ไมโครโฟน");
        return;
      }

      listening = true;
      rewarded = false;
      btn.classList.add("listening");

      // Start optional word recognition alongside the volume meter
      // (เริ่มการรู้จำคำพูดควบคู่กับการวัดความดัง)
      startRecognition();

      // Set up Web Audio graph (สร้างระบบวิเคราะห์เสียง)
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioCtx();
      const source = audioCtx.createMediaStreamSource(micStream);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;                 // small = light on mobile (เบา)
      source.connect(analyser);

      const data = new Uint8Array(analyser.frequencyBinCount);

      // Poll the volume each frame (วัดความดังทุกเฟรม)
      function tick() {
        analyser.getByteFrequencyData(data);

        // Average magnitude = rough loudness (ค่าเฉลี่ย = ความดังคร่าว ๆ)
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        const volume = sum / data.length;

        // Fallback reward: child shouted loudly enough
        // (รางวัลสำรอง: เด็กตะโกนดังพอ แม้ระบบไม่รู้จำคำ)
        if (!rewarded && volume > VOLUME_THRESHOLD) {
          console.log(`[SPEAK] 👏 Loud enough! volume=${volume.toFixed(1)}`);
          reward();
        }

        rafId = requestAnimationFrame(tick);
      }
      tick();

      // Auto-stop after 5 seconds (ปิดไมค์อัตโนมัติ)
      timeoutId = setTimeout(stop, LISTEN_MS);
    }

    // Cleanly release the mic + audio graph (คืนทรัพยากรไมค์)
    function stop() {
      if (!listening) return;
      listening = false;
      console.log("[SPEAK] Stopping mic.");

      if (rafId) cancelAnimationFrame(rafId);
      if (timeoutId) clearTimeout(timeoutId);
      if (recognition) { try { recognition.stop(); } catch (e) {} recognition = null; }
      if (micStream) micStream.getTracks().forEach((t) => t.stop()); // free mic
      if (audioCtx && audioCtx.state !== "closed") audioCtx.close();

      if (btn) btn.classList.remove("listening");
    }

    return { init };
  })();

  /* ==========================================================
     3) WRITE MODULE — trace-the-letter canvas
        (โมดูลเขียน: ลากเส้นตามตัวอักษร ฝึกกล้ามเนื้อมัดเล็ก)
     ========================================================== */
  const Write = (function () {
    let modal, canvas, ctx, openBtn, closeBtn, clearBtn;
    let drawing = false;
    let size = 320;                 // logical canvas size (ขนาดตรรกะ)

    function init() {
      modal = $("#write-modal");
      canvas = $("#write-canvas");
      openBtn = $("#btn-write");
      closeBtn = $("#btn-close-write");
      clearBtn = $("#btn-clear");

      if (!canvas) return;
      ctx = canvas.getContext("2d");

      // Match canvas resolution to display size × DPR for crisp lines
      // (ทำให้เส้นคมชัดตามความละเอียดจอ)
      setupCanvasResolution();

      // Button wiring (ผูกปุ่ม)
      if (openBtn) openBtn.addEventListener("click", open);
      if (closeBtn) closeBtn.addEventListener("click", close);
      if (clearBtn) clearBtn.addEventListener("click", drawGuideLetter);

      // Pointer/touch/mouse events (เหตุการณ์แตะ/เมาส์)
      // pointer events cover mouse + touch + pen in one API.
      canvas.addEventListener("pointerdown", startStroke);
      canvas.addEventListener("pointermove", moveStroke);
      canvas.addEventListener("pointerup", endStroke);
      canvas.addEventListener("pointercancel", endStroke);
      canvas.addEventListener("pointerleave", endStroke);
    }

    function setupCanvasResolution() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      size = rect.width || 320;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      ctx.scale(dpr, dpr);          // draw in CSS pixels (วาดในหน่วย CSS px)
    }

    // Show the modal + draw the dashed guide letter (เปิดหน้าต่างเขียน)
    function open() {
      modal.classList.remove("hidden");
      modal.setAttribute("aria-hidden", "false");
      // Recompute size in case orientation changed (เผื่อหมุนจอ)
      requestAnimationFrame(() => {
        setupCanvasResolution();
        drawGuideLetter();
      });
      console.log("[WRITE] Opened. Trace the letter:", WORD.letter);
    }

    function close() {
      modal.classList.add("hidden");
      modal.setAttribute("aria-hidden", "true");
      console.log("[WRITE] Closed, back to AR.");
    }

    // Draw the big grey dashed target letter (วาดตัวอักษรจาง ๆ เส้นประ)
    function drawGuideLetter() {
      ctx.clearRect(0, 0, size, size);

      ctx.save();
      ctx.font = `bold ${size * 0.7}px "Comic Sans MS", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.setLineDash([10, 12]);     // dashed outline (เส้นประ)
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#BDBDBD";   // soft grey guide (สีเทาอ่อน)
      ctx.fillStyle = "rgba(189,189,189,0.15)";

      // Draw the ACTIVE word's letter (e.g. "C" for Cat)
      ctx.fillText(WORD.letter, size / 2, size / 2 + size * 0.03);
      ctx.strokeText(WORD.letter, size / 2, size / 2 + size * 0.03);
      ctx.restore();

      // Prepare the "crayon" style for the child's tracing strokes
      // (ตั้งค่าปากกาสีหนา ๆ เหมือนสีเทียนสำหรับเด็กลาก)
      ctx.lineWidth = 18;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = WORD.fallbackColor; // colorful, matches the animal
    }

    // Convert a pointer event to canvas coords (แปลงพิกัดจากอีเวนต์)
    function getPos(e) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) * (size / rect.width),
        y: (e.clientY - rect.top) * (size / rect.height),
      };
    }

    function startStroke(e) {
      e.preventDefault();
      drawing = true;
      const p = getPos(e);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
    }

    function moveStroke(e) {
      if (!drawing) return;
      e.preventDefault();
      const p = getPos(e);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }

    function endStroke(e) {
      if (!drawing) return;
      e && e.preventDefault();
      drawing = false;
      ctx.closePath();
    }

    return { init };
  })();

  /* ==========================================================
     BOOTSTRAP (เริ่มการทำงาน)
     A-Frame's scene may still be initialising; wait for it so
     marker entities exist before we bind events.
     (รอให้ฉาก A-Frame พร้อมก่อนผูกอีเวนต์)
     ========================================================== */
  function boot() {
    const scene = document.querySelector("a-scene");
    if (scene && scene.hasLoaded) {
      startAll();
    } else if (scene) {
      scene.addEventListener("loaded", startAll);
    } else {
      startAll(); // no scene (should not happen) — start UI anyway
    }
  }

  function startAll() {
    AR.init();
    Speak.init();
    Write.init();
    console.log("🦁 AR Magic English Safari ready! Active word:", WORD.word);
  }

  // app.js is loaded with 'defer', so the DOM is parsed here.
  // (ไฟล์นี้ใช้ defer ดังนั้น DOM พร้อมแล้ว)
  boot();
})();
