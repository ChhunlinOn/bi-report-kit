// A small, dependency-free SQL tokenizer for syntax highlighting the query
// editor. Not a full parser \u2014 just enough regex-based token matching to
// color keywords/functions/strings/numbers/comments, the same idea as any
// code editor's "SQL default" theme (VS Code's dark+ token colors).

const KEYWORDS = [
  "SELECT", "FROM", "WHERE", "GROUP BY", "ORDER BY", "HAVING", "JOIN",
  "INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL JOIN", "OUTER JOIN",
  "CROSS JOIN", "ON", "AS", "AND", "OR", "NOT", "IN", "BETWEEN", "LIKE",
  "IS", "NULL", "LIMIT", "OFFSET", "INSERT", "INTO", "VALUES", "UPDATE",
  "SET", "DELETE", "CREATE", "TABLE", "ALTER", "DROP", "DISTINCT", "UNION",
  "ALL", "CASE", "WHEN", "THEN", "ELSE", "END", "ASC", "DESC", "WITH",
  "EXISTS", "OVER", "PARTITION BY", "USING",
];

const FUNCTIONS = [
  "SUM", "AVG", "COUNT", "MIN", "MAX", "COALESCE", "CAST", "ROUND", "NOW",
  "DATE", "EXTRACT", "UPPER", "LOWER", "SUBSTR", "SUBSTRING", "CONCAT",
  "TRIM", "LENGTH",
];

// Longest phrases first so e.g. "GROUP BY" is tried before a bare "GROUP".
const keywordPattern = KEYWORDS.slice()
  .sort((a, b) => b.length - a.length)
  .map((k) => k.replace(/ /g, "\\s+"))
  .join("|");
const functionPattern = FUNCTIONS.join("|");

const TOKEN_RE = new RegExp(
  `(--[^\\n]*)` + // 1: line comment
    `|('(?:[^']|'')*')` + // 2: string literal
    `|(\\b\\d+(?:\\.\\d+)?\\b)` + // 3: number
    `|(\\b(?:${functionPattern})\\b(?=\\s*\\())` + // 4: function call
    `|(\\b(?:${keywordPattern})\\b)`, // 5: keyword
  "gi"
);

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** VS Code dark+ -style token colors, the common "SQL default" look. */
export const SQL_TOKEN_COLORS = {
  background: "#0a0a0a",
  text: "#d4d4d4",
  keyword: "#569cd6",
  function: "#dcdcaa",
  string: "#ce9178",
  number: "#b5cea8",
  comment: "#6a9955",
};

export function highlightSql(sql: string): string {
  let out = "";
  let lastIndex = 0;
  TOKEN_RE.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = TOKEN_RE.exec(sql))) {
    out += escapeHtml(sql.slice(lastIndex, match.index));
    const [full, comment, str, num, fn, kw] = match;
    if (comment) out += `<span style="color:${SQL_TOKEN_COLORS.comment};font-style:italic">${escapeHtml(comment)}</span>`;
    else if (str) out += `<span style="color:${SQL_TOKEN_COLORS.string}">${escapeHtml(str)}</span>`;
    else if (num) out += `<span style="color:${SQL_TOKEN_COLORS.number}">${escapeHtml(num)}</span>`;
    else if (fn) out += `<span style="color:${SQL_TOKEN_COLORS.function}">${escapeHtml(fn)}</span>`;
    else if (kw) out += `<span style="color:${SQL_TOKEN_COLORS.keyword};font-weight:600">${escapeHtml(kw)}</span>`;
    lastIndex = match.index + full.length;
  }
  out += escapeHtml(sql.slice(lastIndex));
  return out;
}
