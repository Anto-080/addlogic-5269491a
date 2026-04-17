// 16 tiers, top = most important to society. Spectrum colors per spec:
// Purple (1-3) → Green (4-5) → Blue (6-7) → Pink/Peach (8-13) → Orange (14-15) → Red (16-17? merged)
// Per spec: Red bottom (Adult, Betting), Orange (Sports/eSports), Pink→Peach (Clothes→Personal Care),
// Blue shades (Personal Shopping → Tech), Green shades (Finance → Ecology), Violet→Purple (Sci Research → Bio Lifesaving).
export const TIERS = [
  { id: 1,  name: "Biological Systems & Life-saving Tech", icon: "🧬", multiplier: 10.0, color: "hsl(270, 70%, 45%)", researchers: 1240, avgEarning: 48.50, locked: true,  subcategories: ["Gene therapy", "Cancer research", "Vaccines", "Organ regeneration"] },
  { id: 2,  name: "Biochemical Knowledge",                 icon: "🔬", multiplier: 9.2,  color: "hsl(265, 65%, 50%)", researchers: 2180, avgEarning: 42.30, locked: true,  subcategories: ["Enzymology", "Metabolism", "Protein folding"] },
  { id: 3,  name: "Systematically Important Sci Research", icon: "🔭", multiplier: 8.5,  color: "hsl(258, 60%, 55%)", researchers: 3420, avgEarning: 36.80, locked: true,  subcategories: ["Fusion energy", "Quantum physics", "Materials science"] },
  { id: 4,  name: "Ecology & Natural Biomes",              icon: "🌿", multiplier: 7.5,  color: "hsl(150, 55%, 40%)", researchers: 4100, avgEarning: 31.20, locked: false, subcategories: ["Reforestation", "Ocean health", "Biodiversity"] },
  { id: 5,  name: "Financial & Economic Services",         icon: "📊", multiplier: 6.5,  color: "hsl(135, 50%, 45%)", researchers: 4560, avgEarning: 26.40, locked: false, subcategories: ["Macro analysis", "Investing", "Sustainable finance"] },
  { id: 6,  name: "Technological Advancements",            icon: "💻", multiplier: 5.8,  color: "hsl(210, 75%, 55%)", researchers: 5890, avgEarning: 22.80, locked: false, subcategories: ["AI", "Robotics", "Software", "Hardware"] },
  { id: 7,  name: "Art & Culture / Humanistic",            icon: "🎨", multiplier: 5.2,  color: "hsl(220, 65%, 60%)", researchers: 6340, avgEarning: 19.40, locked: false, subcategories: ["Painting", "History", "Philosophy", "Architecture"] },
  { id: 8,  name: "Global News",                           icon: "🌍", multiplier: 4.5,  color: "hsl(335, 55%, 65%)", researchers: 8920, avgEarning: 16.20, locked: false, subcategories: ["Geopolitics", "Climate news", "Tech news"] },
  { id: 9,  name: "Entertainment: Movies, Games, Books",   icon: "🎬", multiplier: 4.0,  color: "hsl(340, 60%, 70%)", researchers: 12400, avgEarning: 13.40, locked: false, subcategories: ["Films", "Video games", "Music", "Books"] },
  { id: 10, name: "Food: Recipes, Nutrition, Diets",       icon: "🍽️", multiplier: 3.5,  color: "hsl(345, 65%, 72%)", researchers: 7120, avgEarning: 11.80, locked: false, subcategories: ["Recipes", "Nutrition", "Diet plans"] },
  { id: 11, name: "Real Estate Services",                  icon: "🏠", multiplier: 3.0,  color: "hsl(15, 70%, 75%)",  researchers: 3890, avgEarning: 9.80,  locked: false, subcategories: ["Buying", "Renting", "Investment property"] },
  { id: 12, name: "Personal Shopping",                     icon: "🛍️", multiplier: 2.5,  color: "hsl(20, 75%, 75%)",  researchers: 7890, avgEarning: 7.80,  locked: false, subcategories: ["Electronics", "Home goods", "Gifts"] },
  { id: 13, name: "Personal Care: Skin, Perfume, Makeup",  icon: "💄", multiplier: 2.2,  color: "hsl(25, 80%, 78%)",  researchers: 5670, avgEarning: 6.40,  locked: false, subcategories: ["Skincare", "Fragrance", "Makeup"] },
  { id: 14, name: "Clothes & Accessories",                 icon: "👔", multiplier: 1.8,  color: "hsl(30, 90%, 65%)",  researchers: 6890, avgEarning: 5.20,  locked: false, subcategories: ["Apparel", "Jewelry", "Eyewear"] },
  { id: 15, name: "Sports & eSports",                      icon: "⚽", multiplier: 1.4,  color: "hsl(22, 95%, 55%)",  researchers: 9870, avgEarning: 4.10,  locked: false, subcategories: ["Football", "Basketball", "eSports leagues"] },
  { id: 16, name: "Betting Services",                      icon: "🎲", multiplier: 0.8,  color: "hsl(0, 75%, 45%)",   researchers: 4560, avgEarning: 2.60,  locked: true,  subcategories: ["Sports betting", "Casino"] },
  { id: 17, name: "Adult Entertainment",                   icon: "🔞", multiplier: 0.5,  color: "hsl(0, 80%, 35%)",   researchers: 3210, avgEarning: 1.40,  locked: true,  subcategories: ["Adult content"] },
];

export const MOCK_EARNINGS = {
  today: 12.45,
  thisWeek: 67.80,
  allTime: 1284.50,
  level: 23,
  xp: 7420,
  xpToNext: 10000,
  currentMultiplier: 5.8,
  activeStreak: 12,
};

export const MOCK_MILESTONES = [
  { id: 1, title: "First Biochem deep-dive", tier: 2, earned: 8.40, date: "2026-04-12", xpGained: 320 },
  { id: 2, title: "Quantum Computing session", tier: 6, earned: 6.20, date: "2026-04-11", xpGained: 240 },
  { id: 3, title: "Climate Science research", tier: 3, earned: 7.80, date: "2026-04-10", xpGained: 290 },
  { id: 4, title: "Gene Therapy exploration", tier: 1, earned: 12.50, date: "2026-04-09", xpGained: 480 },
  { id: 5, title: "Macroeconomics analysis", tier: 5, earned: 5.10, date: "2026-04-08", xpGained: 180 },
];

export const MOCK_ARTICLES = [
  { id: 1, title: "CRISPR Gene Editing Breakthrough: Treating Sickle Cell Disease", tier: 1, source: "Nature", readTime: "8 min", earnings: 1.20, dualUseWarning: true },
  { id: 2, title: "New mRNA Vaccine Platform Shows Promise Against Multiple Cancers", tier: 2, source: "Science", readTime: "12 min", earnings: 0.95 },
  { id: 3, title: "Fusion Energy Milestone: Net Positive Energy Achieved", tier: 3, source: "MIT Tech Review", readTime: "6 min", earnings: 0.78 },
  { id: 4, title: "Coral Reef Restoration Hits Record Recovery Pace", tier: 4, source: "Nat Geo", readTime: "5 min", earnings: 0.70 },
  { id: 5, title: "Global Interest Rate Decisions Impact Analysis", tier: 5, source: "Bloomberg", readTime: "5 min", earnings: 0.52 },
  { id: 6, title: "Quantum Supremacy in Practical Applications", tier: 6, source: "Wired", readTime: "10 min", earnings: 0.45 },
  { id: 7, title: "Renaissance Art Restoration Using AI Technology", tier: 7, source: "Artnet", readTime: "7 min", earnings: 0.38 },
  { id: 8, title: "Mediterranean Diet: New Longevity Studies", tier: 10, source: "Healthline", readTime: "5 min", earnings: 0.28 },
];

export const MOCK_WEEKLY_EARNINGS = [
  { day: "Mon", amount: 8.20 },
  { day: "Tue", amount: 12.40 },
  { day: "Wed", amount: 9.80 },
  { day: "Thu", amount: 15.60 },
  { day: "Fri", amount: 11.30 },
  { day: "Sat", amount: 6.50 },
  { day: "Sun", amount: 4.00 },
];

export const MOCK_SPONSOR_BIDS = [
  { company: "BioGenesis Labs", tier: 1, bidAmount: 2.40, impressions: "12.5K", ctr: "4.2%", rating: 4.5 },
  { company: "NeuroTech Inc", tier: 2, bidAmount: 2.10, impressions: "18.2K", ctr: "3.8%", rating: 4.2 },
  { company: "QuantumCore", tier: 6, bidAmount: 1.60, impressions: "32.1K", ctr: "3.1%", rating: 3.9 },
  { company: "GreenFin Capital", tier: 5, bidAmount: 1.30, impressions: "28.4K", ctr: "2.7%", rating: 3.7 },
  { company: "StreamVision", tier: 9, bidAmount: 0.80, impressions: "89.3K", ctr: "2.1%", rating: 3.4 },
  { company: "BetKing Pro", tier: 16, bidAmount: 0.55, impressions: "45.6K", ctr: "5.8%", rating: 2.8 },
];

// Daily articles desk for Dashboard with dual-use warnings
export const DAILY_DESK = [
  { id: 1, title: "Lab-grown organs reach human trial stage", tier: 1, source: "Lancet", warning: false },
  { id: 2, title: "CRISPR-Cas9 off-target effects: new safety review", tier: 2, source: "Nature", warning: true, warningText: "Dual-use technology — read accredited risk analysis before applying concepts." },
  { id: 3, title: "EU climate package: 2030 targets locked", tier: 4, source: "Reuters", warning: false },
  { id: 4, title: "Molecular chirality switching: speculative review", tier: 2, source: "Cell", warning: true, warningText: "Dual-use research of concern — see WHO guidance on biosecurity." },
];
