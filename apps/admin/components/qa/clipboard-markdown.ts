/**
 * Flattens clipboard HTML into Markdown before it reaches the source box.
 *
 * This is the **only** place a link target survives. Pasting into a plain
 * textarea gives `text/plain`, where `<a href="…">HTTP</a>` arrives as the word
 * "HTTP" and the URL is gone for good — the backend stores Markdown and never
 * sees the HTML.
 *
 * Deliberately small: headings, lists, links, emphasis, code and paragraphs.
 * Everything else becomes its text. The target is a prompt for a model, not a
 * faithful copy of someone's page — and the backend strips raw HTML anyway, so
 * anything fancier would be thrown away one step later.
 */
export function htmlToMarkdown(html: string): string {
  if (typeof window === "undefined") return html;

  const doc = new DOMParser().parseFromString(html, "text/html");
  const text = nodeToMarkdown(doc.body).replace(/\n{3,}/g, "\n\n").trim();
  return text;
}

function nodeToMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    // Collapse the whitespace HTML sources are full of; Markdown gives newlines
    // a meaning, so stray ones would create paragraphs nobody wrote.
    return (node.textContent ?? "").replace(/\s+/g, " ");
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const element = node as HTMLElement;
  const children = () =>
    Array.from(element.childNodes).map(nodeToMarkdown).join("");

  switch (element.tagName) {
    case "H1":
    case "H2":
      return `\n\n## ${children().trim()}\n\n`;
    case "H3":
      return `\n\n### ${children().trim()}\n\n`;
    case "H4":
    case "H5":
    case "H6":
      return `\n\n#### ${children().trim()}\n\n`;

    case "P":
    case "DIV":
    case "SECTION":
    case "ARTICLE":
      return `\n\n${children().trim()}\n\n`;

    case "BR":
      return "\n";

    case "UL":
    case "OL":
      return `\n${children()}\n`;

    case "LI": {
      const marker = element.parentElement?.tagName === "OL" ? "1." : "-";
      return `${marker} ${children().trim()}\n`;
    }

    case "A": {
      const href = element.getAttribute("href") ?? "";
      const label = children().trim();
      // A link with no target is just words — writing `[x]()` would be noise in
      // the prompt.
      return href ? `[${label}](${href})` : label;
    }

    case "STRONG":
    case "B":
      return `**${children().trim()}**`;

    case "EM":
    case "I":
      return `*${children().trim()}*`;

    case "CODE":
      return `\`${children().trim()}\``;

    case "PRE":
      return `\n\n\`\`\`\n${element.textContent ?? ""}\n\`\`\`\n\n`;

    case "BLOCKQUOTE":
      return `\n\n> ${children().trim()}\n\n`;

    case "TABLE":
    case "THEAD":
    case "TBODY":
    case "TR":
      return `\n${children()}\n`;

    case "TH":
    case "TD":
      // Cells separated by a pipe, no alignment row: this is source text for a
      // model, not a table anyone renders.
      return `${children().trim()} | `;

    // Elements whose content is not prose at all.
    case "SCRIPT":
    case "STYLE":
    case "NOSCRIPT":
      return "";

    default:
      return children();
  }
}
