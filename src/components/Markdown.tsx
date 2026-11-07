import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: false });

export function Markdown({ text, className = '' }: { text: string; className?: string }) {
  return <div className={`md ${className}`} dangerouslySetInnerHTML={{ __html: marked.parse(text) as string }} />;
}
