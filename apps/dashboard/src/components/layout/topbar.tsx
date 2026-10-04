"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLiveNotifications } from "@/hooks/use-live-notifications";

const SEEN_KEY = "tpmr_notifications_seen_count";
const TOAST_DURATION_MS = 7000;

/** Topbar, rendu depuis le layout du dashboard donc monté en continu tant
 * que l'admin reste dans l'espace admin, quelle que soit la page affichée.
 * C'est CE composant qui porte désormais la connexion temps réel (badge +
 * toast), et non plus chaque page individuellement — avant, une
 * notification qui arrivait pendant que l'admin était sur /children ou
 * /drivers n'était vue nulle part. */
export function Topbar({ title }: { title: string }) {
  const router = useRouter();
  const { notifications } = useLiveNotifications();

  // Compteur de notifications déjà vues, persisté pour survivre à un
  // rechargement de page — sinon le badge réapparaîtrait à chaque refresh
  // même pour des notifications déjà consultées.
  const [seenCount, setSeenCount] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<{ id: string; title: string; body: string } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastToastedIdRef = useRef<string | null>(null);

  useEffect(() => {
    const stored = Number(window.localStorage.getItem(SEEN_KEY) ?? "0");
    setSeenCount(Number.isFinite(stored) ? stored : 0);
    setHydrated(true);
  }, []);

  // Nouvelle notification = la plus récente (notifications[0]) n'est pas
  // celle déjà "toastée" -> on affiche un toast, quelle que soit la page.
  useEffect(() => {
    if (!hydrated || notifications.length === 0) return;
    const latest = notifications[0];
    if (latest.id === lastToastedIdRef.current) return;

    lastToastedIdRef.current = latest.id;
    setToast({ id: latest.id, title: latest.title, body: latest.body });

    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);

    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [notifications, hydrated]);

  const unseenCount = Math.max(0, notifications.length - seenCount);

  function markAllSeen() {
    setSeenCount(notifications.length);
    window.localStorage.setItem(SEEN_KEY, String(notifications.length));
  }

  function handleBellClick() {
    markAllSeen();
    router.push("/notifications");
  }

  function dismissToast() {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(null);
  }

  return (
    <header className="relative flex h-16 items-center justify-between border-b border-border bg-surface px-6">
      <h1 className="font-display text-lg font-semibold">{title}</h1>
      <div className="flex items-center gap-4">
        <button onClick={handleBellClick} className="focus-ring relative rounded-full p-2 text-muted hover:bg-border/40">
          <Bell size={18} />
          {unseenCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
              {unseenCount > 9 ? "9+" : unseenCount}
            </span>
          )}
        </button>
        <Link href="/profile" className="focus-ring flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-border/40">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
            A
          </div>
          <span className="text-sm font-medium">Admin</span>
        </Link>
      </div>

      {toast && (
        <div className="absolute right-6 top-[calc(100%+8px)] z-50 w-80 rounded-xl border border-border bg-surface p-4 shadow-lg">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{toast.title}</p>
              <p className="mt-0.5 text-xs text-muted">{toast.body}</p>
            </div>
            <button onClick={dismissToast} className="focus-ring shrink-0 rounded p-0.5 text-muted hover:bg-border/40">
              <X size={14} />
            </button>
          </div>
          <button
            onClick={() => {
              dismissToast();
              markAllSeen();
              router.push("/notifications");
            }}
            className="mt-2 text-xs font-medium text-primary"
          >
            Voir →
          </button>
        </div>
      )}
    </header>
  );
}