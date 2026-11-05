import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Renders trusted, repository-authored Markdown. Not for untrusted input. */
export function Markdown({ children, className = "", size = "md" }: { children: string; className?: string; size?: "md" | "sm" }) {
  return (
    <div className={`prose-aa ${size === "sm" ? "prose-sm" : ""} ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}

/** Inline Markdown for short strings such as option labels (no block wrappers). */
export function InlineMarkdown({ children, className = "" }: { children: string; className?: string }) {
  return (
    <span className={`prose-aa inline ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ p: ({ children }) => <>{children}</> }} allowedElements={["p", "code", "strong", "em", "a"]} unwrapDisallowed>
        {children}
      </ReactMarkdown>
    </span>
  );
}
