// EcoLink Industrial Park — Game Data & Balancing Constants

export const GRID_COLS = 16;
export const GRID_ROWS = 10;
export const TILE_SIZE = 72;
export const RIVER_COLS = 2; // Cols 0..1 are river

export const SESSION_DURATION_SEC = 600; // 10 minutes evaluation session
export const STARTING_MONEY = 2800;
export const PIPE_COST_PER_TILE = 12;
export const ROAD_COST_PER_TILE = 10;

export const EXTERNAL_WATER_COST = 15; // per unit of raw water pulled from river
export const WASTE_DISPOSAL_FEE = {
  wastewater: 25,
  hot_water: 10,
  bagasse: 12,
  organic_waste: 15,
};

export const RESOURCES = {
  raw_water: {
    id: 'raw_water',
    name: 'น้ำดิบ',
    en: 'Raw Water',
    category: 'water',
    color: '#38bdf8',
    icon: '💧',
  },
  hot_water: {
    id: 'hot_water',
    name: 'น้ำร้อน',
    en: 'Hot Water',
    category: 'water',
    color: '#fb923c',
    icon: '🔥',
  },
  wastewater: {
    id: 'wastewater',
    name: 'น้ำเสีย',
    en: 'Wastewater',
    category: 'water',
    color: '#a855f7',
    icon: '🟣',
  },
  bagasse: {
    id: 'bagasse',
    name: 'ชานอ้อย',
    en: 'Bagasse',
    category: 'solid',
    color: '#eab308',
    icon: '🌾',
  },
  organic_waste: {
    id: 'organic_waste',
    name: 'กากอินทรีย์',
    en: 'Organic Waste',
    category: 'solid',
    color: '#4ade80',
    icon: '🍃',
  },
};

export const PRODUCTS = {
  sugar: {
    id: 'sugar',
    name: 'น้ำตาลทราย',
    icon: '🧊',
    basePrice: { C: 55, B: 85, A: 110 },
  },
  food: {
    id: 'food',
    name: 'อาหารแปรรูป',
    icon: '🥫',
    basePrice: { C: 65, B: 95, A: 125 },
  },
  box: {
    id: 'box',
    name: 'กล่องบรรจุภัณฑ์',
    icon: '📦',
    basePrice: { C: 65, B: 95, A: 155 },
  },
  fertilizer: {
    id: 'fertilizer',
    name: 'ปุ๋ยชีวภาพ',
    icon: '🌱',
    basePrice: { C: 65, B: 110, A: 160 },
  },
  reclaimed_water: {
    id: 'reclaimed_water',
    name: 'น้ำรีไซเคิลอุตสาหกรรม',
    icon: '💧',
    basePrice: { C: 40, B: 55, A: 65 },
  },
};

export const GRADE_RANK = { C: 1, B: 2, A: 3 };

export const GRADE_INFO = {
  A: { label: 'A พรีเมียม', color: '#22c55e', bg: 'rgba(34,197,94,0.18)' },
  B: { label: 'B มาตรฐาน', color: '#38bdf8', bg: 'rgba(56,189,248,0.18)' },
  C: { label: 'C พื้นฐาน', color: '#f59e0b', bg: 'rgba(245,158,11,0.18)' },
};

export const BUILDINGS = {
  water_intake: {
    id: 'water_intake',
    name: 'สถานีสูบน้ำดิบ',
    shortName: 'สถานีสูบน้ำดิบ',
    icon: '🌊',
    color: '#0284c7',
    accent: '#38bdf8',
    cost: 0,
    size: 2,
    buildable: false,
    demolishable: false,
    description: 'สูบน้ำดิบจากแม่น้ำเข้าสู่ระบบ (ค่าใช้จ่าย ฿15/หน่วย) ใช้ตั้งต้นวงจรหรือเสริมปริมาณน้ำเมื่อน้ำหมุนเวียนไม่เพียงพอ',
    acceptsWater: [],
    outputsWater: ['raw_water'],
    acceptsSolid: [],
    outputsSolid: [],
    mainProduct: null,
  },
  sugar: {
    id: 'sugar',
    name: 'โรงงานน้ำตาล',
    shortName: 'โรงงานน้ำตาล',
    icon: '🏭',
    color: '#d97706',
    accent: '#fbbf24',
    cost: 300,
    size: 2,
    buildable: true,
    demolishable: true,
    description: 'ใช้น้ำดิบ 2 หน่วยหล่อเย็นกระบวนการต้มเคี่ยว (8 วิ) ผลิตน้ำตาลทราย พร้อมผลพลอยได้เป็นน้ำร้อน 2 หน่วยและชานอ้อย 2 หน่วย',
    acceptsWater: ['raw_water'],
    outputsWater: ['hot_water'],
    acceptsSolid: [],
    outputsSolid: ['bagasse'],
    mainProduct: 'sugar',
    externalCost: 20,
    externalLabel: 'อ้อย (฿20/รอบ)',
    modes: [
      { id: 'standard', label: 'การผลิตมาตรฐาน (น้ำดิบ 2 หน่วย)', desc: 'ใช้เวลา 8 วิ • เกรด B • ได้น้ำร้อน 2 + ชานอ้อย 2' },
    ],
  },
  food: {
    id: 'food',
    name: 'โรงงานแปรรูปอาหาร',
    shortName: 'โรงงานอาหาร',
    icon: '🥫',
    color: '#e11d48',
    accent: '#fb7185',
    cost: 350,
    size: 2,
    buildable: true,
    demolishable: true,
    description: 'ใช้น้ำร้อนจากโรงงานน้ำตาลช่วยลดเวลาลวกและฆ่าเชื้อ (8 วิ แทน 12 วิ) พร้อมส่งต่อน้ำเสีย 1 หน่วยและกากอินทรีย์ 1 หน่วย',
    acceptsWater: ['hot_water', 'raw_water'],
    outputsWater: ['wastewater'],
    acceptsSolid: [],
    outputsSolid: ['organic_waste'],
    mainProduct: 'food',
    externalCost: 25,
    externalLabel: 'วัตถุดิบอาหาร (฿25/รอบ)',
    modes: [
      { id: 'prefer_hot', label: 'ใช้น้ำร้อนก่อน (แนะนำ)', desc: 'น้ำร้อน 8 วิ / น้ำดิบ 12 วิ • เกรด B' },
      { id: 'hot_only', label: 'รอน้ำร้อนเท่านั้น', desc: 'ใช้เวลา 8 วิ • เกรด B • ลดการพึ่งพาน้ำดิบภายนอก' },
    ],
  },
  paper: {
    id: 'paper',
    name: 'โรงงานกระดาษและกล่อง',
    shortName: 'โรงงานกระดาษ',
    icon: '📦',
    color: '#2563eb',
    accent: '#60a5fa',
    cost: 350,
    size: 2,
    buildable: true,
    demolishable: true,
    description: 'เลือกใช้ชานอ้อยเพื่อลดต้นทุนและเวลา (เกรด B) หรือใช้เยื่อไม้ใหม่เพื่อคุณภาพระดับพรีเมียม (เกรด A, ฿45) โดยน้ำร้อนช่วยเร่งเวลาผลิตได้',
    acceptsWater: ['hot_water', 'raw_water'],
    outputsWater: ['wastewater'],
    acceptsSolid: ['bagasse'],
    outputsSolid: [],
    mainProduct: 'box',
    externalCost: 45,
    externalLabel: 'เยื่อไม้ใหม่ (฿45/รอบ)',
    modes: [
      { id: 'bagasse_first', label: 'ใช้ชานอ้อยเป็นหลัก (ลดต้นทุน)', desc: 'ชานอ้อย: เกรด B (8–11 วิ) • ใช้เยื่อไม้ใหม่เมื่อชานอ้อยหมด' },
      { id: 'bagasse_only', label: 'ใช้ชานอ้อยเท่านั้น (หมุนเวียนเต็มระบบ)', desc: 'รอชานอ้อย • เกรด B (8–11 วิ) • ไม่มีค่าเยื่อไม้' },
      { id: 'virgin_pulp', label: 'ใช้เยื่อไม้ใหม่ (เน้นคุณภาพเกรด A)', desc: 'ค่าเยื่อไม้ ฿45 • เกรด A พรีเมียม (10–14 วิ)' },
    ],
  },
  fertilizer: {
    id: 'fertilizer',
    name: 'โรงงานปุ๋ยชีวภาพ',
    shortName: 'โรงงานปุ๋ยชีวภาพ',
    icon: '🌱',
    color: '#16a34a',
    accent: '#4ade80',
    cost: 400,
    size: 2,
    buildable: true,
    demolishable: true,
    description: 'หมักน้ำเสีย 1 หน่วยร่วมกับกากอินทรีย์และชานอ้อยรวม 2 หน่วย เพื่อผลิตปุ๋ยคุณภาพสูง (เกรด A/B) และคืนน้ำดิบสะอาด 1 หน่วยกลับสู่ระบบ',
    acceptsWater: ['wastewater', 'raw_water'],
    outputsWater: ['raw_water'],
    acceptsSolid: ['organic_waste', 'bagasse'],
    outputsSolid: [],
    mainProduct: 'fertilizer',
    externalCost: 35,
    externalLabel: 'วัตถุดิบพื้นฐาน (฿35/รอบ)',
    modes: [
      { id: 'circular', label: 'กระบวนการหมุนเวียน (บำบัดน้ำคืนระบบ)', desc: 'น้ำเสีย 1 + กากอินทรีย์/ชานอ้อย 2 (7–9 วิ, เกรด A/B) → คืนน้ำดิบ 1' },
      { id: 'fresh_rush', label: 'ผลิตเร่งด่วน (ใช้วัตถุดิบภายนอก)', desc: 'น้ำดิบ 2 + วัตถุดิบพื้นฐาน ฿35 • 8 วิ • เกรด C • ไม่คืนน้ำดิบ' },
    ],
  },
  treatment: {
    id: 'treatment',
    name: 'โรงงานบำบัดน้ำ',
    shortName: 'โรงงานบำบัดน้ำ',
    icon: '💧',
    color: '#0284c7',
    accent: '#38bdf8',
    cost: 320,
    size: 2,
    buildable: true,
    demolishable: true,
    description: 'รับน้ำเสียส่วนเกิน 1 หน่วยจากโรงงานต่าง ๆ มาตกตะกอนและกรองอย่างรวดเร็ว (6 วิ) เพื่อคืนน้ำดิบสะอาด 1 หน่วยกลับสู่วงจรนิคมได้ทันที',
    acceptsWater: ['wastewater'],
    outputsWater: ['raw_water'],
    acceptsSolid: [],
    outputsSolid: [],
    mainProduct: 'reclaimed_water',
    externalCost: 10,
    externalLabel: 'สารกรองและบำบัด (฿10/รอบ)',
    modes: [
      { id: 'standard', label: 'บำบัดน้ำเสียความเร็วสูง (6 วิ)', desc: 'น้ำเสีย 1 หน่วย → คืนน้ำดิบสะอาด 1 หน่วย + น้ำรีไซเคิลเกรด A' },
    ],
  },
};

export const ORDER_TEMPLATES = [
  { product: 'sugar', minGrade: 'B', qty: 3, reward: 340, score: 120, duration: 110, tag: 'ทั่วไป' },
  { product: 'food', minGrade: 'B', qty: 3, reward: 390, score: 140, duration: 100, tag: 'ทั่วไป' },
  { product: 'box', minGrade: 'B', qty: 4, reward: 460, score: 170, duration: 95, tag: 'เร่งด่วน (ชานอ้อย+น้ำร้อน)' },
  { product: 'box', minGrade: 'A', qty: 2, reward: 420, score: 200, duration: 120, tag: 'พรีเมียม (เยื่อไม้ใหม่)' },
  { product: 'fertilizer', minGrade: 'A', qty: 2, reward: 480, score: 230, duration: 130, tag: 'พรีเมียม (กากอินทรีย์+น้ำเสีย)' },
  { product: 'fertilizer', minGrade: 'B', qty: 3, reward: 440, score: 180, duration: 135, tag: 'มาตรฐาน' },
  { product: 'food', minGrade: 'B', qty: 4, reward: 520, score: 190, duration: 90, tag: 'เร่งด่วน (น้ำร้อน)' },
  { product: 'box', minGrade: 'A', qty: 3, reward: 600, score: 260, duration: 140, tag: 'พรีเมียม' },
];
