# 3D Models (โมเดล 3 มิติ)

ใส่ไฟล์โมเดลรูปแบบ **`.glb`** (glTF binary) ไว้ในโฟลเดอร์นี้ ตามชื่อที่อ้างใน `config/vocabulary.js`:

| ไฟล์ที่ต้องมี | ใช้กับคำ |
|---|---|
| `cat.glb`  | Cat  |
| `dog.glb`  | Dog  |
| `bird.glb` | Bird |
| `fish.glb` | Fish |

## ถ้ายังไม่มีไฟล์
ไม่เป็นไร — `app.js` จะตรวจก่อน (fetch HEAD) ถ้าไม่พบไฟล์ จะแสดง **กล่องสี** (`fallbackColor`) แทนอัตโนมัติ เกมยังเล่นได้ปกติ

## แหล่งโมเดลฟรี (free, low-poly เหมาะกับมือถือ)
- Google **Poly Pizza** — https://poly.pizza
- **Sketchfab** (กรอง Downloadable + CC License)
- **Quaternius** — https://quaternius.com (ฟรี CC0)

## เคล็ดลับประสิทธิภาพบนมือถือ
- ใช้โมเดล **low-poly** (< ~20k tris) และไฟล์ **< 2–3 MB**
- บีบอัดด้วย **Draco/meshopt** ถ้าทำได้
- โมเดลควรตั้งจุดกำเนิด (origin) ที่ฐาน และหันหน้าไปทาง +Z
