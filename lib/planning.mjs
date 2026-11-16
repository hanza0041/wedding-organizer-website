export const topics = [
  { id: 'vision', name: 'ภาพงานของเรา', icon: 'sparkles', color: 'purple', prompt: 'อยากให้งานของเรารู้สึกแบบไหน? เลือก 3 สิ่งที่สำคัญที่สุดสำหรับเราทั้งคู่', description: 'สไตล์งาน สี และสิ่งที่เราให้ความสำคัญ' },
  { id: 'budget', name: 'งบประมาณ', icon: 'wallet', color: 'green', prompt: 'งบที่เราสบายใจคือเท่าไร? ใครช่วยส่วนไหน และอยากกันเงินเผื่อเท่าไร?', description: 'ตั้งงบ แบ่งค่าใช้จ่าย และเงินสำรอง' },
  { id: 'venue', name: 'สถานที่ & อาหาร', icon: 'building', color: 'orange', prompt: 'ชอบงานในสวนหรือในห้อง? จำนวนแขกและงบต่อหัวของเราเท่าไร?', description: 'สถานที่ เมนูอาหาร และการเดินทาง' },
  { id: 'guests', name: 'แขก & การ์ดเชิญ', icon: 'users', color: 'pink', prompt: 'แต่ละครอบครัวจะเชิญใครบ้าง? มีแขกที่ต้องดูแลเรื่องอาหารหรือการเดินทางเป็นพิเศษไหม?', description: 'รายชื่อแขก การ์ด และผังที่นั่ง' },
  { id: 'ceremony', name: 'พิธีการ & ครอบครัว', icon: 'heart', color: 'pink', prompt: 'ครอบครัวเราอยากมีพิธีอะไรบ้าง? จะจัดช่วงเช้า เย็น หรือวันเดียวกัน?', description: 'พิธีไทย ฤกษ์ และความต้องการของผู้ใหญ่' },
  { id: 'outfits', name: 'ชุด & ความงาม', icon: 'flower', color: 'purple', prompt: 'ชุดแบบไหนที่ใส่แล้วเป็นตัวเรา? นัดลองชุดและช่างแต่งหน้าวันไหนดี?', description: 'ชุด แหวน ช่างหน้า และช่างผม' },
  { id: 'vendors', name: 'ทีมงาน & บรรยากาศ', icon: 'camera', color: 'orange', prompt: 'ภาพถ่าย ดนตรี ดอกไม้ อะไรสำคัญกับเราที่สุด? มีทีมไหนที่อยากคุยด้วย?', description: 'ช่างภาพ วิดีโอ ดอกไม้ และดนตรี' },
  { id: 'day', name: 'วันสำคัญของเรา', icon: 'calendar', color: 'green', prompt: 'ใครจะช่วยประสานงานวันจริง? ลองเดินกำหนดการตั้งแต่ตื่นจนจบงานด้วยกัน', description: 'รันคิว ผู้ประสานงาน และแผนสำรอง' }
];

// Original summaries adapted from the references in docs/research.md.
const templates = [
  ['vision', 'คุยภาพงานและ 3 สิ่งที่สำคัญกับเราทั้งคู่', 300, 'both'],
  ['budget', 'ตกลงงบรวมและเงินสำรองร่วมกัน', 300, 'both'],
  ['guests', 'ร่างจำนวนแขกของทั้งสองครอบครัว', 280, 'both'],
  ['ceremony', 'คุยกับครอบครัวเรื่องวันและรูปแบบพิธี', 270, 'both'],
  ['venue', 'เปรียบเทียบสถานที่และขอใบเสนอราคา', 250, 'both'],
  ['venue', 'ยืนยันวัน สถานที่ และเงื่อนไขมัดจำ', 240, 'both'],
  ['vendors', 'จองช่างภาพและวิดีโอที่ชอบ', 210, 'both'],
  ['outfits', 'เลือกและจองชุดแต่งงาน', 180, 'bride'],
  ['outfits', 'เลือกชุดสูทและนัดลองขนาด', 150, 'groom'],
  ['vendors', 'คุยธีมดอกไม้ แสง และของตกแต่ง', 150, 'both'],
  ['vendors', 'จองพิธีกรและทีมดนตรี', 120, 'both'],
  ['outfits', 'จองช่างแต่งหน้าและทำผม', 120, 'bride'],
  ['ceremony', 'ตกลงพิธีที่ต้องการและผู้ดูแลแต่ละช่วง', 100, 'both'],
  ['outfits', 'เลือกแหวนและตรวจขนาด', 90, 'both'],
  ['guests', 'ยืนยันรายชื่อและส่งการ์ดเชิญ', 75, 'both'],
  ['venue', 'ชิมอาหารและแจ้งข้อจำกัดด้านอาหาร', 60, 'both'],
  ['ceremony', 'เช็กของใช้สำหรับพิธีที่ครอบครัวเลือก', 45, 'both'],
  ['venue', 'จัดการที่พักและการเดินทางของแขก', 45, 'groom'],
  ['day', 'ร่างรันคิวและกำหนดผู้ประสานงาน', 30, 'both'],
  ['guests', 'ติดตามคำตอบรับและจัดผังที่นั่ง', 21, 'both'],
  ['outfits', 'ลองชุดครั้งสุดท้ายและรับชุด', 14, 'both'],
  ['vendors', 'ยืนยันเวลาและรายละเอียดกับทุกทีม', 14, 'both'],
  ['day', 'เตรียมแผนฝนตกและชุดของใช้ฉุกเฉิน', 10, 'both'],
  ['budget', 'ตรวจยอดคงเหลือและกำหนดจ่ายเงิน', 7, 'both'],
  ['day', 'ส่งรันคิวและเบอร์ติดต่อให้ทีมงาน', 7, 'both'],
  ['day', 'ซ้อมลำดับพิธีและตรวจของที่จะนำไป', 2, 'both'],
  ['day', 'พักผ่อนและฝากงานประสานให้คนที่ไว้ใจ', 1, 'both'],
  ['day', 'ขอบคุณครอบครัว แขก และทีมงาน', -3, 'both']
];

export function seedTasks(weddingDate, today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })) {
  return templates.map(([topic, title, days, owner]) => {
    const date = new Date(`${weddingDate}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() - days);
    // Short preparation windows start today; no artificially overdue starter tasks.
    const day = [today, date.toISOString().slice(0, 10)].sort()[1];
    return { topic, title, owner, due: `${day}T${day === today ? '23:59' : '10:00'}`, done: false, notes: '' };
  });
}

export const sources = [
  { title: 'The Knot · Wedding planning checklist', url: 'https://www.theknot.com/content/12-month-wedding-planning-countdown', detail: 'ลำดับเตรียมงาน ตั้งแต่งบ แขก และสถานที่ ไปจนถึงวันจริง' },
  { title: 'Brides · Wedding planning', url: 'https://www.brides.com/story/brides-wedding-checklist-custom-wedding-to-do-list', detail: 'ภาพรวมการวางแผนและการทำงานร่วมกับทีมจัดงาน' },
  { title: 'Birevet · ลำดับพิธีแต่งงานไทย', url: 'https://birevet.com/th/blog/khantorn-phithi-taeng-ngan-thai', detail: 'แนวทางพูดคุยเรื่องพิธีไทยและสิ่งที่แต่ละครอบครัวเลือกจัด' }
];
