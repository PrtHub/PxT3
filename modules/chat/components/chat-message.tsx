/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import { Bot, Copy, Check, Edit, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

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
  const [isCopied, setIsCopied] = React.useState(false);

  // Reset copied state after 2 seconds
  React.useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => setIsCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  const handleCopy = async () => {
    try {
      const text =
        React.Children.map(children, (child) =>
          typeof child === "string" ? child : ""
        )?.join("") || "";
      await navigator.clipboard.writeText(text.trim());
      setIsCopied(true);
      toast.success("Code copied to clipboard");
    } catch (error) {
      console.error("Failed to copy text:", error);
      toast.error("Failed to copy code");
    }
  };

  const content =
    React.Children.map(children, (child) =>
      typeof child === "string" ? child : ""
    )?.join("") || "";

  return (
    <div className="relative my-4 rounded-lg overflow-hidden bg-[#1E1E1E]">
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/80 border-b border-zinc-800">
        <span className="text-xs font-medium text-zinc-300 font-mono">
          {language}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-md hover:bg-zinc-800 transition-colors"
          title="Copy to clipboard"
          type="button"
        >
          {isCopied ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          <span>{isCopied ? "Copied!" : "Copy"}</span>
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
            padding: "1.25rem",
            fontSize: "0.875rem",
            lineHeight: "1.5",
            backgroundColor: "transparent",
          }}
          codeTagProps={{
            style: {
              fontFamily: "var(--font-mono, monospace)",
              display: "block",
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
  const isUser = role === "user";
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => setIsCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      toast.success("Message copied to clipboard");
    } catch (error) {
      console.error("Failed to copy text:", error);
      toast.error("Failed to copy message");
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    toast.success("Message updated");
  };

  const handleCancel = () => {
    setEditedContent(content);
    setIsEditing(false);
  };

  const isImageMessage =
    content.startsWith("data:image") ||
    content.startsWith("https://ik.imagekit.io/");

  return (
    <div
      className={cn(
        "group w-full flex flex-col",
        isUser ? "items-end" : "items-start",
        isUser && "mt-20 mb-10"
      )}
    >
      <div
        className={cn(
          "w-fit max-w-3xl border rounded-md",
          isUser
            ? "border-button/20 bg-button/15 px-4 pt-5"
            : "border-zinc-700/50 bg-zinc-800/50 pt-5 px-4",
          content.length === 0 && "w-fit px-4 py-2",

          isEditing && "w-full"
        )}
      >
        <div className="flex gap-4 m-auto">
          <div className="flex-1 overflow-x-auto">
            {isEditing ? (
              <div className="flex flex-col gap-2 w-full px-2">
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full min-h-[100px] p-2 text-white/90 focus:outline-none border-none outline-none ring-0 focus:ring-0 focus:ring-offset-0 focus:border-none focus:ring-transparent focus:ring-offset-transparent rounded-md"
                  autoFocus
                />
                <div className="flex gap-2 justify-end pb-2">
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800/80 hover:text-white cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5 mr-1.5" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    size="sm"
                    className="h-8 px-3 text-xs bg-white text-black hover:bg-white/80 hover:text-black cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="prose prose-invert max-w-none text-white/80">
                {isImageMessage ? (
                  content ? (
                    <div className="aspect-square w-full h-[400px] pb-4 overflow-hidden">
                      <img
                        src={content}
                        alt="Generated content"
                        loading="lazy"
                        className="object-cover rounded-lg w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="aspect-square w-full h-[400px] bg-zinc-800/50 rounded-lg flex flex-col items-center justify-center space-y-4 p-6 text-center">
                      <div className="size-10 border-3 border-button border-t-transparent rounded-full animate-spin" />
                      <div className="space-y-2">
                        <h3 className="text-lg font-medium text-white">Generating your image</h3>
                        <p className="text-sm text-zinc-400">This usually takes 10-20 seconds. Please hold on...</p>
                      </div>
                    </div>
                  )
                ) : (
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
                    table({ children }) {
                      return (
                        <div className="my-4 overflow-x-auto">
                          <table className="w-full border-collapse">
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
                        <th className="border-b border-zinc-600 px-4 py-2 text-left font-semibold text-zinc-200">
                          {children}
                        </th>
                      );
                    },
                    td({ children }) {
                      return (
                        <td className="border-t border-zinc-700/50 px-4 py-2 text-zinc-300">
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
                )}
                {content.length === 0 && isStreaming && (
                  <div className="flex items-center space-x-1 h-6">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
                 {isStreaming && content.length > 0 && (
                  <span className="inline-block w-2 h-6 bg-emerald-400 animate-pulse ml-1" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {isUser && !isEditing && (
        <div className="flex items-center gap-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 px-1 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800/50 cursor-pointer"
          >
            {isCopied ? (
              <>
                <Check className="h-3.5 w-3.5 mr-0.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 mr-0.5" />
                Copy
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            className="h-7 px-1 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800/50 cursor-pointer"
          >
            <Edit className="h-3.5 w-3.5 mr-0.5" />
            Edit
          </Button>
        </div>
      )}
    </div>
  );
}

export function ChatMessageLoading() {
  return (
    <div className="w-full bg-gradient-to-b from-zinc-900/80 to-transparent py-4 mt-20 rounded-md">
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
