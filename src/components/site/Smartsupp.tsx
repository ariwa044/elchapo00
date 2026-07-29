import { useEffect } from "react";

const SMARTSUPP_KEY = "b24e315b34d580f98867dcd1b53f79aa52354cd6";

declare global {
  interface Window {
    _smartsupp?: Record<string, unknown>;
    smartsupp?: unknown;
  }
}

export function Smartsupp() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.getElementById("smartsupp-loader")) return;

    window._smartsupp = window._smartsupp || {};
    (window._smartsupp as Record<string, unknown>).key = SMARTSUPP_KEY;

    if (!window.smartsupp) {
      const o: any = function (...args: unknown[]) {
        o._.push(args);
      };
      o._ = [];
      window.smartsupp = o;
      (window as any).smartsupp = o;
    }

    const script = document.createElement("script");
    script.id = "smartsupp-loader";
    script.type = "text/javascript";
    script.charset = "utf-8";
    script.async = true;
    script.src = "https://www.smartsuppchat.com/loader.js?";
    document.head.appendChild(script);
  }, []);

  return null;
}
