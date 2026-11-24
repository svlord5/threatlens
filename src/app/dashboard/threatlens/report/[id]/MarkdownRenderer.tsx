import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';

export default function MarkdownRenderer({ content }: { content: string }) {
  if (!content) return null;

  // Convert markdown to raw HTML
  const rawHtml = marked(content);
  
  // Sanitize the HTML to prevent XSS
  const cleanHtml = DOMPurify.sanitize(rawHtml as string);

  return (
    <div dangerouslySetInnerHTML={{ __html: cleanHtml }} />
  );
}
