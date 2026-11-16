# wedding-organizer-website

**ever after. ♡**

เว็บภาษาไทยสำหรับคู่บ่าวสาววางแผนงานแต่งร่วมกัน คุยแยกเรื่อง มีข้อสรุป เช็กลิสต์ และตารางนัดหมาย ดีไซน์สีลาเวนเดอร์ รองรับมือถือ

## รันได้ทันที

ใช้ **Node.js 24 ขึ้นไป** (ใช้ SQLite ในตัว ไม่ต้องติดตั้ง npm dependencies)

```sh
make server
```

เปิด **http://localhost:3001** → “เริ่มพื้นที่ของเรา” → กรอกชื่อ วันแต่งงาน และเลือกบทบาท → ส่งลิงก์เชิญให้คู่ของคุณ

ไม่มี make ก็รันได้:

```sh
node server.mjs
```

Windows ติดตั้ง make / cloudflared ได้ด้วย:

```powershell
winget install ezwinports.make
winget install Cloudflare.cloudflared
```

ใช้ `npm.cmd` แทน `npm` หาก PowerShell บล็อก npm.ps1 หรือใช้คำสั่ง Node / Make โดยตรง

## สิ่งที่ทำได้

- พื้นที่ร่วมแยกตามคู่ ใช้ลิงก์เชิญเป็นกุญแจ เลือกเจ้าบ่าวหรือเจ้าสาวได้
- ห้องคุย 8 เรื่อง พร้อมคำถามตั้งต้นและข้อสรุปร่วมกัน; Enter ส่งข้อความ, Shift+Enter ขึ้นบรรทัดใหม่
- อีกเครื่องจะได้รับข้อมูลใหม่ภายในประมาณ 3 วินาทีเมื่อหน้าเว็บเปิดอยู่ ไม่ต้องใช้ localStorage เป็นฐานข้อมูลร่วม
- เช็กลิสต์ตั้งต้น 28 รายการอิงวันแต่งงาน เพิ่ม/แก้/ลบ/ทำเครื่องหมายเสร็จ กำหนดผู้รับผิดชอบ หมวด วัน เวลา และบันทึกได้
- กรองงานตามสถานะ คนดูแล หมวด และค้นหา
- ปฏิทินรายเดือน ตารางนัดหมาย และดาวน์โหลด `.ics` สำหรับนำเข้าแอปปฏิทิน (เวลาไทย)
- เปลี่ยนวันแต่งงานและเลือกเลื่อนเฉพาะงานที่ยังไม่เสร็จได้
- ตั้งงบรวมและสถานที่; ส่งออกข้อมูล JSON ได้จากหน้าตั้งค่า
- หน้าการเงินเก็บค่าใช้จ่ายแยกหมวด ผู้ให้บริการ กำหนดจ่าย ยอดรวม/จ่ายแล้ว/คงค้าง บันทึกมัดจำและการจ่ายหลายงวด พร้อมคนจ่าย วันที่ และหมายเหตุ
- บันทึกเงินสมทบที่รับแล้วจากทั้งคู่/ครอบครัว ดูยอดเงินที่เตรียมไว้และคงเหลือ มีประวัติการแก้ไข และส่งออก CSV สรุปค่าใช้จ่าย
- หน้า “คู่มือเตรียมงาน” มีแหล่งข้อมูลที่ค้นก่อนพัฒนา ดู [docs/research.md](docs/research.md)
- หน้าแรกก่อนสร้างพื้นที่ระบุชัดว่าเป็นตัวอย่าง ไม่มีข้อมูลส่วนตัวหรือบทสนทนาจำลอง

## เปิดให้คู่ของคุณใช้ผ่าน Cloudflare

### แบบเร็ว — URL ชั่วคราว

ปิด server เดิมก่อน แล้วรัน:

```sh
make share
```

คำสั่งเดียวเปิด Node server และ Quick Tunnel รอ URL `https://….trycloudflare.com` ในเทอร์มินัล เปิด URL นี้แล้วสร้างพื้นที่หรือเปิดลิงก์เชิญที่เปลี่ยน origin เป็น URL ใหม่นี้ กด Ctrl+C เพื่อหยุดทั้งคู่

**Quick Tunnel สุ่ม URL ใหม่ทุกครั้ง ไม่สามารถจอง URL เดิมหรือใกล้เคียงเดิมได้** ถ้าต้องการ URL เดิม ให้ใช้วิธีถัดไป

### URL เดิมทุกครั้ง — แนะนำ remotely-managed Named Tunnel

ต้องมีบัญชี Cloudflare และโดเมนที่อยู่บน Cloudflare

1. คัดลอก `.env.example` เป็น `.env`
2. ใน Cloudflare One dashboard สร้าง Cloudflare Tunnel แบบ `cloudflared`
3. ตั้ง published application hostname เช่น `wedding.yourdomain.com` ให้ service เป็น `http://localhost:3001` (หรือ PORT ที่เลือก)
4. คัดลอก **เฉพาะ token** ของ Tunnel มาใส่ใน `.env`:

```dotenv
PORT=3001
CLOUDFLARE_TUNNEL_TOKEN=your-tunnel-token
```

5. รัน:

```sh
make tunnel
```

ต่อไปใช้คำสั่งนี้ทุกครั้งจะได้ hostname เดิม ข้อมูลยังอยู่ในฐานข้อมูลเดิม Token ส่งให้ cloudflared ผ่าน environment ไม่แสดงใน arguments และอย่า commit `.env`

### อีกทาง — locally-managed Named Tunnel

ตั้ง `TUNNEL_NAME=our-wedding` ใน `.env` แล้วรันทีละคำสั่ง:

```sh
make tunnel-login
make tunnel-create
```

คำสั่งแรกเปิดหน้า Cloudflare ให้ลงชื่อเข้าใช้และเลือกโดเมน คำสั่งที่สองแสดง UUID และที่อยู่ไฟล์ credentials จากนั้นใส่ใน `.env`:

```dotenv
TUNNEL_NAME=our-wedding
TUNNEL_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
TUNNEL_HOSTNAME=wedding.yourdomain.com
# ใช้ path ที่ cloudflared แสดง; Windows ใช้ / แทน backslash ได้
TUNNEL_CREDENTIALS=C:/Users/YourName/.cloudflared/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.json
CF_CONFIG=./.cloudflared/config.yml
```

```sh
make tunnel-config
make tunnel-dns
make tunnel
```

`tunnel-config` สร้างไฟล์ใน `.cloudflared/` และไม่เขียนทับ config ที่มีอยู่ `tunnel-dns` สร้าง DNS route ไปยัง Tunnel เดิม ถ้าเปลี่ยน PORT ให้แก้ service ใน config ด้วย

หากมี `CLOUDFLARE_TUNNEL_TOKEN` ระบบใช้ token ก่อน local config ส่วน Quick Tunnel อาจรันไม่ได้หากมี default `~/.cloudflared/config.yml`; ดู [ข้อจำกัดจาก Cloudflare](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/) ก่อนเปลี่ยน config เดิม

## คำสั่ง

| คำสั่ง | หน้าที่ |
| --- | --- |
| `make server` / `make run` | รัน server โหลด `.env` |
| `make dev` | รันแบบ watch |
| `make share` / `make quick` / `make up` / `make cloudflare` | Server + URL ชั่วคราว |
| `make tunnel` / `make named` | Server + Tunnel ของ URL เดิม |
| `make test` | ทดสอบ API การแชร์และการเก็บข้อมูล |
| `make backup` | สำรอง SQLite แบบ snapshot ขณะเปิดใช้งานได้ |
| `make docker-up` | Build และรันแอปด้วย Docker Compose |
| `make docker-down` | หยุดและนำ containers ออก โดยคง data volume |
| `make docker-logs` | ดู log ของแอปใน Docker |
| `make docker-backup` | สำรอง DB จาก Docker ลง `backups/` บนเครื่อง |
| `make docker-import` | ย้าย DB local เข้าสู่ Docker volume ว่าง |
| `make docker-tunnel` | แอป + fixed URL tunnel แบบ Docker |
| `make docker-check` | ทดสอบ Docker ด้วย project/volume ชั่วคราวของตนเอง |
| `make help` | ดูคำสั่งทั้งหมด |

ไม่มี make ใช้ `node scripts/run.mjs server`, `quick`, `named`, `configure`, `create`, `dns` หรือ `help` ตามชื่อคำสั่ง

## ข้อมูลและการเข้าถึง

- ฐานข้อมูลอยู่ที่ `data/wedding.sqlite` มี WAL และ SHM ระหว่างทำงาน ใช้ `DB_PATH` เปลี่ยนตำแหน่งได้; โฟลเดอร์นี้ถูก ignore
- สำรองโดย `make backup` ได้ขณะเปิด server ใช้ SQLite backup API รวมข้อมูลที่ยังอยู่ใน WAL และตรวจ integrity ของไฟล์ สำรองอยู่ใน `backups/` หรือหยุด server แล้วคัดลอกโฟลเดอร์ `data/` ทั้งหมด; export JSON ใช้สำหรับอ่านข้อมูล (ยังไม่มี import JSON)
- Browser ใช้ session cookie แบบ HttpOnly; HTTPS ใช้ Secure cookie ลิงก์เชิญใช้ token สุ่มที่คาดเดาไม่ได้ Session ฝั่ง DB เก็บเป็น hash
- **ลิงก์เชิญเป็นสิทธิ์อ่านและแก้ไขทั้งพื้นที่** ทั้งคู่เลือกบทบาทเอง ไม่ได้ยืนยันตัวบุคคลแบบบัญชี/รหัสผ่าน ส่งให้เฉพาะคู่ของคุณ เก็บไว้ใช้กลับเข้าเมื่อเปลี่ยน browser หรือ URL
- ในหน้าชวนสามารถเปลี่ยนลิงก์เชิญได้ แต่คนที่เข้าร่วมไปแล้วจะยังมี session ใช้ได้ ไม่มีระบบยกเลิก session รายคน
- ถ้าใช้ URL ใหม่ใน Quick Tunnel browser จะไม่มี cookie ของ URL เก่า ให้นำส่วน `/#join=…` ของลิงก์เดิมต่อท้าย origin ใหม่ ข้อมูลยังอยู่บน server เดิม
- ค่าเริ่มต้น server ฟังเฉพาะ `127.0.0.1`; Cloudflare ทำ HTTPS และส่งต่อมาที่เครื่อง เครื่องและ tunnel ต้องเปิดอยู่ เว็บไซต์นี้ไม่ได้ย้ายไปทำงานบน Cloudflare Workers
- โค้ดตรวจสิทธิ์แต่ละพื้นที่และจำกัด JSON writes แต่ยังไม่มีบัญชีผู้ใช้ การกู้คืนด้วยอีเมล การแนบไฟล์ หรือระบบแจ้งเตือนขณะปิดเว็บ

## การเงิน

เข้าเมนู **การเงินของเรา** แล้วเพิ่มค่าใช้จ่าย ใส่ยอดรวมของทั้งรายการ กำหนดจ่ายถัดไป หมวด ผู้ให้บริการ และหมายเหตุ จากนั้นกด “บันทึกจ่าย” เพื่อใส่ยอดมัดจำหรือการจ่ายแต่ละครั้ง

- ใช้เงินบาท เก็บยอดใหม่เป็นจำนวนเต็มหน่วยสตางค์ รองรับ 2 ตำแหน่งทศนิยม
- **งบรวม** เป็นเพดานที่ตั้งไว้; **ค่าใช้จ่ายที่วางไว้** คือยอดรวมทุกรายการ; **จ่ายแล้ว** เป็นผลรวมการจ่ายจริง; **คงค้าง** คือยอดรวม − จ่ายแล้ว
- **เงินสมทบ** คือเงินที่รับแล้ว; ยอดเงินคงเหลือคำนวณจากเงินสมทบ − จ่ายแล้ว และอาจติดลบหากยังลงเงินรับไม่ครบ
- การจ่ายแต่ละครั้งมีวันที่ ผู้จ่าย/แหล่งเงิน และหมายเหตุ เลือกเจ้าสาว เจ้าบ่าว กองกลาง ครอบครัว หรืออื่น ๆ ได้
- ระบบกันการบันทึกคำขอเดียวกันซ้ำ กันจ่ายเกินยอด และแจ้งหากอีกคนแก้ค่าใช้จ่ายเดียวกันระหว่างที่เปิดฟอร์มอยู่
- แก้บันทึกจ่ายผิดได้ด้วย “ยกเลิกบันทึก” ประวัติยังเก็บไว้; ลบค่าใช้จ่ายที่ยังมีประวัติจ่ายใช้งานอยู่ไม่ได้
- วันครบกำหนดจ่ายของรายการที่ยังจ่ายไม่ครบแสดงในปฏิทินด้วย
- CSV ส่งออกสรุปค่าใช้จ่าย ส่วน JSON จากหน้าตั้งค่ารวมค่าใช้จ่าย การจ่าย และเงินสมทบด้วย
- ยังไม่มีแนบสลิป การรับเงินคืนจริง ตารางงวดอนาคตหลายงวด หรือเชื่อมธนาคาร ดูรายการที่แนะนำให้ทำต่อใน [requirements review](docs/requirements-review.md)

## รัน local ด้วย Docker Compose

เตรียม Docker Desktop ให้พร้อม แล้วรัน:

```sh
make docker-up
```

เปิด **http://localhost:3001** (หรือ PORT ใน `.env`) แอปใช้ Node 24 และ SQLite ในตัว ไม่มี PostgreSQL service เพิ่ม เนื่องจากเวอร์ชันนี้เป็นแอปสองคนที่รัน server เดียว

**ตำแหน่งข้อมูล:** ภายใน container คือ `/app/data/wedding.sqlite` อยู่ใน Docker named volume `everafter_wedding-data` ไม่ได้อยู่ใน filesystem ชั่วคราวของ container และไม่ได้อยู่ที่ `./data/` ของ host การ restart หรือสร้าง container ใหม่ใช้ volume เดิม

**หากมีข้อมูลจาก `make server` อยู่แล้ว:** สองรูปแบบใช้ฐานคนละตำแหน่ง จึงต้องย้ายก่อนเปิด Docker ครั้งแรก:

1. หยุด Node server เดิม และทำ `make backup` เก็บไว้ก่อน
2. ใช้ `make docker-import` เพื่อคัดลอก `data/wedding.sqlite` ไป volume ว่าง
3. ใช้ `make docker-up` เปิดข้อมูลชุดเดิม

ตัว import ไม่เขียนทับ DB ใน volume ที่มีอยู่แล้ว และไม่ลบฐานเดิมบน host หากใช้ `DB_PATH` ที่ไม่ใช่ค่าเริ่มต้น ให้สำรองฐานนั้นและนำ snapshot มาที่ `data/wedding.sqlite` ก่อน import

### สำรองและกู้คืน

```sh
make docker-backup
```

ไฟล์ `.sqlite` อยู่ที่ `backups/` บนเครื่อง เป็น snapshot ที่กู้คืนได้และมีข้อมูลการเข้าถึงทั้งหมด ควรเก็บสำเนาไว้นอกเครื่องด้วย `backups/` ถูก ignore จากทั้ง Git และ Docker build

กู้คืนโดยใช้ **volume ใหม่** เพื่อเก็บฐานเดิมไว้ เลือกชื่อไฟล์สำรองจริงแทน `YOUR-BACKUP.sqlite`:

```sh
docker compose --profile tunnel stop
docker compose -p everafter-recovered run --rm --no-deps app node scripts/backup.mjs /app/backups/YOUR-BACKUP.sqlite /app/data/wedding.sqlite
docker compose -p everafter-recovered up -d app
```

คำสั่งนี้ใช้ image ที่ build ไว้แล้ว และสร้าง volume `everafter-recovered_wedding-data` หลังจากนี้ต้องใช้ `-p everafter-recovered` ทุกครั้งที่จัดการ instance ที่กู้คืน หากต้องการกู้บน native Node ให้หยุด server แล้วใช้ `node scripts/backup.mjs backups/YOUR-BACKUP.sqlite data/recovered.sqlite` และตั้ง `DB_PATH=./data/recovered.sqlite` ใน `.env`

`make docker-down` คง volume ไว้ ส่วน `docker compose down --volumes` จะลบข้อมูลใน volume จึงไม่ควรใช้กับฐานจริงโดยไม่ได้สำรองก่อน

### Cloudflare ใน Compose

กรอก `CLOUDFLARE_TUNNEL_TOKEN` ใน `.env` แล้วตั้ง service ของ hostname ใน Cloudflare dashboard เป็น **`http://app:3001`** เนื่องจาก tunnel อยู่ใน Docker network เดียวกับแอป จากนั้นใช้:

```sh
make docker-tunnel
```

หากรัน cloudflared บน host แยกจาก Docker ให้ตั้ง service เป็น `http://localhost:3001` ตามเดิม หลีกเลี่ยงเปิด native Node และ Compose บนพอร์ตเดียวกันพร้อมกัน

## ตรวจสอบ

```sh
node --test test/*.test.mjs
```

Tests ใช้ฐานข้อมูลชั่วคราว ไม่แตะข้อมูลจริง ตรวจสอง session คุยหัวข้อเดียวกัน การเช็กงาน การแยกข้อมูลระหว่างคู่ วันที่ผิด การเลื่อนตาราง ข้อมูลข้าม restart และการเปลี่ยนลิงก์เชิญ

ทดสอบหน้าจอและการใช้งานจริงเพิ่มเติมด้วย Chrome/Edge ที่ติดตั้งในเครื่อง:

```sh
make browser-check
```

ใช้สอง browser contexts แยก session ตรวจลิงก์เชิญ แชตสองทาง ข้อสรุป เช็กลิสต์ที่อัปเดตข้ามเครื่อง เพิ่ม/แก้งาน ตัวกรอง ปฏิทิน ตั้งค่า และหน้าจอมือถือ เก็บภาพไว้ที่ `test-artifacts/` (ignore ใน Git) ใช้ฐานข้อมูลชั่วคราวและปิด browser/server หลังทดสอบ กำหนด `CHROME_PATH` หากโปรแกรมอยู่ตำแหน่งอื่น

`make test` ยังตรวจยอดสตางค์ การจ่ายหลายงวด การส่งซ้ำ การแก้พร้อมกัน สิทธิ์ข้อมูลการเงิน การเก็บประวัติหลังยกเลิก และ backup ที่เปิดอ่านได้จริง ส่วน `make browser-check` ตรวจฟอร์มการเงินจริงและการซิงก์ข้ามเซสชันด้วย

`make docker-check` build image แล้วทดสอบแอปใน Compose project ชื่อสุ่มเฉพาะการทดสอบ ตรวจ backup และข้อมูล/session หลังสร้าง container ใหม่ ก่อนลบเฉพาะ project/volume ทดสอบของตัวเอง ไม่แตะ volume ใช้งานจริง

## โครงสร้าง

```text
public/             UI ภาษาไทย ไม่ต้อง build
lib/planning.mjs    หมวด คำถาม รายการตั้งต้น และแหล่งข้อมูล
lib/finance.mjs     ค่าใช้จ่าย การจ่าย เงินสมทบ และประวัติการเงิน
server.mjs          HTTP API + SQLite + session
scripts/run.mjs     รัน server และ cloudflared ข้ามระบบปฏิบัติการ
scripts/backup.mjs  สำรองและย้าย SQLite โดยไม่เขียนทับไฟล์ปลายทาง
compose.yaml        แอป + SQLite volume และ tunnel แบบ optional
test/               Integration tests
docs/research.md    สรุป research และเหตุผลของรายการตั้งต้น
docs/requirements-review.md  ทบทวนฟังก์ชัน ช่องว่าง และลำดับที่ควรทำต่อ
```
