import type { Components } from "react-markdown";

export const mdComponents: Components = {
  h1: ({ children }) => (
    <h1 className="text-2xl font-bold text-foreground mt-8 mb-4 first:mt-0 leading-tight">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-lg font-semibold text-foreground mt-7 mb-3 leading-snug">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-semibold text-foreground mt-5 mb-2">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="text-base text-foreground leading-7 mb-4">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="mb-4 space-y-1.5 pl-5 list-disc">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-4 space-y-1.5 pl-5 list-decimal">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="text-base text-foreground leading-7">{children}</li>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  code: ({ children }) => (
    <code className="font-mono text-[0.85em] bg-muted px-1.5 py-0.5 rounded text-foreground">
      {children}
    </code>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-border pl-4 italic text-muted-foreground my-4">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="border-border my-8" />,
  table: ({ children }) => (
    <div className="overflow-x-auto my-4">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-border px-3 py-2 text-left font-semibold bg-muted text-foreground">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-border px-3 py-2 text-foreground">{children}</td>
  ),
};
