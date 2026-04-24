ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS url text;

UPDATE public.articles SET url = CASE
  WHEN source = 'Nature' THEN 'https://www.nature.com/articles/d41586-023-03590-6'
  WHEN source = 'Science' THEN 'https://www.science.org/content/article/mrna-vaccines-cancer'
  WHEN source = 'MIT Tech Review' THEN 'https://www.technologyreview.com/2022/12/13/1064810/nuclear-fusion-net-energy-gain-ignition/'
  WHEN source = 'Nat Geo' THEN 'https://www.nationalgeographic.com/environment/article/coral-restoration'
  WHEN source = 'Bloomberg' THEN 'https://www.bloomberg.com/markets/rates-bonds'
  ELSE 'https://www.google.com/search?q=' || replace(title, ' ', '+')
END WHERE url IS NULL;