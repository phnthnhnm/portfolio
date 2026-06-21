/**
 * Estimates reading time from raw markdown text.
 *
 * Strips markdown syntax, counts words, and returns a human-readable string
 * like "5 min read". Intended for build-time use only.
 */
export function getReadingTime(markdown: string, wpm = 225): string {
  let text = markdown;

  // Remove fenced code blocks
  text = text.replace(/```[\s\S]*?```/g, "");
  // Remove inline code
  text = text.replace(/`[^`]*`/g, "");
  // Remove HTML tags
  text = text.replace(/<\/?[^>]+(>|$)/g, "");
  // Remove image syntax
  text = text.replace(/!\[.*?\]\(.*?\)/g, "");
  // Convert link syntax to just the link text
  text = text.replace(/\[([^\]]*)\]\(.*?\)/g, "$1");
  // Remove heading markers
  text = text.replace(/^#{1,6}\s+/gm, "");
  // Remove bold/italic markers
  text = text.replace(/(\*{1,3}|_{1,3})/g, "");
  // Remove blockquote markers
  text = text.replace(/^>\s?/gm, "");
  // Remove horizontal rules
  text = text.replace(/^(-{3,}|\*{3,}|_{3,})\s*$/gm, "");
  // Remove list markers
  text = text.replace(/^[\s]*[-*+]\s/gm, "");
  // Collapse whitespace
  text = text.replace(/\s+/g, " ").trim();

  if (!text) return "1 min read";

  const words = text.split(" ").filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / wpm));
  return `${minutes} min read`;
}
