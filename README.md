# 🦁 AR Magic English Safari

เกม WebAR สอนคำศัพท์ภาษาอังกฤษสำหรับเด็ก 0–5 ปี — เล็งกล้องไปที่การ์ด แล้วสัตว์ 3 มิติจะโผล่มา พร้อมเกม **พูด (🎤)** และ **เขียน (✍️)**

100% ฟรี โฮสต์บน GitHub Pages ได้ — ใช้แค่ HTML / CSS / Vanilla JS / A-Frame 1.2.0 / AR.js

---

## 📁 โครงสร้างไฟล์
```
ar-english-safari/
├── index.html              # ฉาก AR + ปุ่ม UI + หน้าต่างเขียน
├── style.css               # UI สีสันสำหรับเด็ก
├── app.js                  # ตรรกะเกม (marker / speak / write)
├── config/
│   └── vocabulary.js       # คลังคำศัพท์ (แก้ที่นี่เพื่อเพิ่มคำ)
└── assets/
    ├── audio/              # เสียงโฟนิกส์ + เสียงสัตว์ (มี placeholder .wav แล้ว)
    ├── models/             # โมเดล .glb (ยังไม่มี → ใช้กล่องสีแทน)
    └── markers/PRINT_ME.html   # หน้าพิมพ์การ์ด Hiro
```

---

## ▶️ วิธีทดสอบในเครื่อง (Local)
กล้อง/ไมค์ **ต้องรันผ่านเซิร์ฟเวอร์** เปิดไฟล์ตรง ๆ (`file://`) จะไม่ทำงาน

```bash
# ในโฟลเดอร์โปรเจกต์
npx http-server .
```
แล้วเปิด `http://localhost:8080` ในเบราว์เซอร์ (บนคอมฯ `localhost` ใช้กล้อง/ไมค์ได้)

> 📱 ทดสอบบน **มือถือ** ต้องใช้ **HTTPS** → ดีที่สุดคือ deploy ขึ้น GitHub Pages (ด้านล่าง)

---

## 🖨️ การ์ด Hiro Marker
1. เปิด `assets/markers/PRINT_ME.html` (ต้องต่อเน็ตครั้งแรกเพื่อโหลดรูป)
2. กด `Ctrl/Cmd + P` พิมพ์ลงกระดาษ **ด้าน** (ไม่สะท้อนแสง)
3. เปิดแอป แล้วเล็งกล้องไปที่การ์ด → สัตว์ + ตัวอักษรจะลอยขึ้นมา

---

## 🎮 วิธีเล่น
- **เจอการ์ด** → เล่นเสียงโฟนิกส์ตามด้วยเสียงสัตว์อัตโนมัติ
- **🎤 Speak** → ขออนุญาตไมค์ 5 วินาที ถ้าเด็ก **พูดคำถูก** (เช่น "cat") หรือ **ตะโกนดังพอ** → โมเดลกระโดดฉลอง
  - รู้จำคำได้บน Chrome/Edge/Android (Web Speech API); เบราว์เซอร์อื่นใช้การวัดความดังแทน
- **✍️ Write** → เปิดกระดานลากเส้นตามตัวอักษรจาง ๆ (ฝึกกล้ามเนื้อมัดเล็ก) → กด ✅ กลับสู่ AR

---

## 🔤 เพิ่ม/แก้คำศัพท์
แก้ที่ `config/vocabulary.js` เพิ่ม entry ใหม่ แล้วเปลี่ยน `ACTIVE_WORD_KEY` เพื่อสลับคำที่แสดง

---

## 🚀 Deploy ขึ้น GitHub Pages (ฟรี + HTTPS)
```bash
git init
git add .
git commit -m "AR Magic English Safari"
git branch -M main
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main
```
แล้วไปที่ **Settings → Pages → Branch: main / (root) → Save**
รอสักครู่จะได้ลิงก์ `https://<user>.github.io/<repo>/` เปิดบนมือถือใช้กล้อง/ไมค์ได้เลย

---

## 🔧 หมายเหตุ
- ไฟล์เสียงตอนนี้เป็น **placeholder** (โทนบี๊บ) สร้างจาก `assets/generate_placeholder_audio.js` — แทนที่ด้วยเสียงจริงเมื่อพร้อม
- โมเดล 3 มิติยังไม่มี → แสดงกล่องสีแทน (ดู `assets/models/README.md`)
- ปรับความไวไมค์ได้ที่ `VOLUME_THRESHOLD` ใน `app.js`
