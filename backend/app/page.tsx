export default function Home() {
  return (
    <main
      style={{
        fontFamily:
          "system-ui, -apple-system, 'SF Pro Display', 'Segoe UI', sans-serif",
        maxWidth: 720,
        margin: "10vh auto",
        padding: "0 24px",
        lineHeight: 1.6,
        color: "#1a1a1a",
      }}
    >
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>stock-discovery</h1>
      <p style={{ color: "#5a5a5a", marginTop: 0 }}>
        Backend for a Claude.ai skill that helps with fundamental research on
        Indian stocks (NSE/BSE). Translates a thesis to companies, scans
        anomalies on 10-12 yr financials, answers cross-stock questions, and
        learns from accept/reject reasons.
      </p>
      <h2 style={{ fontSize: 18, marginTop: 32 }}>Status</h2>
      <p>
        If you can see this page, the API is up. The skill talks to{" "}
        <code>/api/*</code> with a per-user bearer token.
      </p>
      <h2 style={{ fontSize: 18, marginTop: 32 }}>For your friend</h2>
      <p>
        You don&apos;t interact with this site directly. Upload the{" "}
        <code>stock-research</code> skill to your claude.ai account and chat as
        normal.
      </p>
      <p style={{ color: "#5a5a5a", fontSize: 14 }}>
        Source:{" "}
        <a
          href="https://github.com/Aryan-03-kumar/stock-discovery"
          style={{ color: "#1a3d6e" }}
        >
          github.com/Aryan-03-kumar/stock-discovery
        </a>
      </p>
    </main>
  );
}
