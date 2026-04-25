import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useAdmin";

export type AdminFlags = {
  force_opera_search: boolean;
  force_investment_l50: boolean;
  force_circular_l100: boolean;
};

const DEFAULTS: AdminFlags = {
  force_opera_search: false,
  force_investment_l50: false,
  force_circular_l100: false,
};

export function useAdminFlags() {
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  return useQuery({
    queryKey: ["admin_feature_flags", user?.id],
    enabled: !!user && !!isAdmin,
    queryFn: async (): Promise<AdminFlags> => {
      if (!user) return DEFAULTS;
      const { data, error } = await supabase
        .from("admin_feature_flags")
        .select("force_opera_search, force_investment_l50, force_circular_l100")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) return DEFAULTS;
      return data ?? DEFAULTS;
    },
    staleTime: 30_000,
  });
}

export function useUpdateAdminFlags() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<AdminFlags>) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("admin_feature_flags")
        .upsert({ user_id: user.id, ...patch }, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_feature_flags", user?.id] }),
  });
}
