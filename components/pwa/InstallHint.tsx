"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const DISMISS_KEY = "aeroaca.installhint.dismissed";

type Env = "ssr" | "standalone" | "dismissed" | "ios" | "browser";

function readEnv(): Env {
  try {
    if (localStorage.getItem(DISMISS_KEY)) return "dismissed";
  } catch {
    /* ignore */
  }
  const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (standalone) return "standalone";
  const ua = navigator.userAgent;
  const isIos = /iPhone|iPad|iPod/.test(ua) && !/CriOS|FxiOS/.test(ua);
  return isIos ? "ios" : "browser";
}

const noopSubscribe = () => () => {};

/**
 * Shows an install hint only when the browser signals installability
 * (Chromium beforeinstallprompt) or on iOS Safari where no prompt exists.
 * Never claims the app is installed.
 */
export function InstallHint() {
  const env = useSyncExternalStore(noopSubscribe, readEnv, () => "ssr" as Env);
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (dismissed || env === "ssr" || env === "standalone" || env === "dismissed") return null;
  if (env === "browser" && !prompt) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  return (
    <Card className="flex items-start gap-3 p-4">
      <span className="mt-0.5 text-accent">
        <Icon name="download" size={20} />
      </span>
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold">Add AeroAca to your home screen</p>
        {env === "ios" ? (
          <p className="mt-1 text-ink-2">In Safari, tap Share, then “Add to Home Screen”. Lessons you have opened keep working offline.</p>
        ) : (
          <p className="mt-1 text-ink-2">Opens full-screen like an app and keeps opened lessons available offline.</p>
        )}
        <div className="mt-3 flex gap-2">
          {prompt && (
            <Button
              size="sm"
              onClick={async () => {
                await prompt.prompt();
                const choice = await prompt.userChoice;
                if (choice.outcome === "accepted") setDismissed(true);
              }}
            >
              Install
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={dismiss}>
            Not now
          </Button>
        </div>
      </div>
    </Card>
  );
}
