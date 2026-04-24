-- =========================================================
-- PROFILES
-- =========================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- =========================================================
-- USER_STATS
-- =========================================================
CREATE TABLE public.user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp BIGINT NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  earnings_today NUMERIC(12,2) NOT NULL DEFAULT 0,
  earnings_week NUMERIC(12,2) NOT NULL DEFAULT 0,
  earnings_all_time NUMERIC(12,2) NOT NULL DEFAULT 0,
  current_multiplier NUMERIC(6,2) NOT NULL DEFAULT 1.0,
  active_streak INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own stats" ON public.user_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own stats" ON public.user_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own stats" ON public.user_stats FOR UPDATE USING (auth.uid() = user_id);

-- =========================================================
-- TIERS (public catalog)
-- =========================================================
CREATE TABLE public.tiers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  multiplier NUMERIC(5,2) NOT NULL,
  color TEXT NOT NULL,
  researchers INTEGER NOT NULL DEFAULT 0,
  avg_earning NUMERIC(8,2) NOT NULL DEFAULT 0,
  locked BOOLEAN NOT NULL DEFAULT false,
  subcategories TEXT[] NOT NULL DEFAULT '{}',
  display_order INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE public.tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tiers public read" ON public.tiers FOR SELECT USING (true);

-- =========================================================
-- ARTICLES (public catalog)
-- =========================================================
CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  tier_id INTEGER NOT NULL REFERENCES public.tiers(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  read_time TEXT,
  earnings NUMERIC(6,2) NOT NULL DEFAULT 0,
  dual_use_warning BOOLEAN NOT NULL DEFAULT false,
  warning_text TEXT,
  is_daily_desk BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Articles public read" ON public.articles FOR SELECT USING (true);

-- =========================================================
-- OFFERS (public catalog)
-- =========================================================
CREATE TABLE public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant TEXT NOT NULL,
  tier_id INTEGER NOT NULL REFERENCES public.tiers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  original_price NUMERIC(10,2) NOT NULL,
  sale_price NUMERIC(10,2) NOT NULL,
  discount INTEGER NOT NULL DEFAULT 0,
  cpa_payout NUMERIC(8,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Offers public read" ON public.offers FOR SELECT USING (true);

-- =========================================================
-- SPONSORS (public catalog)
-- =========================================================
CREATE TABLE public.sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company TEXT NOT NULL,
  tier_id INTEGER NOT NULL REFERENCES public.tiers(id) ON DELETE CASCADE,
  bid_amount NUMERIC(8,2) NOT NULL,
  impressions TEXT,
  ctr TEXT,
  rating NUMERIC(3,1) NOT NULL DEFAULT 0
);
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sponsors public read" ON public.sponsors FOR SELECT USING (true);

-- =========================================================
-- MILESTONES (per-user)
-- =========================================================
CREATE TABLE public.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  tier_id INTEGER REFERENCES public.tiers(id) ON DELETE SET NULL,
  earned NUMERIC(8,2) NOT NULL DEFAULT 0,
  xp_gained INTEGER NOT NULL DEFAULT 0,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own milestones" ON public.milestones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own milestones" ON public.milestones FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own milestones" ON public.milestones FOR DELETE USING (auth.uid() = user_id);

-- =========================================================
-- WEEKLY EARNINGS rollup
-- =========================================================
CREATE TABLE public.weekly_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  UNIQUE (user_id, day)
);
ALTER TABLE public.weekly_earnings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own weekly" ON public.weekly_earnings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own weekly" ON public.weekly_earnings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own weekly" ON public.weekly_earnings FOR UPDATE USING (auth.uid() = user_id);

-- =========================================================
-- updated_at helper
-- =========================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_user_stats_updated BEFORE UPDATE ON public.user_stats
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- Auto-create profile + stats on signup
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_stats (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();