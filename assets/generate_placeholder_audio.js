/**
 * generate_placeholder_audio.js
 * ------------------------------------------------------------
 * สคริปต์ Node สร้างไฟล์เสียง WAV แบบชั่วคราว (placeholder)
 * เพื่อให้ทดสอบเกมได้ก่อนหาไฟล์เสียงจริง
 *
 * Run once:  node assets/generate_placeholder_audio.js
 * แล้วลบทิ้งได้เมื่อมีไฟล์เสียงจริงแล้ว
 *
 * NOTE: outputs .wav (uncompressed). vocabulary.js points to
 * these .wav paths. Replace with real .mp3/.wav later.
 * ------------------------------------------------------------
 */
const fs = require("fs");
const path = require("path");

const SAMPLE_RATE = 22050; // เบา พอสำหรับ placeholder

// สร้าง WAV mono 16-bit จากฟังก์ชันคลื่นเสียง
function writeWav(filePath, seconds, waveFn) {
  const n = Math.floor(SAMPLE_RATE * seconds);
  const dataSize = n * 2; // 16-bit = 2 bytes/sample
  const buf = Buffer.alloc(44 + dataSize);

  // ---- WAV header ----
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);          // PCM chunk size
  buf.writeUInt16LE(1, 20);           // PCM format
  buf.writeUInt16LE(1, 22);           // mono
  buf.writeUInt32LE(SAMPLE_RATE, 24);
  buf.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buf.writeUInt16LE(2, 32);           // block align
  buf.writeUInt16LE(16, 34);          // bits per sample
  buf.write("data", 36);
  buf.writeUInt32LE(dataSize, 40);

  // ---- samples ----
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    // envelope: fade in/out กันเสียงป๊อก
    const env = Math.min(1, t * 20) * Math.min(1, (seconds - t) * 8);
    let s = waveFn(t) * env * 0.4; // 0.4 = ระดับเสียงพอดี ไม่ดังจนตกใจ
    s = Math.max(-1, Math.min(1, s));
    buf.writeInt16LE((s * 32767) | 0, 44 + i * 2);
  }

  fs.writeFileSync(filePath, buf);
  console.log("✔ created", path.relative(process.cwd(), filePath));
}

const audioDir = path.join(__dirname, "audio");
if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });

const tone = (freq) => (t) => Math.sin(2 * Math.PI * freq * t);
// เสียงกระดิ่งเล็ก ๆ (สองความถี่ผสม) สำหรับเสียงสัตว์
const chirp = (f1, f2) => (t) =>
  0.6 * Math.sin(2 * Math.PI * f1 * t) + 0.4 * Math.sin(2 * Math.PI * f2 * t);

// Phonics = โทนสั้นเดี่ยว, Animal = โทนผสมยาวขึ้น
const files = {
  "phonics_c.wav": [0.4, tone(523)],   // C ~ โด
  "phonics_d.wav": [0.4, tone(587)],   // D ~ เร
  "phonics_b.wav": [0.4, tone(494)],   // B ~ ที
  "phonics_f.wav": [0.4, tone(698)],   // F ~ ฟา
  "cat_meow.wav": [0.6, chirp(700, 900)],
  "dog_bark.wav": [0.5, chirp(200, 320)],
  "bird_tweet.wav": [0.5, chirp(1200, 1600)],
  "fish_bubble.wav": [0.5, chirp(400, 250)],
};

for (const [name, [dur, fn]] of Object.entries(files)) {
  writeWav(path.join(audioDir, name), dur, fn);
}
console.log("\n🎧 Placeholder audio ready in assets/audio/");
