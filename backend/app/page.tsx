"use client";

import { useState } from "react";

interface SignupResponse {
  token: string;
  bundle_url: string;
  instructions: string[];
}

export default function Home() {
  const [signup, setSignup] = useState<SignupResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSignup() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/signup", { method: "POST" });
      if (!res.ok) throw new Error(`Signup failed: ${res.status}`);
      const data: SignupResponse = await res.json();
      setSignup(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function copyToken() {
    if (!signup) return;
    await navigator.clipboard.writeText(signup.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main style={S.page}>
      <header style={S.header}>
        <h1 style={S.h1}>stock-discovery</h1>
        <p style={S.tagline}>
          A research copilot for fundamental discovery on Indian stocks
          (NSE/BSE) — runs as a skill inside claude.ai. State persists,
          philosophy compounds, sector-aware.
        </p>
      </header>

      {!signup ? (
        <section style={S.section}>
          <h2 style={S.h2}>What you&apos;re getting</h2>
          <ul style={S.bullets}>
            <li>A claude.ai skill that translates a sector thesis into companies, scans 10-12 years of financials for anomalies, and answers cross-stock comparison questions.</li>
            <li>Decisions you make (accept/reject + reason) are saved and distilled into your own investing philosophy, segmented per sector.</li>
            <li>Runs on your own claude.ai account — your tokens, your usage.</li>
          </ul>

          <h2 style={S.h2}>Three steps</h2>
          <ol style={S.steps}>
            <li>Click below to generate your token + personalized skill zip.</li>
            <li>Upload the zip in claude.ai → Settings → Capabilities → Skills.</li>
            <li>Open a new chat and describe your sector thesis. The skill triggers automatically.</li>
          </ol>

          <button
            onClick={handleSignup}
            disabled={loading}
            style={{ ...S.cta, ...(loading ? S.ctaDisabled : null) }}
          >
            {loading ? "Generating…" : "Generate my skill"}
          </button>

          {error && <p style={S.err}>{error}</p>}

          <p style={S.fineprint}>
            No email, no signup form, no recovery. The token IS your account —
            treat it like a wallet seed phrase. Lose it, lose your state.
          </p>
        </section>
      ) : (
        <section style={S.section}>
          <h2 style={S.h2}>Your token (save this somewhere safe)</h2>
          <div style={S.tokenBox}>
            <code style={S.tokenText}>{signup.token}</code>
            <button onClick={copyToken} style={S.copyBtn}>
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>
          <p style={S.warn}>
            ⚠️ This is the only time you&apos;ll see it. There&apos;s no password
            recovery. Anyone with this token can read and write your saved
            state.
          </p>

          <h2 style={S.h2}>Download your skill</h2>
          <p style={{ marginTop: 0 }}>
            The zip is personalized with your token. Drop it directly into
            claude.ai.
          </p>
          <a
            href={signup.bundle_url}
            download
            style={S.downloadBtn}
          >
            ↓ Download stock-research.zip
          </a>

          <h2 style={S.h2}>Then in claude.ai</h2>
          <ol style={S.steps}>
            {signup.instructions.slice(1).map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ol>

          <p style={S.fineprint}>
            Done with this page? Close it. Your token isn&apos;t stored anywhere
            else — once gone from your clipboard, it&apos;s only in the file you
            downloaded.
          </p>
        </section>
      )}

      <footer style={S.footer}>
        Source: <a href="https://github.com/Aryan-03-kumar/stock-discovery" style={S.link}>github.com/Aryan-03-kumar/stock-discovery</a>
      </footer>
    </main>
  );
}

const S = {
  page: {
    fontFamily:
      "system-ui, -apple-system, 'SF Pro Display', 'Segoe UI', sans-serif",
    maxWidth: 720,
    margin: "8vh auto 4vh",
    padding: "0 24px",
    lineHeight: 1.6,
    color: "#1a1a1a",
  },
  header: { marginBottom: 32 },
  h1: { fontSize: 32, marginBottom: 8, color: "#1a1a1a" },
  tagline: { color: "#5a5a5a", marginTop: 0, fontSize: 16 },
  section: {
    background: "#fafafa",
    border: "1px solid #e8e8e8",
    borderRadius: 8,
    padding: "24px 28px",
  },
  h2: { fontSize: 18, marginTop: 28, marginBottom: 12 },
  bullets: { paddingLeft: 18, margin: 0 },
  steps: { paddingLeft: 22, margin: 0 },
  cta: {
    marginTop: 24,
    fontSize: 16,
    padding: "12px 24px",
    background: "#1a3d6e",
    color: "white",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: 600,
  },
  ctaDisabled: { background: "#888", cursor: "not-allowed" },
  err: { color: "#c0392b", marginTop: 12 },
  fineprint: { fontSize: 13, color: "#7a7a7a", marginTop: 16 },
  tokenBox: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "#fff",
    border: "1px solid #d8d8d8",
    borderRadius: 6,
    padding: "10px 14px",
    fontFamily:
      "ui-monospace, 'SF Mono', 'Cascadia Mono', Menlo, Consolas, monospace",
  },
  tokenText: {
    flex: 1,
    fontSize: 14,
    color: "#1a1a1a",
    overflow: "auto",
    whiteSpace: "nowrap" as const,
  },
  copyBtn: {
    background: "#eee",
    border: "1px solid #ccc",
    borderRadius: 4,
    padding: "6px 12px",
    cursor: "pointer",
    fontSize: 13,
    color: "#1a1a1a",
  },
  warn: { color: "#c0392b", fontSize: 14, marginTop: 8 },
  downloadBtn: {
    display: "inline-block",
    marginTop: 8,
    fontSize: 15,
    padding: "10px 20px",
    background: "#1a3d6e",
    color: "white",
    textDecoration: "none",
    borderRadius: 6,
    fontWeight: 600,
  },
  footer: {
    marginTop: 40,
    fontSize: 13,
    color: "#7a7a7a",
    textAlign: "center" as const,
  },
  link: { color: "#1a3d6e" },
} as const;
