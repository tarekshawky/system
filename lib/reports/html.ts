export function renderReportHtml({
  title,
  companyName,
  locale,
  columns,
  rows,
  generatedAt,
}: {
  title: string;
  companyName: string;
  locale: string;
  columns: { key: string; label: string; align?: "start" | "end" }[];
  rows: Record<string, string | number>[];
  generatedAt: string;
}) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  const escape = (v: unknown) =>
    String(v).replace(
      /[&<>"']/g,
      (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
          c
        ] as string,
    );

  const headerCells = columns
    .map(
      (c) =>
        `<th style="text-align:${c.align === "end" ? "end" : "start"}">${escape(c.label)}</th>`,
    )
    .join("");

  const bodyRows = rows
    .map((row) => {
      const cells = columns
        .map(
          (c) =>
            `<td style="text-align:${c.align === "end" ? "end" : "start"}">${escape(row[c.key] ?? "")}</td>`,
        )
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  return `<!doctype html>
<html lang="${locale}" dir="${dir}">
<head>
<meta charset="utf-8" />
<title>${escape(title)}</title>
<style>
  @page { margin: 24px; }
  * { box-sizing: border-box; }
  body {
    font-family: ${
      locale === "ar"
        ? "'Noto Sans Arabic', 'Segoe UI', Tahoma, sans-serif"
        : "'Segoe UI', Arial, sans-serif"
    };
    color: #111827;
    margin: 0;
    padding: 0;
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    border-bottom: 2px solid #111827;
    padding-bottom: 8px;
    margin-bottom: 16px;
  }
  h1 { font-size: 18px; margin: 0; }
  .company { font-size: 13px; color: #4b5563; }
  .meta { font-size: 11px; color: #6b7280; margin-bottom: 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { padding: 6px 8px; border-bottom: 1px solid #e5e7eb; }
  th { background: #f3f4f6; font-weight: 600; }
  tr:nth-child(even) { background: #fafafa; }
</style>
</head>
<body>
  <header>
    <h1>${escape(title)}</h1>
    <div class="company">${escape(companyName)}</div>
  </header>
  <div class="meta">${escape(generatedAt)}</div>
  <table>
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
</body>
</html>`;
}
