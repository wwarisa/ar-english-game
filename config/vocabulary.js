/**
 * ============================================================
 *  vocabulary.js  —  คลังคำศัพท์ (Vocabulary Data Module)
 * ============================================================
 *  A modular dictionary of vocabulary items for the AR game.
 *  โมดูลเก็บข้อมูลคำศัพท์แบบแยกส่วน เพิ่ม/แก้ไขคำได้ง่าย
 *
 *  Each entry holds:
 *   - word         : the English word (คำศัพท์ภาษาอังกฤษ)
 *   - letter       : target letter for the writing game (ตัวอักษรที่ให้ฝึกเขียน)
 *   - phonicsSound : path to phonics pronunciation audio (เสียงโฟนิกส์)
 *   - animalSound  : path to the animal/object sound effect (เสียงสัตว์/วัตถุ)
 *   - model3d      : path to a glTF/GLB 3D model (โมเดล 3 มิติ)
 *   - fallbackColor: hex color used if the 3D model is missing/fails
 *                    (สีสำรองใช้เมื่อโหลดโมเดลไม่ได้)
 *
 *  NOTE: Audio/model paths are placeholders. Drop your own assets
 *  into /assets and update the paths. Missing files degrade
 *  gracefully (see app.js).
 * ============================================================
 */

const VOCABULARY = {
  cat: {
    word: "Cat",
    letter: "C",
    phonicsSound: "assets/audio/phonics_c.wav", // /k/ - "kuh"
    animalSound: "assets/audio/cat_meow.wav",
    model3d: "assets/models/cat.glb",
    fallbackColor: "#FF7043", // warm orange (สีส้ม)
  },

  dog: {
    word: "Dog",
    letter: "D",
    phonicsSound: "assets/audio/phonics_d.wav", // /d/ - "duh"
    animalSound: "assets/audio/dog_bark.wav",
    model3d: "assets/models/dog.glb",
    fallbackColor: "#8D6E63", // brown (สีน้ำตาล)
  },

  bird: {
    word: "Bird",
    letter: "B",
    phonicsSound: "assets/audio/phonics_b.wav", // /b/ - "buh"
    animalSound: "assets/audio/bird_tweet.wav",
    model3d: "assets/models/bird.glb",
    fallbackColor: "#42A5F5", // sky blue (สีฟ้า)
  },

  fish: {
    word: "Fish",
    letter: "F",
    phonicsSound: "assets/audio/phonics_f.wav", // /f/ - "fff"
    animalSound: "assets/audio/fish_bubble.wav",
    model3d: "assets/models/fish.glb",
    fallbackColor: "#26C6DA", // aqua (สีเขียวน้ำทะเล)
  },
};

/**
 * ACTIVE_WORD_KEY — the vocabulary item currently attached to the
 * Hiro marker. Change this key to switch which animal appears.
 * (คำที่กำลังใช้งานอยู่ เปลี่ยนค่านี้เพื่อสลับสัตว์)
 *
 * For a full multi-marker experience you would map different markers
 * to different keys; here we keep ONE active word for simplicity and
 * performance on mobile. (ใช้คำเดียวเพื่อให้เบาสำหรับมือถือ)
 */
const ACTIVE_WORD_KEY = "cat";

// Expose to the global scope so index.html + app.js (plain <script>)
// can read them without a module bundler.
// เปิดให้ไฟล์อื่นเข้าถึงผ่าน window (ไม่ต้องใช้ bundler)
window.VOCABULARY = VOCABULARY;
window.ACTIVE_WORD_KEY = ACTIVE_WORD_KEY;
window.ACTIVE_WORD = VOCABULARY[ACTIVE_WORD_KEY];
