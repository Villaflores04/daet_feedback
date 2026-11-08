/** Small RFC 4180 CSV parser: quoted fields, escaped quotes, commas and line breaks inside quotes. Handles BOM and ; or tab separators. */
export function parseCsv(input: string): string[][] {
  const text = input.replace(/^﻿/, "");
  const first = text.split(/\r?\n/, 1)[0] ?? "";
  const sep = [",", ";", "\t"].map((c) => [c, first.split(c).length] as const).sort((a, b) => b[1] - a[1])[0][0];
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; } else quoted = false;
      } else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((c) => c.trim())) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim())) rows.push(row);
  return rows;
}

/** Guesses which column holds what. Exact header names win over partial matches, and "Reviewer" is never mistaken for the review text. */
export function detectColumns(headers: string[]) {
  const head = headers.map((h) => h.trim().toLowerCase());
  const pick = (exact: string[], partial: string[], avoid: string[] = []) => {
    const e = head.findIndex((h) => exact.includes(h));
    if (e >= 0) return e;
    return head.findIndex((h) => partial.some((p) => h.includes(p)) && !avoid.some((a) => h.includes(a)));
  };
  return {
    body: pick(["full review", "review text", "review body", "comment", "comments", "review", "feedback", "message", "text", "response"], ["review text", "comment", "feedback", "message", "body", "response", "text", "review"], ["reviewer", "title", "date", "rating"]),
    title: pick(["title", "review title", "headline", "subject"], ["title", "headline"]),
    stars: pick(["rating", "stars", "star", "score"], ["rating", "stars", "star", "score"]),
    date: pick(["written date", "review date", "date posted", "date", "created", "timestamp"], ["written", "posted", "date", "created", "time"], ["experience"]),
    author: pick(["reviewer", "author", "name", "user", "username"], ["reviewer", "author", "name", "user"]),
  };
}
