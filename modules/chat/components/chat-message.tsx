"use client";

import React from "react";
import { Bot, Copy } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  role: "user" | "assistant" | "system";
  content: string;
  isStreaming?: boolean;
}

interface CodeBlockProps {
  language: string;
  children: React.ReactNode;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, children }) => {
  const handleCopy = async () => {
    try {
      const text =
        React.Children.map(children, (child) =>
          typeof child === "string" ? child : ""
        )?.join("") || "";
      await navigator.clipboard.writeText(text.trim());
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  };

  const content =
    React.Children.map(children, (child) =>
      typeof child === "string" ? child : ""
    )?.join("") || "";

  return (
    <div className="relative my-4 rounded-lg overflow-hidden bg-[#1E1E1E]">
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/80 border-b border-zinc-800">
        <span className="text-xs font-medium text-zinc-300 font-mono">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-md hover:bg-zinc-800 transition-colors"
          title="Copy to clipboard"
          type="button"
        >
          <Copy className="h-3.5 w-3.5" />
          <span>Copy</span>
        </button>
      </div>
      <div className="overflow-x-auto">
        <SyntaxHighlighter
          language={language}
          style={materialDark}
          showLineNumbers
          wrapLines
          wrapLongLines={false}
          customStyle={{
            margin: 0,
            padding: '1.25rem',
            fontSize: '0.875rem',
            lineHeight: '1.5',
            backgroundColor: 'transparent',
          }}
          codeTagProps={{
            style: {
              fontFamily: 'var(--font-mono, monospace)',
              display: 'block',
            },
          }}
        >
          {content}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export function ChatMessage({
  role,
  content,
  isStreaming = false,
}: ChatMessageProps) {
  const isUser = role === "user"

  return (
    <div
      className={cn(
        "group w-fit",
        isUser && "ml-auto px-4 pt-5 border border-button/20 bg-button/15 rounded-md mt-20 mb-16"
      )}
    >
      <div className="flex gap-4 m-auto max-w-3xl">
        <div className="flex-1 overflow-x-auto">
          <div className="prose prose-invert max-w-none text-white/80">
            <ReactMarkdown
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
                p({ children, ...props }) {
                  return (
                    <p className="mb-5 leading-relaxed text-zinc-200" {...props}>
                      {children}
                    </p>
                  );
                },
                ul({ children, ...props }) {
                  return (
                    <ul className="list-disc pl-6 mb-5 space-y-2.5 text-zinc-200" {...props}>
                      {children}
                    </ul>
                  );
                },
                ol({ children, ...props }) {
                  return (
                    <ol className="list-decimal pl-6 mb-5 space-y-2.5 text-zinc-200" {...props}>
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
                    <h1 className="text-2xl font-bold text-white mt-8 mb-4" {...props}>
                      {children}
                    </h1>
                  );
                },
                h2({ children, ...props }) {
                  return (
                    <h2 className="text-xl font-bold text-white mt-6 mb-3" {...props}>
                      {children}
                    </h2>
                  );
                },
                h3({ children, ...props }) {
                  return (
                    <h3 className="text-lg font-bold text-white mt-5 mb-2.5" {...props}>
                      {children}
                    </h3>
                  );
                },
                blockquote({ children, ...props }) {
                  return (
                    <blockquote className="border-l-4 border-zinc-600 pl-4 py-1 my-4 text-zinc-300 italic" {...props}>
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
            {isStreaming && (
              <span className="inline-block w-2 h-6 bg-emerald-400 animate-pulse ml-1" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ChatMessageLoading() {
  return (
    <div className="w-full bg-gradient-to-b from-zinc-900/80 to-transparent py-4 mt-10 rounded-md">
      <div className="flex gap-4 px-4 m-auto max-w-3xl">
        <div className="flex-shrink-0">
          <div className="h-9 w-9 rounded-lg bg-emerald-900/40 flex items-center justify-center">
            <Bot className="h-4.5 w-4.5 text-emerald-400" />
          </div>
        </div>
        <div className="flex-1 space-y-3 pt-1">
          <div className="h-4 bg-zinc-800/60 rounded-full w-3/4 animate-pulse" />
          <div className="h-4 bg-zinc-800/40 rounded-full w-5/6 animate-pulse" />
          <div className="h-4 bg-zinc-800/30 rounded-full w-2/3 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
