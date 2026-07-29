import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles">;
export type Transaction = Tables<"transactions">;
export type Card = Tables<"cards">;
export type Beneficiary = Tables<"beneficiaries">;
export type Notification = Tables<"notifications">;

export const CATEGORY_LABELS: Record<string, string> = {
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  internal_transfer: "Internal Transfer",
  bank_transfer: "Bank Transfer",
  international_transfer: "International Transfer",
  incoming_transfer: "Incoming Transfer",
  card_payment: "Card Payment",
  atm_withdrawal: "ATM Withdrawal",
  interest: "Interest Credit",
  charge: "Charge",
  refund: "Refund",
  transfer: "Transfer",
};

export function money(value: number | string | null | undefined, currency = "USD") {
  return Number(value ?? 0).toLocaleString("en-US", {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: 2,
  });
}

export function maskCard(number: string) {
  return number.replace(/(.{4})/g, "$1 ").trim();
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export function internationalFee(amount: number) {
  return Math.round((25 + amount * 0.015) * 100) / 100;
}

export function localFee(amount: number) {
  return amount > 0 ? 2.5 : 0;
}

async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<(Profile & { authEmail: string }) | null> => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (!data) return null;
      return { ...data, authEmail: data.email ?? user.email ?? "" };
    },
  });
}

export function useTransactions() {
  return useQuery({
    queryKey: ["transactions"],
    queryFn: async (): Promise<Transaction[]> => {
      const uid = await currentUserId();
      if (!uid) return [];
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });
}

export function useCards() {
  return useQuery({
    queryKey: ["cards"],
    queryFn: async (): Promise<Card[]> => {
      const uid = await currentUserId();
      if (!uid) return [];
      const { data } = await supabase
        .from("cards")
        .select("*")
        .eq("user_id", uid)
        .order("created_at");
      return data ?? [];
    },
  });
}

export function useBeneficiaries() {
  return useQuery({
    queryKey: ["beneficiaries"],
    queryFn: async (): Promise<Beneficiary[]> => {
      const uid = await currentUserId();
      if (!uid) return [];
      const { data } = await supabase
        .from("beneficiaries")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async (): Promise<Notification[]> => {
      const uid = await currentUserId();
      if (!uid) return [];
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });
}

export function useIsAdmin() {
  return useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const uid = await currentUserId();
      if (!uid) return false;
      const { data } = await supabase.rpc("has_role", { _user_id: uid, _role: "admin" });
      return Boolean(data);
    },
  });
}

/** Keeps balances, transactions, cards and notifications live. */
export function useRealtimeBanking() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    (async () => {
      const uid = await currentUserId();
      if (!uid || cancelled) return;

      const invalidate = (keys: string[]) => {
        keys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
      };

      channel = supabase
        .channel(`banking-${uid}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "profiles", filter: `id=eq.${uid}` },
          () => invalidate(["profile", "admin-profiles"]),
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "transactions", filter: `user_id=eq.${uid}` },
          () => invalidate(["transactions", "profile", "admin-transactions"]),
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "cards", filter: `user_id=eq.${uid}` },
          () => invalidate(["cards"]),
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${uid}` },
          () => invalidate(["notifications"]),
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

/** Admin-wide realtime: any profile or transaction change refreshes the panel. */
export function useRealtimeAdmin(enabled: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    const channel = supabase
      .channel("admin-banking")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () =>
        queryClient.invalidateQueries({ queryKey: ["admin-profiles"] }),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () =>
        queryClient.invalidateQueries({ queryKey: ["admin-transactions"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, queryClient]);
}
