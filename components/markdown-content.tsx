'use client'

import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import CodeBlock from "@/components/code-block";

interface MarkdownContentProps {
  content: string;
}

const MarkdownContent = ({ content }: MarkdownContentProps) => {
  return (
    <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    rehypePlugins={[rehypeRaw]}
    components={{
      code({ className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || "");

        if (match) {
          return (
            <div className="my-4">
              <CodeBlock language={match[1]}>
                {Array.isArray(children)
                  ? children.join("")
                  : String(children).replace(/\n$/, "")}
              </CodeBlock>
            </div>
          );
        }
        return (
          <code
            className="bg-zinc-800/50 rounded px-1.5 py-0.5 text-sm font-mono text-emerald-300"
            {...props}
          >
            {children}
          </code>
        );
      },
      table({ children }) {
        return (
          <div className="my-4 overflow-x-auto">
            <table className="w-full border-collapse border border-zinc-800">
              {children}
            </table>
          </div>
        );
      },
      thead({ children }) {
        return (
          <thead className="bg-zinc-800/50">{children}</thead>
        );
      },
      tbody({ children }) {
        return (
          <tbody className="divide-y divide-zinc-700">
            {children}
          </tbody>
        );
      },
      tr({ children }) {
        return (
          <tr className="hover:bg-zinc-800/30">{children}</tr>
        );
      },
      th({ children }) {
        return (
          <th className="border border-zinc-800 px-4 py-2 text-left font-semibold text-zinc-200">
            {children}
          </th>
        );
      },

      td({ children }) {
        return (
          <td className="border border-zinc-800 px-4 py-2 text-zinc-300">
            {children}
          </td>
        );
      },
      p({ children, ...props }) {
        return (
          <p
            className="mb-5 leading-relaxed text-zinc-200"
            {...props}
          >
            {children}
          </p>
        );
      },
      ul({ children, ...props }) {
        return (
          <ul
            className="list-disc pl-6 mb-5 space-y-2.5 text-zinc-200"
            {...props}
          >
            {children}
          </ul>
        );
      },
      ol({ children, ...props }) {
        return (
          <ol
            className="list-decimal pl-6 mb-5 space-y-2.5 text-zinc-200"
            {...props}
          >
            {children}
          </ol>
        );
      },
      li({ children, ...props }) {
        return (
          <li className="mb-1.5 pl-1" {...props}>
            {children}
          </li>
        );
      },
      h1({ children, ...props }) {
        return (
          <h1
            className="text-2xl font-bold text-white mt-8 mb-4"
            {...props}
          >
            {children}
          </h1>
        );
      },
      h2({ children, ...props }) {
        return (
          <h2
            className="text-xl font-bold text-white mt-6 mb-3"
            {...props}
          >
            {children}
          </h2>
        );
      },
      h3({ children, ...props }) {
        return (
          <h3
            className="text-lg font-bold text-white mt-5 mb-2.5"
            {...props}
          >
            {children}
          </h3>
        );
      },
      blockquote({ children, ...props }) {
        return (
          <blockquote
            className="border-l-4 border-zinc-600 pl-4 py-1 my-4 text-zinc-300 italic"
            {...props}
          >
            {children}
          </blockquote>
        );
      },
      a({ children, ...props }) {
        return (
          <a
            className="text-emerald-400 hover:underline hover:text-emerald-300 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
            {...props}
          >
            {children}
          </a>
        );
      },
    }}
  >
    {content}
  </ReactMarkdown>
  )
}

export default MarkdownContent