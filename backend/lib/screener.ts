import * as cheerio from "cheerio";
import type { FinancialsCache } from "./types";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function parseNumber(text: string): number | null {
  const s = text.trim().replace(/,/g, "").replace(/₹/g, "").replace(/%/g, "");
  if (!s || s === "-" || s === "—" || s === "–") return null;
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

type Section = { years: string[]; rows: Record<string, (number | null)[]> };

function parseSection($: cheerio.CheerioAPI, sectionId: string): Section {
  const section = $(`#${sectionId}`);
  if (!section.length) return { years: [], rows: {} };
  const table = section.find("table").first();
  if (!table.length) return { years: [], rows: {} };

  const years: string[] = [];
  table.find("thead th").each((_, el) => {
    years.push($(el).text().trim());
  });
  const dataYears = years.slice(1);

  const rows: Record<string, (number | null)[]> = {};
  table.find("tbody tr").each((_, tr) => {
    const cells = $(tr).find("td, th").toArray();
    if (!cells.length) return;
    const label = $(cells[0]).text().trim().replace(/\+$/, "").trim();
    if (!label) return;
    rows[label] = cells.slice(1).map((c) => parseNumber($(c).text()));
  });

  return { years: dataYears, rows };
}

export async function fetchScreener(ticker: string): Promise<FinancialsCache> {
  const symbol = ticker.toUpperCase().split(".")[0];
  const urls = [
    `https://www.screener.in/company/${symbol}/consolidated/`,
    `https://www.screener.in/company/${symbol}/`,
  ];

  let usedUrl = urls[0];
  let html: string | null = null;
  for (const url of urls) {
    const res = await fetch(url, { headers: { "User-Agent": UA }, cache: "no-store" });
    if (res.status === 404) continue;
    if (!res.ok) throw new Error(`Screener returned ${res.status} for ${url}`);
    html = await res.text();
    usedUrl = url;
    break;
  }
  if (!html) throw new Error(`Screener has no page for ${symbol}`);

  const $ = cheerio.load(html);
  const companyName = $("h1").first().text().trim() || null;

  const pnl = parseSection($, "profit-loss");
  const bs = parseSection($, "balance-sheet");
  const cf = parseSection($, "cash-flow");
  const ratios = parseSection($, "ratios");
  const quarters = parseSection($, "quarters");

  return {
    ticker: ticker.toUpperCase(),
    company_name: companyName,
    source: usedUrl,
    currency: "INR",
    scale: "crore",
    years: pnl.years.length ? pnl.years : bs.years.length ? bs.years : cf.years,
    statements: {
      pnl: pnl.rows,
      balance_sheet: bs.rows,
      cash_flow: cf.rows,
      ratios: ratios.rows,
      quarters: quarters.rows,
    },
    statement_years: {
      pnl: pnl.years,
      balance_sheet: bs.years,
      cash_flow: cf.years,
      ratios: ratios.years,
      quarters: quarters.years,
    },
    fetched_at: new Date().toISOString(),
  };
}
