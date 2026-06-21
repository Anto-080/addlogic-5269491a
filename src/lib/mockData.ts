// 16 tiers, top = most important to society. Spectrum colors per spec:
// Purple (1-3) → Green (4-5) → Blue (6-7) → Pink/Peach (8-13) → Orange (14-15) → Red (16-17? merged)
// Per spec: Red bottom (Adult, Betting), Orange (Sports/eSports), Pink→Peach (Clothes→Personal Care),
// Blue shades (Personal Shopping → Tech), Green shades (Finance → Ecology), Violet→Purple (Sci Research → Bio Lifesaving).
// Vintage cookie-box palette: lower saturation, warmer lightness — hue
// families preserved (purple stays purple, etc.) so meaning is intact.
export const TIERS = [
  { id: 1,  name: "Biological Systems & Lifesaving Technologies", icon: "🧬", multiplier: 10.0, color: "hsl(270, 35%, 60%)", researchers: 1240, avgEarning: 48.50, locked: true,  subcategories: ["Genes Functioning", "Peptide Research", "Cancer research", "Vaccines", "Organ regeneration"] },
  { id: 2,  name: "Biochemical Knowledge",                          icon: "🔬", multiplier: 9.2,  color: "hsl(265, 35%, 62%)", researchers: 2180, avgEarning: 42.30, locked: true,  subcategories: ["Enzymology", "Metabolism", "Protein folding"] },
  { id: 3,  name: "Systematically Important Scientific Research",   icon: "🔭", multiplier: 8.5,  color: "hsl(258, 35%, 64%)", researchers: 3420, avgEarning: 36.80, locked: true,  subcategories: ["Fusion energy", "Quantum physics", "Materials science"] },
  { id: 19, name: "Sciences",                              icon: "🧪", multiplier: 8.0,  color: "hsl(295, 30%, 58%)", researchers: 2900, avgEarning: 34.00, locked: false, subcategories: ["Chemistry", "Botany", "Mathematics"] },
  { id: 20, name: "Energy",                                icon: "⚡", multiplier: 7.8,  color: "hsl(48, 55%, 65%)",  researchers: 2750, avgEarning: 33.00, locked: false, subcategories: ["Electromagnetic Induction", "Fuels", "Renewables"] },
  { id: 4,  name: "Ecology & Natural Biomes",              icon: "🌿", multiplier: 7.5,  color: "hsl(150, 30%, 52%)", researchers: 4100, avgEarning: 31.20, locked: false, subcategories: ["Reforestation", "Ocean health", "Biodiversity"] },
  { id: 5,  name: "Financial & Economic Services",         icon: "📊", multiplier: 6.5,  color: "hsl(135, 28%, 55%)", researchers: 4560, avgEarning: 26.40, locked: false, subcategories: ["Macro analysis", "Investing", "Sustainable finance"] },
  { id: 6,  name: "Technological Advancements",            icon: "💻", multiplier: 5.8,  color: "hsl(212, 35%, 50%)", researchers: 5890, avgEarning: 22.80, locked: false, subcategories: ["AI", "Robotics", "Software", "Hardware"] },
  { id: 7,  name: "Art & Culture / Humanism",              icon: "🎨", multiplier: 5.2,  color: "hsl(210, 35%, 55%)", researchers: 6340, avgEarning: 19.40, locked: false, subcategories: ["Painting", "History", "Philosophy", "Architecture"] },
  { id: 18, name: "Tourism & Travel",                      icon: "🎒", multiplier: 3.2,  color: "hsl(205, 40%, 65%)", researchers: 8230, avgEarning: 10.40, locked: false, subcategories: ["Backpacking", "City breaks", "Adventure travel", "Cultural tours"] },
  { id: 8,  name: "Global News",                           icon: "🌍", multiplier: 4.5,  color: "hsl(208, 38%, 58%)", researchers: 8920, avgEarning: 16.20, locked: false, subcategories: ["Geopolitics", "Climate news", "Tech news"] },
  { id: 21, name: "Women's Interests",                     icon: "🌷", multiplier: 4.2,  color: "hsl(330, 35%, 72%)", researchers: 7600, avgEarning: 14.80, locked: false, subcategories: ["Wellness", "Motherhood", "Career", "Lifestyle"] },
  { id: 9,  name: "Entertainment: Movies, Games, Books",   icon: "🎬", multiplier: 4.0,  color: "hsl(206, 40%, 62%)", researchers: 12400, avgEarning: 13.40, locked: false, subcategories: ["Films", "Video games", "Music", "Books"] },
  { id: 10, name: "Food: Recipes, Nutrition, Diets",       icon: "🍽️", multiplier: 3.5,  color: "hsl(204, 40%, 66%)", researchers: 7120, avgEarning: 11.80, locked: false, subcategories: ["Recipes", "Nutrition", "Diet plans"] },
  { id: 11, name: "Real Estate Services",                  icon: "🏠", multiplier: 3.0,  color: "hsl(202, 45%, 72%)", researchers: 3890, avgEarning: 9.80,  locked: false, subcategories: ["Buying", "Renting", "Investment property"] },
  { id: 12, name: "Personal Shopping",                     icon: "🛍️", multiplier: 2.5,  color: "hsl(20, 45%, 72%)",  researchers: 7890, avgEarning: 7.80,  locked: false, subcategories: ["Electronics", "Home goods", "Gifts"] },
  { id: 13, name: "Personal Care: Skin, Perfume, Makeup",  icon: "💄", multiplier: 2.2,  color: "hsl(25, 50%, 74%)",  researchers: 5670, avgEarning: 6.40,  locked: false, subcategories: ["Skincare", "Fragrance", "Makeup"] },
  { id: 14, name: "Clothes & Accessories",                 icon: "👔", multiplier: 1.8,  color: "hsl(30, 55%, 64%)",  researchers: 6890, avgEarning: 5.20,  locked: false, subcategories: ["Apparel", "Jewelry", "Eyewear"] },
  { id: 15, name: "Sports & eSports",                      icon: "⚽", multiplier: 1.4,  color: "hsl(22, 60%, 58%)",  researchers: 9870, avgEarning: 4.10,  locked: false, subcategories: ["Football", "Basketball", "eSports leagues"] },
  { id: 16, name: "Betting Services",                      icon: "🎲", multiplier: 0.8,  color: "hsl(0, 45%, 50%)",   researchers: 4560, avgEarning: 2.60,  locked: true,  subcategories: ["Sports betting", "Casino"] },
  { id: 17, name: "Adult Entertainment",                   icon: "🔞", multiplier: 0.5,  color: "hsl(0, 50%, 42%)",   researchers: 3210, avgEarning: 1.40,  locked: true,  subcategories: ["Adult content"] },
];

// Mock earnings/articles/sponsor/offer/desk fixtures were removed.
// Real data now comes from Supabase via hooks in `src/hooks/useAppData.ts`.

