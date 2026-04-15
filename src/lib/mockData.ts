export const TIERS = [
  { id: 1, name: "Biological Systems & Life-saving Tech", icon: "🧬", multiplier: 14.0, color: "hsl(348, 83%, 47%)", researchers: 1240, avgEarning: 48.50 },
  { id: 2, name: "Biochemical Knowledge", icon: "🔬", multiplier: 12.5, color: "hsl(340, 70%, 50%)", researchers: 2180, avgEarning: 42.30 },
  { id: 3, name: "Scientific Research", icon: "🔭", multiplier: 11.0, color: "hsl(280, 60%, 55%)", researchers: 3420, avgEarning: 36.80 },
  { id: 4, name: "Technological Advancements", icon: "💻", multiplier: 9.5, color: "hsl(200, 70%, 50%)", researchers: 5890, avgEarning: 31.20 },
  { id: 5, name: "Financial & Economic Services", icon: "📊", multiplier: 8.0, color: "hsl(170, 60%, 45%)", researchers: 4560, avgEarning: 26.40 },
  { id: 6, name: "Global News", icon: "🌍", multiplier: 6.5, color: "hsl(150, 50%, 45%)", researchers: 8920, avgEarning: 21.60 },
  { id: 7, name: "Art & Culture", icon: "🎨", multiplier: 5.5, color: "hsl(38, 92%, 50%)", researchers: 6340, avgEarning: 18.20 },
  { id: 8, name: "Food & Nutrition", icon: "🍽️", multiplier: 4.5, color: "hsl(30, 80%, 50%)", researchers: 7120, avgEarning: 14.80 },
  { id: 9, name: "Entertainment", icon: "🎬", multiplier: 3.5, color: "hsl(45, 70%, 50%)", researchers: 12400, avgEarning: 11.40 },
  { id: 10, name: "Real Estate Services", icon: "🏠", multiplier: 3.0, color: "hsl(20, 60%, 45%)", researchers: 3890, avgEarning: 9.80 },
  { id: 11, name: "Clothing & Accessories", icon: "👔", multiplier: 2.5, color: "hsl(320, 50%, 50%)", researchers: 5670, avgEarning: 7.60 },
  { id: 12, name: "Sports", icon: "⚽", multiplier: 2.0, color: "hsl(140, 60%, 40%)", researchers: 9870, avgEarning: 5.80 },
  { id: 13, name: "Betting Services", icon: "🎲", multiplier: 1.5, color: "hsl(0, 50%, 40%)", researchers: 4560, avgEarning: 4.20 },
  { id: 14, name: "Adult Entertainment", icon: "🔞", multiplier: 1.0, color: "hsl(0, 40%, 35%)", researchers: 3210, avgEarning: 3.10 },
];

export const MOCK_EARNINGS = {
  today: 12.45,
  thisWeek: 67.80,
  allTime: 1284.50,
  level: 23,
  xp: 7420,
  xpToNext: 10000,
  currentMultiplier: 9.5,
  activeStreak: 12,
};

export const MOCK_MILESTONES = [
  { id: 1, title: "First Biochem deep-dive", tier: 2, earned: 8.40, date: "2026-04-12", xpGained: 320 },
  { id: 2, title: "Quantum Computing session", tier: 4, earned: 6.20, date: "2026-04-11", xpGained: 240 },
  { id: 3, title: "Climate Science research", tier: 3, earned: 7.80, date: "2026-04-10", xpGained: 290 },
  { id: 4, title: "Gene Therapy exploration", tier: 1, earned: 12.50, date: "2026-04-09", xpGained: 480 },
  { id: 5, title: "Macroeconomics analysis", tier: 5, earned: 5.10, date: "2026-04-08", xpGained: 180 },
];

export const MOCK_ARTICLES = [
  { id: 1, title: "CRISPR Gene Editing Breakthrough: Treating Sickle Cell Disease", tier: 1, source: "Nature", readTime: "8 min", earnings: 1.20 },
  { id: 2, title: "New mRNA Vaccine Platform Shows Promise Against Multiple Cancers", tier: 2, source: "Science", readTime: "12 min", earnings: 0.95 },
  { id: 3, title: "Fusion Energy Milestone: Net Positive Energy Achieved", tier: 3, source: "MIT Tech Review", readTime: "6 min", earnings: 0.78 },
  { id: 4, title: "Quantum Supremacy in Practical Applications", tier: 4, source: "Wired", readTime: "10 min", earnings: 0.65 },
  { id: 5, title: "Global Interest Rate Decisions Impact Analysis", tier: 5, source: "Bloomberg", readTime: "5 min", earnings: 0.52 },
  { id: 6, title: "Climate Summit 2026: Key Agreements Reached", tier: 6, source: "Reuters", readTime: "4 min", earnings: 0.42 },
  { id: 7, title: "Renaissance Art Restoration Using AI Technology", tier: 7, source: "Artnet", readTime: "7 min", earnings: 0.35 },
  { id: 8, title: "Mediterranean Diet: New Longevity Studies", tier: 8, source: "Healthline", readTime: "5 min", earnings: 0.28 },
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
  { company: "QuantumCore", tier: 4, bidAmount: 1.60, impressions: "32.1K", ctr: "3.1%", rating: 3.9 },
  { company: "GreenFin Capital", tier: 5, bidAmount: 1.30, impressions: "28.4K", ctr: "2.7%", rating: 3.7 },
  { company: "StreamVision", tier: 9, bidAmount: 0.80, impressions: "89.3K", ctr: "2.1%", rating: 3.4 },
  { company: "BetKing Pro", tier: 13, bidAmount: 0.55, impressions: "45.6K", ctr: "5.8%", rating: 2.8 },
];
