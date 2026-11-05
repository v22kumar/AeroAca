import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import { remarkGlossary } from "@/lib/content/glossary-matcher";
import { Term } from "@/components/glossary/Term";
import type { ComponentProps } from "react";

const urlTransform = (url: string) => (url.startsWith("term:") ? url : defaultUrlTransform(url));

function Anchor({ href, children, ...rest }: ComponentProps<"a">) {
  if (href?.startsWith("term:")) return <Term id={href.slice(5)}>{children}</Term>;
  return (
    <a href={href} target={href?.startsWith("http") ? "_blank" : undefined} rel={href?.startsWith("http") ? "noreferrer noopener" : undefined} {...rest}>
      {children}
    </a>
  );
}

/** Renders trusted, repository-authored Markdown. Glossary terms become tappable definitions. Not for untrusted input. */
export function Markdown({ children, className = "", size = "md", glossary = true }: { children: string; className?: string; size?: "md" | "sm"; glossary?: boolean }) {
  return (
    <div className={`prose-aa ${size === "sm" ? "prose-sm" : ""} ${className}`}>
      <ReactMarkdown remarkPlugins={glossary ? [remarkGfm, remarkGlossary] : [remarkGfm]} urlTransform={urlTransform} components={{ a: Anchor }}>
        {children}
      </ReactMarkdown>
    </div>
  );
}

/** Inline Markdown for short strings such as option labels (no block wrappers, no glossary links so taps select the option). */
export function InlineMarkdown({ children, className = "" }: { children: string; className?: string }) {
  return (
    <span className={`prose-aa inline ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ p: ({ children }) => <>{children}</> }} allowedElements={["p", "code", "strong", "em", "a"]} unwrapDisallowed>
        {children}
      </ReactMarkdown>
    </span>
  );
}
