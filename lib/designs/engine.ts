// A tiny renderer for the subset of the Claude design-component template
// format the Hikayati cards use:
//   {{a.b}}                          value lookup (HTML-escaped)
//   <sc-if value="{{x}}">…</sc-if>    kept when x is truthy
//   <sc-for list="{{xs}}" as="it">…</sc-for>   repeated per item
// Anything else is passed through as-is. Values always come from our own
// code or the organizer's text, and are escaped, so they can't inject markup.

type Scope = Record<string, unknown>;

interface Node {
  kind: "text" | "if" | "for";
  text?: string;
  expr?: string;
  as?: string;
  children?: Node[];
}

const TAG = /<(\/?)sc-(if|for)\b([^>]*)>/g;

function attr(attrs: string, name: string) {
  return new RegExp(`${name}="([^"]*)"`).exec(attrs)?.[1] ?? "";
}

function hole(expr: string) {
  return /^\{\{\s*([\w.]+)\s*\}\}$/.exec(expr)?.[1] ?? "";
}

function parse(markup: string): Node[] {
  const root: Node = { kind: "if", children: [] };
  const stack: Node[] = [root];
  let last = 0;
  for (const m of markup.matchAll(TAG)) {
    const top = stack[stack.length - 1];
    if (m.index > last) top.children!.push({ kind: "text", text: markup.slice(last, m.index) });
    last = m.index + m[0].length;
    if (m[1] === "/") {
      if (stack.length === 1) throw new Error("Unbalanced </sc-" + m[2] + ">");
      stack.pop();
    } else {
      const node: Node =
        m[2] === "if"
          ? { kind: "if", expr: hole(attr(m[3], "value")), children: [] }
          : { kind: "for", expr: hole(attr(m[3], "list")), as: attr(m[3], "as"), children: [] };
      top.children!.push(node);
      stack.push(node);
    }
  }
  if (stack.length !== 1) throw new Error("Unclosed <sc-if>/<sc-for>");
  if (last < markup.length) root.children!.push({ kind: "text", text: markup.slice(last) });
  return root.children!;
}

function lookup(scopes: Scope[], path: string): unknown {
  const [head, ...rest] = path.split(".");
  for (let i = scopes.length - 1; i >= 0; i--) {
    if (head in scopes[i]) {
      let v: unknown = scopes[i][head];
      for (const k of rest) v = v && typeof v === "object" ? (v as Scope)[k] : undefined;
      return v;
    }
  }
  return undefined;
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function fill(text: string, scopes: Scope[]) {
  return text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path: string) => {
    const v = lookup(scopes, path);
    return v === undefined || v === null || typeof v === "object" ? "" : escapeHtml(String(v));
  });
}

function render(nodes: Node[], scopes: Scope[]): string {
  let out = "";
  for (const n of nodes) {
    if (n.kind === "text") out += fill(n.text!, scopes);
    else if (n.kind === "if") {
      if (lookup(scopes, n.expr!)) out += render(n.children!, scopes);
    } else {
      const list = lookup(scopes, n.expr!);
      if (Array.isArray(list)) for (const item of list) out += render(n.children!, [...scopes, { [n.as!]: item }]);
    }
  }
  return out;
}

// Parsed templates are cached; each layout is parsed once per process.
const cache = new Map<string, Node[]>();

export function renderTemplate(markup: string, values: Scope): string {
  let nodes = cache.get(markup);
  if (!nodes) {
    nodes = parse(markup.replace(/\s+hint-[\w-]+="[^"]*"/g, ""));
    cache.set(markup, nodes);
  }
  return sanitize(render(nodes, [values]));
}

// The cards come from a prototype canvas: links point at other artboards
// (e.g. GuestPass.dc.html). Render them as plain styled text instead.
function sanitize(html: string) {
  return html
    .replace(/<a\b([^>]*?)\s+href="[^"]*"([^>]*)>/g, "<span$1$2>")
    .replace(/<\/a>/g, "</span>")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "");
}
