// EcoLink Industrial Park — Refined Duotone Architectural SVG Icon Set
// Every path stays strictly inside the 3..21 safe-zone of viewBox="0 0 24 24" (zero clipping)

const wrap = (body, cls = 'ico') =>
  `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const ICONS = {
  // Brand Mark (Card 05: Eco Factory + Leaf)
  brand: wrap(`
    <path d="M4 19h16" />
    <path d="M5 19v-6.5l4.5 2.5v-2.5L14 15v4H5Z" fill="currentColor" fill-opacity="0.16" />
    <path d="M14 19v-9h4.5v9" fill="currentColor" fill-opacity="0.16" />
    <path d="M16 10c0-2.8 1.8-4.5 4-4.5 0 2.3-1.5 4.2-4 4.5Z" fill="currentColor" fill-opacity="0.28" />
  `, 'ico ico-brand'),

  // HUD Telemetry & Controls
  money: wrap(`
    <circle cx="12" cy="12" r="8.2" fill="currentColor" fill-opacity="0.12" />
    <path d="M9.8 8.5h3.2a1.75 1.75 0 0 1 0 3.5H9.8v-3.5Z" />
    <path d="M9.8 12h3.6a1.75 1.75 0 0 1 0 3.5H9.8V12Z" />
    <path d="M11.6 7v10" />
  `),
  timer: wrap(`
    <circle cx="12" cy="12.8" r="7.2" fill="currentColor" fill-opacity="0.14" />
    <path d="M12 9.4v3.4l2.3 1.5" />
    <path d="M9.5 3.6h5" />
    <path d="M12 3.6v2" />
  `),
  cycle: wrap(`
    <path d="M19.2 10.2A7.5 7.5 0 0 0 6.5 6.8L4.8 8.5" />
    <path d="M4.8 4.8v3.7h3.7" />
    <path d="M4.8 13.8a7.5 7.5 0 0 0 12.7 3.4l1.7-1.7" />
    <path d="M19.2 19.2v-3.7h-3.7" />
  `),
  score: wrap(`
    <path d="M12 4.2l2.3 4.7 5.2.75-3.75 3.65.9 5.2L12 16.05 7.35 18.5l.9-5.2L4.5 9.65l5.2-.75L12 4.2Z" fill="currentColor" fill-opacity="0.18" />
  `),
  pause: wrap(`
    <rect x="6.5" y="5" width="3.8" height="14" rx="1.2" fill="currentColor" fill-opacity="0.3" />
    <rect x="13.7" y="5" width="3.8" height="14" rx="1.2" fill="currentColor" fill-opacity="0.3" />
  `),
  play: wrap(`
    <path d="M7.5 5.4l11.2 6.6-11.2 6.6V5.4Z" fill="currentColor" fill-opacity="0.28" />
  `),
  fast: wrap(`
    <path d="M4.5 6.2l6.8 5.8-6.8 5.8V6.2Z" fill="currentColor" fill-opacity="0.25" />
    <path d="M12.5 6.2l6.8 5.8-6.8 5.8V6.2Z" fill="currentColor" fill-opacity="0.25" />
  `),
  center: wrap(`
    <circle cx="12" cy="12" r="3.2" fill="currentColor" fill-opacity="0.18" />
    <path d="M12 4v2.6M12 17.4V20M4 12h2.6M17.4 12H20" />
  `),
  book: wrap(`
    <path d="M5 6.2A2.2 2.2 0 0 1 7.2 4H19v14.8H7.2A2.2 2.2 0 0 0 5 20.5V6.2Z" fill="currentColor" fill-opacity="0.12" />
    <path d="M5 18.2A2.2 2.2 0 0 1 7.2 16H19" />
    <path d="M9.5 8.2h5.5M9.5 11.4h4" />
  `),
  chart: wrap(`
    <path d="M4.5 19.2h15" />
    <rect x="6.2" y="12.2" width="2.8" height="7" rx="0.8" fill="currentColor" fill-opacity="0.22" />
    <rect x="10.6" y="8.8" width="2.8" height="10.4" rx="0.8" fill="currentColor" fill-opacity="0.22" />
    <rect x="15" y="5.4" width="2.8" height="13.8" rx="0.8" fill="currentColor" fill-opacity="0.22" />
  `),
  close: wrap(`<path d="M17.5 6.5 6.5 17.5M6.5 6.5l11 11" />`),
  check: wrap(`<path d="M19 7.2 9.8 16.4 5.5 12.1" />`),
  soundOn: wrap(`
    <path d="M11 6.2 6.8 9.5H4.2v5h2.6L11 17.8V6.2Z" fill="currentColor" fill-opacity="0.2" />
    <path d="M14.8 9.2a4.2 4.2 0 0 1 0 5.6" />
    <path d="M17.6 6.8a7.5 7.5 0 0 1 0 10.4" />
  `),
  soundOff: wrap(`
    <path d="M11 6.2 6.8 9.5H4.2v5h2.6L11 17.8V6.2Z" fill="currentColor" fill-opacity="0.15" />
    <path d="m19.5 9.5-5 5M14.5 9.5l5 5" />
  `),

  // Bottom Dock Tools (Strictly inside 3..21 safe-zone!)
  inspect: wrap(`
    <circle cx="10.8" cy="10.8" r="6" fill="currentColor" fill-opacity="0.15" />
    <path d="m19.2 19.2-3.9-3.9" />
    <path d="M10.8 8.3v5M8.3 10.8h5" />
  `),
  connect: wrap(`
    <circle cx="6.2" cy="12" r="2.6" fill="currentColor" fill-opacity="0.24" />
    <circle cx="17.8" cy="12" r="2.6" fill="currentColor" fill-opacity="0.24" />
    <path d="M8.8 12h6.4" />
    <path d="M12.6 9.4 15.2 12l-2.6 2.6" />
  `),
  pipe: wrap(`
    <path d="M4.5 8.5h5.8a2.5 2.5 0 0 1 2.5 2.5v7.5h-3.6v-6.4H4.5V8.5Z" fill="currentColor" fill-opacity="0.22" />
    <path d="M4.5 7.2v6.2M8 18.5h6" />
    <path d="M17.2 6.2s2.6 3.1 2.6 4.8a2.6 2.6 0 1 1-5.2 0c0-1.7 2.6-4.8 2.6-4.8Z" fill="currentColor" fill-opacity="0.28" />
  `),
  road: wrap(`
    <rect x="4" y="13.2" width="16" height="5" rx="2.5" fill="currentColor" fill-opacity="0.2" />
    <circle cx="7.2" cy="15.7" r="0.9" fill="currentColor" />
    <circle cx="12" cy="15.7" r="0.9" fill="currentColor" />
    <circle cx="16.8" cy="15.7" r="0.9" fill="currentColor" />
    <rect x="7.8" y="6.2" width="8.4" height="7" rx="1.4" fill="currentColor" fill-opacity="0.28" />
    <path d="M12 6.2v3" />
  `),
  demolish: wrap(`
    <path d="M4.8 7.5h14.4" />
    <path d="M9.2 7.5V5.5a1 1 0 0 1 1-1h3.6a1 1 0 0 1 1 1v2" />
    <path d="M6.8 7.5l.9 11a1.5 1.5 0 0 0 1.5 1.4h5.6a1.5 1.5 0 0 0 1.5-1.4l.9-11H6.8Z" fill="currentColor" fill-opacity="0.16" />
    <path d="M10.4 11.2v4.8M13.6 11.2v4.8" />
  `),

  // Factory Architectural Emblems (Rich Duotone Silhouettes)
  water_intake: wrap(`
    <path d="M4 17.5c1.8-1.2 3.6-1.2 5.4 0s3.6 1.2 5.2 0 3.6-1.2 5.4 0" />
    <rect x="6" y="7.5" width="12" height="6.8" rx="1.5" fill="currentColor" fill-opacity="0.2" />
    <path d="M9.5 7.5V5h5v2.5M9.5 11h5" />
  `),
  sugar: wrap(`
    <path d="M4 19.2h16" />
    <path d="M5.2 19.2v-7.5l4.2-2.7 4.2 2.7v7.5H5.2Z" fill="currentColor" fill-opacity="0.2" />
    <rect x="13.6" y="7.4" width="5.2" height="11.8" rx="2.4" fill="currentColor" fill-opacity="0.28" />
    <path d="M7.2 9.8V5.6h2.2v2.8" />
    <path d="M13.6 11.8h5.2M13.6 15.2h5.2" />
  `),
  food: wrap(`
    <path d="M4.5 16.8h15" />
    <path d="M6 16.8a6 6 0 0 1 12 0H6Z" fill="currentColor" fill-opacity="0.24" />
    <path d="M10.5 10.8a1.5 1.5 0 0 1 3 0" />
    <path d="M9.2 6.8c0-1 .8-1.4.8-2.2M14.2 6.8c0-1 .8-1.4.8-2.2" />
    <path d="M6.2 19.2h11.6" />
  `),
  paper: wrap(`
    <path d="M12 4.4 5 8.2v7.6l7 3.8 7-3.8V8.2L12 4.4Z" fill="currentColor" fill-opacity="0.18" />
    <path d="M5 8.2 12 12l7-3.8" />
    <path d="M12 12v7.6" />
    <path d="M8.5 6.3 15.5 10.1" />
  `),
  fertilizer: wrap(`
    <path d="M6.5 19.2h11" />
    <path d="M8.2 19.2v-5.4a3.8 3.8 0 0 1 7.6 0v5.4H8.2Z" fill="currentColor" fill-opacity="0.18" />
    <path d="M12 10.2c0-3.4 2.2-5.4 5.2-5.6 0 3.2-1.8 5.2-5.2 5.6Z" fill="currentColor" fill-opacity="0.32" />
    <path d="M12 10.2c0-2.6-1.8-4.2-4.4-4.5 0 2.5 1.5 4.2 4.4 4.5Z" fill="currentColor" fill-opacity="0.22" />
  `),
  treatment: wrap(`
    <circle cx="12" cy="12.5" r="7.2" fill="currentColor" fill-opacity="0.16" />
    <path d="M7.5 13.5c1.5-1.2 3-1.2 4.5 0s3 1.2 4.5 0" />
    <path d="M12 5.3v7.2l4.2-2.2" />
    <circle cx="12" cy="12.5" r="1.4" fill="currentColor" />
  `),
  starFull: `<svg class="ico ico-star filled" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.8.85-4.2 4.1 1 5.8L12 16.8l-5.2 2.75 1-5.8-4.2-4.1 5.8-.85L12 3.5Z"/></svg>`,
  starEmpty: `<svg class="ico ico-star empty" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.8.85-4.2 4.1 1 5.8L12 16.8l-5.2 2.75 1-5.8-4.2-4.1 5.8-.85L12 3.5Z"/></svg>`,

  // Resources (Crisp Duotone)
  raw_water: wrap(`
    <path d="M12 4.5S6.8 10.5 6.8 14.3a5.2 5.2 0 1 0 10.4 0C17.2 10.5 12 4.5 12 4.5Z" fill="currentColor" fill-opacity="0.22" />
  `),
  hot_water: wrap(`
    <path d="M12.2 4.2c2.4 2.8 4.6 5.2 4.6 8.8a4.8 4.8 0 1 1-9.6 0c0-1.9.9-3.6 1.9-5 0 1.3.9 2.2 1.8 2.2 0-2.2.8-4.1 1.3-6Z" fill="currentColor" fill-opacity="0.24" />
  `),
  wastewater: wrap(`
    <path d="M12 4.5S6.8 10.5 6.8 14.3a5.2 5.2 0 1 0 10.4 0C17.2 10.5 12 4.5 12 4.5Z" fill="currentColor" fill-opacity="0.2" />
    <path d="M9.2 14.8c.9.9 1.9.9 2.8 0s1.9-.9 2.8 0" />
  `),
  bagasse: wrap(`
    <path d="M12 19.2V4.8" />
    <path d="M12 14.8c-2.6 0-4.4-1.7-4.4-3.9 2.2 0 4 1.3 4.4 3.9Z" fill="currentColor" fill-opacity="0.26" />
    <path d="M12 11.2c2.6 0 4.4-1.7 4.4-3.9-2.2 0-4 1.3-4.4 3.9Z" fill="currentColor" fill-opacity="0.26" />
  `),
  organic_waste: wrap(`
    <path d="M6 18.5C6 10.8 11.2 5.5 18.5 5.5c0 7.4-4.8 13-12.5 13Z" fill="currentColor" fill-opacity="0.24" />
    <path d="M6 18.5 14.2 10.3" />
  `),
};

export const RESOURCE_ICON = {
  raw_water: ICONS.raw_water,
  hot_water: ICONS.hot_water,
  wastewater: ICONS.wastewater,
  bagasse: ICONS.bagasse,
  organic_waste: ICONS.organic_waste,
};

export const PRODUCT_ICON = {
  sugar: ICONS.sugar,
  food: ICONS.food,
  box: ICONS.paper,
  fertilizer: ICONS.fertilizer,
  reclaimed_water: ICONS.raw_water,
};

export const BUILDING_ICON = {
  water_intake: ICONS.water_intake,
  sugar: ICONS.sugar,
  food: ICONS.food,
  paper: ICONS.paper,
  fertilizer: ICONS.fertilizer,
  treatment: ICONS.treatment,
};
