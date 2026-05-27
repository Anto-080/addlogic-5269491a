// 16 tiers, top = most important to society. Spectrum colors per spec:
// Purple (1-3) → Green (4-5) → Blue (6-7) → Pink/Peach (8-13) → Orange (14-15) → Red (16-17? merged)
// Per spec: Red bottom (Adult, Betting), Orange (Sports/eSports), Pink→Peach (Clothes→Personal Care),
// Blue shades (Personal Shopping → Tech), Green shades (Finance → Ecology), Violet→Purple (Sci Research → Bio Lifesaving).
export const TIERS = [
  { id: 1,  name: "Biological Systems & Lifesaving Technologies", icon: "🧬", multiplier: 10.0, color: "hsl(270, 70%, 45%)", researchers: 1240, avgEarning: 48.50, locked: true,  subcategories: ["Genes Functioning", "Peptide Research", "Cancer research", "Vaccines", "Organ regeneration"] },
  { id: 2,  name: "Biochemical Knowledge",                          icon: "🔬", multiplier: 9.2,  color: "hsl(265, 65%, 50%)", researchers: 2180, avgEarning: 42.30, locked: true,  subcategories: ["Enzymology", "Metabolism", "Protein folding"] },
  { id: 3,  name: "Systematically Important Scientific Research",   icon: "🔭", multiplier: 8.5,  color: "hsl(258, 60%, 55%)", researchers: 3420, avgEarning: 36.80, locked: true,  subcategories: ["Fusion energy", "Quantum physics", "Materials science"] },
  { id: 19, name: "Sciences",                              icon: "🧪", multiplier: 8.0,  color: "#8B008B", researchers: 2900, avgEarning: 34.00, locked: false, subcategories: ["Chemistry", "Botany", "Mathematics"] },
  { id: 20, name: "Energy",                                icon: "⚡", multiplier: 7.8,  color: "#ffff33", researchers: 2750, avgEarning: 33.00, locked: false, subcategories: ["Electromagnetic Induction", "Fuels", "Renewables"] },
  { id: 4,  name: "Ecology & Natural Biomes",              icon: "🌿", multiplier: 7.5,  color: "hsl(150, 55%, 40%)", researchers: 4100, avgEarning: 31.20, locked: false, subcategories: ["Reforestation", "Ocean health", "Biodiversity"] },
  { id: 5,  name: "Financial & Economic Services",         icon: "📊", multiplier: 6.5,  color: "hsl(135, 50%, 45%)", researchers: 4560, avgEarning: 26.40, locked: false, subcategories: ["Macro analysis", "Investing", "Sustainable finance"] },
  // Blues range: deep blue (Tech) → light blue (Real Estate)
  { id: 6,  name: "Technological Advancements",            icon: "💻", multiplier: 5.8,  color: "#15528F", researchers: 5890, avgEarning: 22.80, locked: false, subcategories: ["AI", "Robotics", "Software", "Hardware"] },
  { id: 7,  name: "Art & Culture / Humanism",              icon: "🎨", multiplier: 5.2,  color: "#1F66A8", researchers: 6340, avgEarning: 19.40, locked: false, subcategories: ["Painting", "History", "Philosophy", "Architecture"] },
  { id: 18, name: "Tourism & Travel",                      icon: "🎒", multiplier: 3.2,  color: "#4FA3D9", researchers: 8230, avgEarning: 10.40, locked: false, subcategories: ["Backpacking", "City breaks", "Adventure travel", "Cultural tours"] },
  { id: 8,  name: "Global News",                           icon: "🌍", multiplier: 4.5,  color: "#2A7BBF", researchers: 8920, avgEarning: 16.20, locked: false, subcategories: ["Geopolitics", "Climate news", "Tech news"] },
  { id: 21, name: "Women's Interests",                     icon: "🌷", multiplier: 4.2,  color: "hsl(330, 65%, 70%)", researchers: 7600, avgEarning: 14.80, locked: false, subcategories: ["Wellness", "Motherhood", "Career", "Lifestyle"] },
  { id: 9,  name: "Entertainment: Movies, Games, Books",   icon: "🎬", multiplier: 4.0,  color: "#3F8FCC", researchers: 12400, avgEarning: 13.40, locked: false, subcategories: ["Films", "Video games", "Music", "Books"] },
  { id: 10, name: "Food: Recipes, Nutrition, Diets",       icon: "🍽️", multiplier: 3.5,  color: "#5BA3D9", researchers: 7120, avgEarning: 11.80, locked: false, subcategories: ["Recipes", "Nutrition", "Diet plans"] },
  { id: 11, name: "Real Estate Services",                  icon: "🏠", multiplier: 3.0,  color: "#7DB9E8", researchers: 3890, avgEarning: 9.80,  locked: false, subcategories: ["Buying", "Renting", "Investment property"] },
  { id: 12, name: "Personal Shopping",                     icon: "🛍️", multiplier: 2.5,  color: "hsl(20, 75%, 75%)",  researchers: 7890, avgEarning: 7.80,  locked: false, subcategories: ["Electronics", "Home goods", "Gifts"] },
  { id: 13, name: "Personal Care: Skin, Perfume, Makeup",  icon: "💄", multiplier: 2.2,  color: "hsl(25, 80%, 78%)",  researchers: 5670, avgEarning: 6.40,  locked: false, subcategories: ["Skincare", "Fragrance", "Makeup"] },
  { id: 14, name: "Clothes & Accessories",                 icon: "👔", multiplier: 1.8,  color: "hsl(30, 90%, 65%)",  researchers: 6890, avgEarning: 5.20,  locked: false, subcategories: ["Apparel", "Jewelry", "Eyewear"] },
  { id: 15, name: "Sports & eSports",                      icon: "⚽", multiplier: 1.4,  color: "hsl(22, 95%, 55%)",  researchers: 9870, avgEarning: 4.10,  locked: false, subcategories: ["Football", "Basketball", "eSports leagues"] },
  { id: 16, name: "Betting Services",                      icon: "🎲", multiplier: 0.8,  color: "hsl(0, 75%, 45%)",   researchers: 4560, avgEarning: 2.60,  locked: true,  subcategories: ["Sports betting", "Casino"] },
  { id: 17, name: "Adult Entertainment",                   icon: "🔞", multiplier: 0.5,  color: "hsl(0, 80%, 35%)",   researchers: 3210, avgEarning: 1.40,  locked: true,  subcategories: ["Adult content"] },
];

// Mock earnings/articles/sponsor/offer/desk fixtures were removed.
// Real data now comes from Supabase via hooks in `src/hooks/useAppData.ts`.

