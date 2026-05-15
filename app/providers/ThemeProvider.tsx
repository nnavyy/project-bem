"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

// ─── Light theme CSS ─────────────────────────────────────────────────────────
// Injected as a <style> tag at runtime to avoid Tailwind v4 PostCSS parsing
// issues with escaped class selectors like .bg-\[#020617\].
// Default theme is dark — this only activates when html.light is present.
// ─────────────────────────────────────────────────────────────────────────────
const LIGHT_CSS = `
/* ═══════════════════════════════════════════════════════════════════════════
   BEM ITESA — Comprehensive Light Theme
   Default is dark. When html.light is present every dark-mode utility is
   overridden to a light palette.
   ═══════════════════════════════════════════════════════════════════════════ */

html.light { color-scheme: light; }

/* ─── Body / root ───────────────────────────────────────────────────────── */
html.light body { background-color: #f8fafc !important; color: #0f172a !important; }

/* ─── Page / layout hex backgrounds ─────────────────────────────────────── */
html.light .bg-\\[\\#020617\\]      { background-color: #ffffff !important; }
html.light .bg-\\[\\#020617\\]\\/80  { background-color: rgba(255,255,255,0.92) !important; }
html.light .bg-\\[\\#020617\\]\\/85  { background-color: rgba(255,255,255,0.95) !important; }
html.light .bg-\\[\\#0f172a\\]      { background-color: #f8fafc !important; }
html.light .bg-\\[\\#0b1220\\]      { background-color: #f1f5f9 !important; }
html.light .bg-\\[\\#1f2c44\\]      { background-color: #e2e8f0 !important; }

/* ─── Gradients ─────────────────────────────────────────────────────────── */
html.light .bg-gradient-to-b.from-\\[\\#1f2c44\\].to-\\[\\#0f172a\\] {
  background: linear-gradient(to bottom, #e2e8f0, #f8fafc) !important;
}
html.light .bg-gradient-to-b.from-\\[\\#0f172a\\].to-\\[\\#020617\\] {
  background: linear-gradient(to bottom, #f8fafc, #ffffff) !important;
}
html.light .from-\\[\\#1f2c44\\] { --tw-gradient-from: #e2e8f0 !important; }
html.light .from-\\[\\#0f172a\\] { --tw-gradient-from: #f8fafc !important; }
html.light .from-\\[\\#020617\\] { --tw-gradient-from: #ffffff !important; }
html.light .to-\\[\\#0f172a\\]   { --tw-gradient-to: #f8fafc !important; }
html.light .to-\\[\\#020617\\]   { --tw-gradient-to: #ffffff !important; }

/* ─── Translucent white overlays → subtle dark overlays ─────────────────── */
html.light .bg-white\\/5                   { background-color: rgba(15,23,42,0.03) !important; }
html.light .bg-white\\/10                  { background-color: rgba(15,23,42,0.05) !important; }
html.light .bg-white\\/15                  { background-color: rgba(15,23,42,0.07) !important; }
html.light .bg-white\\/20                  { background-color: rgba(15,23,42,0.09) !important; }
html.light .bg-white\\/\\[0\\.01\\]          { background-color: rgba(15,23,42,0.01) !important; }
html.light .bg-white\\/\\[0\\.015\\]         { background-color: rgba(15,23,42,0.015) !important; }
html.light .bg-white\\/\\[0\\.02\\]          { background-color: rgba(15,23,42,0.02) !important; }
html.light .bg-white\\/\\[0\\.03\\]          { background-color: rgba(15,23,42,0.03) !important; }
html.light .bg-white\\/\\[0\\.04\\]          { background-color: rgba(15,23,42,0.04) !important; }
html.light .bg-white\\/\\[0\\.05\\]          { background-color: rgba(15,23,42,0.04) !important; }
html.light .bg-white\\/\\[0\\.06\\]          { background-color: rgba(15,23,42,0.05) !important; }
html.light .bg-white\\/\\[0\\.07\\]          { background-color: rgba(15,23,42,0.06) !important; }

/* ─── Translucent black (expanded rows, code bg) ── */
html.light .bg-black\\/20 { background-color: rgba(15,23,42,0.04) !important; }
html.light .bg-black\\/40 { background-color: rgba(15,23,42,0.07) !important; }

/* ─── Hover backgrounds ─────────────────────────────────────────────────── */
html.light .hover\\:bg-white\\/5:hover   { background-color: rgba(15,23,42,0.04) !important; }
html.light .hover\\:bg-white\\/10:hover  { background-color: rgba(15,23,42,0.07) !important; }
html.light .hover\\:bg-white\\/15:hover  { background-color: rgba(15,23,42,0.09) !important; }
html.light .hover\\:bg-white\\/20:hover  { background-color: rgba(15,23,42,0.11) !important; }
html.light .hover\\:bg-white\\/\\[0\\.02\\]:hover { background-color: rgba(15,23,42,0.03) !important; }
html.light .hover\\:bg-white\\/\\[0\\.04\\]:hover { background-color: rgba(15,23,42,0.05) !important; }

/* ─── Focus backgrounds ─────────────────────────────────────────────────── */
html.light .focus\\:bg-white\\/\\[0\\.07\\]:focus { background-color: rgba(15,23,42,0.06) !important; }

/* ─── Text: white → slate ───────────────────────────────────────────────── */
html.light .text-white     { color: #0f172a !important; }
html.light .text-white\\/90 { color: rgba(15,23,42,0.90) !important; }
html.light .text-white\\/80 { color: rgba(15,23,42,0.80) !important; }
html.light .text-white\\/70 { color: rgba(15,23,42,0.70) !important; }
html.light .text-white\\/60 { color: rgba(15,23,42,0.60) !important; }
html.light .text-white\\/55 { color: rgba(15,23,42,0.55) !important; }
html.light .text-white\\/50 { color: rgba(15,23,42,0.50) !important; }
html.light .text-white\\/40 { color: rgba(15,23,42,0.40) !important; }
html.light .text-white\\/35 { color: rgba(15,23,42,0.35) !important; }
html.light .text-white\\/30 { color: rgba(15,23,42,0.30) !important; }
html.light .text-white\\/25 { color: rgba(15,23,42,0.25) !important; }
html.light .text-white\\/20 { color: rgba(15,23,42,0.20) !important; }
html.light .text-white\\/15 { color: rgba(15,23,42,0.15) !important; }
html.light .text-white\\/10 { color: rgba(15,23,42,0.10) !important; }
html.light .text-\\[\\#0f172a\\] { color: #0f172a !important; }

/* ─── Hover / group-hover text ──────────────────────────────────────────── */
html.light .hover\\:text-white:hover       { color: #0f172a !important; }
html.light .hover\\:text-white\\/60:hover   { color: rgba(15,23,42,0.60) !important; }
html.light .group:hover .group-hover\\:text-white { color: #0f172a !important; }

/* ─── Placeholder text ──────────────────────────────────────────────────── */
html.light .placeholder\\:text-white\\/25::placeholder  { color: rgba(15,23,42,0.30) !important; }
html.light .placeholder\\:text-white\\/30::placeholder  { color: rgba(15,23,42,0.35) !important; }
html.light .placeholder\\:text-white\\/35::placeholder  { color: rgba(15,23,42,0.40) !important; }
html.light .placeholder\\:text-white\\/40::placeholder  { color: rgba(15,23,42,0.45) !important; }
html.light .placeholder-white\\/25::placeholder         { color: rgba(15,23,42,0.30) !important; }
html.light .placeholder-white\\/30::placeholder         { color: rgba(15,23,42,0.35) !important; }
html.light .placeholder-white\\/35::placeholder         { color: rgba(15,23,42,0.40) !important; }
html.light .placeholder-white\\/40::placeholder         { color: rgba(15,23,42,0.45) !important; }

/* ─── Borders: white → slate ────────────────────────────────────────────── */
html.light .border-white\\/5   { border-color: rgba(15,23,42,0.08) !important; }
html.light .border-white\\/8   { border-color: rgba(15,23,42,0.10) !important; }
html.light .border-white\\/10  { border-color: rgba(15,23,42,0.12) !important; }
html.light .border-white\\/15  { border-color: rgba(15,23,42,0.15) !important; }
html.light .border-white\\/20  { border-color: rgba(15,23,42,0.20) !important; }
html.light .border-white\\/25  { border-color: rgba(15,23,42,0.25) !important; }
html.light .border-white\\/30  { border-color: rgba(15,23,42,0.30) !important; }
html.light .border-white       { border-color: #cbd5e1 !important; }
html.light .border-white\\/\\[0\\.06\\] { border-color: rgba(15,23,42,0.08) !important; }

/* Focus borders */
html.light .focus\\:border-white\\/30:focus  { border-color: rgba(15,23,42,0.30) !important; }
html.light .focus\\:border-white\\/35:focus  { border-color: rgba(15,23,42,0.35) !important; }
html.light .focus\\:border-\\[\\#2f64d8\\]:focus { border-color: #2f64d8 !important; }

/* Hover borders */
html.light .hover\\:border-white\\/10:hover { border-color: rgba(15,23,42,0.12) !important; }
html.light .hover\\:border-white\\/20:hover { border-color: rgba(15,23,42,0.20) !important; }
html.light .hover\\:border-white\\/25:hover { border-color: rgba(15,23,42,0.25) !important; }

/* ─── Sidebar / layout structural borders ───────────────────────────────── */
html.light .border-r { border-right-color: #e2e8f0 !important; }
html.light .border-t { border-top-color:   #e2e8f0 !important; }
html.light .border-b { border-bottom-color: #e2e8f0 !important; }

/* ─── CTA / primary buttons & badge pills ── bg-white → dark bg ─────────── */
html.light button.bg-white,
html.light a.bg-white {
  background-color: #1e293b !important;
  color: #ffffff !important;
}
html.light button.bg-white:hover,
html.light a.bg-white:hover {
  background-color: #334155 !important;
}

/* ─── Form controls (select, input, textarea) with dark hex bg ──────────── */
html.light select,
html.light input,
html.light textarea {
  color-scheme: light;
}
html.light .scheme-dark { color-scheme: light !important; }

/* ─── Ring/outline colours ──────────────────────────────────────────────── */
html.light .ring-white\\/10  { --tw-ring-color: rgba(15,23,42,0.10) !important; }
html.light .ring-white\\/20  { --tw-ring-color: rgba(15,23,42,0.15) !important; }

/* ─── Divide colours ───────────────────────────────────────────────────── */
html.light .divide-white\\/5 > :not([hidden]) ~ :not([hidden])  { border-color: rgba(15,23,42,0.08) !important; }
html.light .divide-white\\/10 > :not([hidden]) ~ :not([hidden]) { border-color: rgba(15,23,42,0.10) !important; }

/* ─── Shadow adjustments ───────────────────────────────────────────────── */
html.light .shadow-xl  { --tw-shadow-color: rgba(15,23,42,0.08) !important; }
html.light .shadow-2xl { --tw-shadow-color: rgba(15,23,42,0.12) !important; }

/* ─── Pre / code (log detail pane) ──────────────────────────────────────── */
html.light pre  {
  background-color: #f1f5f9 !important;
  border-color:     rgba(15,23,42,0.10) !important;
  color:            #334155 !important;
}
html.light code { color: #0369a1 !important; }

/* ─── Accent-colour badges — keep them but slightly increase contrast ──── */
html.light .bg-red-950\\/20    { background-color: rgba(220,38,38,0.08) !important; }
html.light .bg-red-950\\/40    { background-color: rgba(220,38,38,0.12) !important; }

/* ─── animate-pulse skeleton bg ─────────────────────────────────────────── */
html.light .animate-pulse .bg-white\\/5,
html.light .animate-pulse .bg-white\\/10,
html.light .animate-pulse.bg-white\\/5,
html.light .animate-pulse.bg-white\\/10 {
  background-color: rgba(15,23,42,0.06) !important;
}

/* ─── Scrollbar (webkit) ────────────────────────────────────────────────── */
html.light ::-webkit-scrollbar              { width: 6px; height: 6px; }
html.light ::-webkit-scrollbar-track        { background: #f1f5f9; }
html.light ::-webkit-scrollbar-thumb        { background: #cbd5e1; border-radius: 999px; }
html.light ::-webkit-scrollbar-thumb:hover  { background: #94a3b8; }

/* ─── Backdrop blur panels (header etc.) ────────────────────────────────── */
html.light .backdrop-blur { backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
`;

const STYLE_ID = "bem-light-theme";

function injectLightCSS() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = LIGHT_CSS;
  document.head.appendChild(el);
}

function removeLightCSS() {
  if (typeof document === "undefined") return;
  document.getElementById(STYLE_ID)?.remove();
}

// ─── Light Theme Warning Banner ──────────────────────────────────────────────
function LightThemeBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Small delay so it slides in nicely after page load
    const t = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(t);
  }, []);

  if (dismissed) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "1.25rem",
        right: "1.25rem",
        zIndex: 9999,
        maxWidth: "360px",
        width: "calc(100vw - 2.5rem)",
        transform: visible ? "translateY(0)" : "translateY(120%)",
        opacity: visible ? 1 : 0,
        transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1), opacity 0.4s ease",
        backgroundColor: "#fffbeb",
        border: "1px solid #f59e0b",
        borderRadius: "0.875rem",
        padding: "1rem 1rem 1rem 1.125rem",
        boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
        display: "flex",
        gap: "0.75rem",
        alignItems: "flex-start",
      }}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      <div style={{ flexShrink: 0, marginTop: "2px" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 600, fontSize: "0.8125rem", color: "#92400e" }}>
           Tema Terang — Sedang Dalam Tahap Pengembangan
        </p>
        <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", lineHeight: 1.5, color: "#b45309" }}>
          Beberapa bagian tampilan mungkin belum sempurna. Kami sedang memperbaikinya. Gunakan <strong>Tema Gelap</strong> untuk pengalaman terbaik.
        </p>
      </div>

      {/* Dismiss */}
      <button
        onClick={() => setDismissed(true)}
        aria-label="Tutup notifikasi"
        style={{
          flexShrink: 0,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "2px",
          color: "#b45309",
          borderRadius: "4px",
          lineHeight: 1,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  );
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("bem-theme") as Theme | null;
      const resolved: Theme = saved === "light" ? "light" : "dark";
      setTheme(resolved);
      if (resolved === "light") {
        document.documentElement.classList.add("light");
        injectLightCSS();
      } else {
        document.documentElement.classList.remove("light");
        removeLightCSS();
      }
    } catch {
      // localStorage not available
    }
  }, []);

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem("bem-theme", next);
    } catch {
      // ignore
    }
    if (next === "light") {
      document.documentElement.classList.add("light");
      injectLightCSS();
    } else {
      document.documentElement.classList.remove("light");
      removeLightCSS();
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
      {theme === "light" && <LightThemeBanner />}
    </ThemeContext.Provider>
  );
}
