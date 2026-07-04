/**
 * ============================================================
 *  vocabulary.js — Curriculum & word data (หลักสูตร + คลังคำศัพท์)
 * ============================================================
 *  A structured, teacher-designed curriculum for ages 0–5.
 *  หลักสูตรออกแบบตามพัฒนาการเด็ก แบ่งเป็นหมวด เรียงจากง่ายไปยาก
 *
 *  Design notes (หลักการออกแบบ):
 *   - Emoji is the "character" so it looks friendly & works on
 *     every device with no 3D asset downloads (ใช้อีโมจิเป็นตัวละคร).
 *   - Real English pronunciation comes from the browser's
 *     Speech Synthesis (TTS) — no audio files required.
 *     (ออกเสียงจริงด้วย TTS ของเบราว์เซอร์)
 *   - Every word has a Thai translation to support bilingual homes.
 *
 *  Each WORD entry:
 *   - id           : unique key (คีย์)
 *   - word         : English word (คำอังกฤษ)
 *   - letter       : target uppercase letter for tracing (ตัวอักษรฝึกเขียน)
 *   - emoji        : the visual character (ตัวละครอีโมจิ)
 *   - category     : group id (หมวด)
 *   - thai         : Thai meaning (คำแปลไทย)
 *   - phonics      : approximate phonic sound spelled for TTS (เสียงโฟนิกส์)
 *   - sentence     : tiny example sentence (ประโยคง่าย ๆ)
 *   - sentenceThai : Thai of the sentence (คำแปลประโยค)
 *   - color        : theme/fallback color hex (สีประจำคำ)
 *   - audio        : OPTIONAL real recordings (ไฟล์เสียงจริง ถ้ามี)
 * ============================================================
 */

// ---- Categories (หมวดหมู่) ----
const CATEGORIES = {
  animals: { id: "animals", label: "Animals", thai: "สัตว์",   emoji: "🐾", color: "#FF8A65" },
  food:    { id: "food",    label: "Food",    thai: "อาหาร",   emoji: "🍎", color: "#EF5350" },
  nature:  { id: "nature",  label: "Nature",  thai: "ธรรมชาติ", emoji: "🌳", color: "#66BB6A" },
  colors:  { id: "colors",  label: "Colors",  thai: "สี",      emoji: "🎨", color: "#AB47BC" },
  numbers: { id: "numbers", label: "Numbers", thai: "ตัวเลข",  emoji: "🔢", color: "#29B6F6" },
  shapes:  { id: "shapes",  label: "Shapes",  thai: "รูปทรง",  emoji: "🔷", color: "#26A69A" },
};

// ---- Words (คำศัพท์) — ordered easy → richer ----
const WORDS = [
  // ===== ANIMALS (สัตว์) =====
  {
    id: "cat", word: "Cat", letter: "C", emoji: "🐱", category: "animals",
    thai: "แมว", phonics: "kuh", sentence: "The cat says meow.",
    sentenceThai: "แมวร้องเหมียว", color: "#FF7043",
    audio: { word: "assets/audio/cat_meow.wav" },
  },
  {
    id: "dog", word: "Dog", letter: "D", emoji: "🐶", category: "animals",
    thai: "สุนัข", phonics: "duh", sentence: "The dog says woof.",
    sentenceThai: "สุนัขเห่าโฮ่ง", color: "#8D6E63",
    audio: { word: "assets/audio/dog_bark.wav" },
  },
  {
    id: "bird", word: "Bird", letter: "B", emoji: "🐦", category: "animals",
    thai: "นก", phonics: "buh", sentence: "The bird can fly.",
    sentenceThai: "นกบินได้", color: "#42A5F5",
    audio: { word: "assets/audio/bird_tweet.wav" },
  },
  {
    id: "fish", word: "Fish", letter: "F", emoji: "🐠", category: "animals",
    thai: "ปลา", phonics: "fff", sentence: "The fish can swim.",
    sentenceThai: "ปลาว่ายน้ำได้", color: "#26C6DA",
    audio: { word: "assets/audio/fish_bubble.wav" },
  },
  {
    id: "lion", word: "Lion", letter: "L", emoji: "🦁", category: "animals",
    thai: "สิงโต", phonics: "lll", sentence: "The lion is big.",
    sentenceThai: "สิงโตตัวใหญ่", color: "#FFB300",
  },
  {
    id: "elephant", word: "Elephant", letter: "E", emoji: "🐘", category: "animals",
    thai: "ช้าง", phonics: "eh", sentence: "The elephant is grey.",
    sentenceThai: "ช้างสีเทา", color: "#90A4AE",
  },

  // ===== FOOD (อาหาร) =====
  {
    id: "apple", word: "Apple", letter: "A", emoji: "🍎", category: "food",
    thai: "แอปเปิล", phonics: "ah", sentence: "The apple is red.",
    sentenceThai: "แอปเปิลสีแดง", color: "#EF5350",
  },
  {
    id: "banana", word: "Banana", letter: "B", emoji: "🍌", category: "food",
    thai: "กล้วย", phonics: "buh", sentence: "The banana is yellow.",
    sentenceThai: "กล้วยสีเหลือง", color: "#FDD835",
  },
  {
    id: "egg", word: "Egg", letter: "E", emoji: "🥚", category: "food",
    thai: "ไข่", phonics: "eh", sentence: "I eat an egg.",
    sentenceThai: "ฉันกินไข่", color: "#FFF59D",
  },

  // ===== NATURE (ธรรมชาติ) =====
  {
    id: "sun", word: "Sun", letter: "S", emoji: "☀️", category: "nature",
    thai: "พระอาทิตย์", phonics: "sss", sentence: "The sun is hot.",
    sentenceThai: "พระอาทิตย์ร้อน", color: "#FFA726",
  },
  {
    id: "moon", word: "Moon", letter: "M", emoji: "🌙", category: "nature",
    thai: "พระจันทร์", phonics: "mmm", sentence: "The moon is at night.",
    sentenceThai: "พระจันทร์มาตอนกลางคืน", color: "#7E57C2",
  },
  {
    id: "tree", word: "Tree", letter: "T", emoji: "🌳", category: "nature",
    thai: "ต้นไม้", phonics: "tuh", sentence: "The tree is tall.",
    sentenceThai: "ต้นไม้สูง", color: "#66BB6A",
  },

  // ===== COLORS (สี) =====
  {
    id: "red", word: "Red", letter: "R", emoji: "🔴", category: "colors",
    thai: "สีแดง", phonics: "ruh", sentence: "The apple is red.",
    sentenceThai: "แอปเปิลสีแดง", color: "#EF5350",
  },
  {
    id: "blue", word: "Blue", letter: "B", emoji: "🔵", category: "colors",
    thai: "สีน้ำเงิน", phonics: "buh", sentence: "The sky is blue.",
    sentenceThai: "ท้องฟ้าสีน้ำเงิน", color: "#2196F3",
  },
  {
    id: "green", word: "Green", letter: "G", emoji: "🟢", category: "colors",
    thai: "สีเขียว", phonics: "guh", sentence: "The grass is green.",
    sentenceThai: "หญ้าสีเขียว", color: "#66BB6A",
  },
  {
    id: "yellow", word: "Yellow", letter: "Y", emoji: "🟡", category: "colors",
    thai: "สีเหลือง", phonics: "yuh", sentence: "The sun is yellow.",
    sentenceThai: "พระอาทิตย์สีเหลือง", color: "#FDD835",
  },

  // ===== NUMBERS (ตัวเลข) — trace the DIGIT (ฝึกเขียนตัวเลข) =====
  {
    id: "one", word: "One", letter: "1", emoji: "1️⃣", category: "numbers",
    thai: "หนึ่ง", phonics: "wun", sentence: "I have one nose.",
    sentenceThai: "ฉันมีจมูกหนึ่งอัน", color: "#29B6F6",
  },
  {
    id: "two", word: "Two", letter: "2", emoji: "2️⃣", category: "numbers",
    thai: "สอง", phonics: "too", sentence: "I have two eyes.",
    sentenceThai: "ฉันมีตาสองข้าง", color: "#26C6DA",
  },
  {
    id: "three", word: "Three", letter: "3", emoji: "3️⃣", category: "numbers",
    thai: "สาม", phonics: "three", sentence: "I see three stars.",
    sentenceThai: "ฉันเห็นดาวสามดวง", color: "#5C6BC0",
  },
  {
    id: "four", word: "Four", letter: "4", emoji: "4️⃣", category: "numbers",
    thai: "สี่", phonics: "for", sentence: "A cat has four legs.",
    sentenceThai: "แมวมีสี่ขา", color: "#7E57C2",
  },
  {
    id: "five", word: "Five", letter: "5", emoji: "5️⃣", category: "numbers",
    thai: "ห้า", phonics: "fai-v", sentence: "I have five fingers.",
    sentenceThai: "ฉันมีห้านิ้ว", color: "#AB47BC",
  },

  // ===== SHAPES (รูปทรง) =====
  {
    id: "circle", word: "Circle", letter: "C", emoji: "⭕", category: "shapes",
    thai: "วงกลม", phonics: "sur", sentence: "The sun is a circle.",
    sentenceThai: "พระอาทิตย์เป็นวงกลม", color: "#EF5350",
  },
  {
    id: "square", word: "Square", letter: "S", emoji: "🟦", category: "shapes",
    thai: "สี่เหลี่ยม", phonics: "skw", sentence: "A window is a square.",
    sentenceThai: "หน้าต่างเป็นสี่เหลี่ยม", color: "#42A5F5",
  },
  {
    id: "triangle", word: "Triangle", letter: "T", emoji: "🔺", category: "shapes",
    thai: "สามเหลี่ยม", phonics: "try", sentence: "The roof is a triangle.",
    sentenceThai: "หลังคาเป็นสามเหลี่ยม", color: "#EF5350",
  },
  {
    id: "star", word: "Star", letter: "S", emoji: "⭐", category: "shapes",
    thai: "ดาว", phonics: "star", sentence: "The star is in the sky.",
    sentenceThai: "ดาวอยู่บนท้องฟ้า", color: "#FFC107",
  },
  {
    id: "heart", word: "Heart", letter: "H", emoji: "❤️", category: "shapes",
    thai: "หัวใจ", phonics: "hart", sentence: "I love you, heart.",
    sentenceThai: "หัวใจ ฉันรักเธอ", color: "#EC407A",
  },
];

// ---- Fast lookup map by id (แมพค้นหาด้วย id) ----
const WORDS_BY_ID = WORDS.reduce((acc, w) => {
  acc[w.id] = w;
  return acc;
}, {});

/**
 * Legacy single-word fields kept so the older Hiro AR marker path
 * keeps working. (คงตัวแปรเดิมไว้ให้โค้ด AR มาร์กเกอร์เก่ายังทำงาน)
 */
const ACTIVE_WORD_KEY = "cat";

// Expose everything on window (no bundler) — เปิดให้ไฟล์อื่นใช้ผ่าน window
window.CATEGORIES = CATEGORIES;
window.WORDS = WORDS;
window.WORDS_BY_ID = WORDS_BY_ID;
window.ACTIVE_WORD_KEY = ACTIVE_WORD_KEY;
window.ACTIVE_WORD = WORDS_BY_ID[ACTIVE_WORD_KEY];
// Back-compat alias (บางส่วนของโค้ดเดิมอ้าง VOCABULARY)
window.VOCABULARY = WORDS_BY_ID;
