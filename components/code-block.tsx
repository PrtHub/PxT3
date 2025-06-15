"use client";

import { useState, useEffect, Children } from "react";
import { Copy, Check} from "lucide-react";
import { toast } from "sonner";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialDark } from "react-syntax-highlighter/dist/cjs/styles/prism";

interface CodeBlockProps {
    language: string;
    children: React.ReactNode;
}

const CodeBlock = ({ language, children }: CodeBlockProps) => {
    const [isCopied, setIsCopied] = useState(false);
  
    useEffect(() => {
      if (isCopied) {
        const timer = setTimeout(() => setIsCopied(false), 2000);
        return () => clearTimeout(timer);
      }
    }, [isCopied]);
  
    const handleCopy = async () => {
      try {
        const text =
          Children.map(children, (child) =>
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
      Children.map(children, (child) =>
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

  
  export default CodeBlock;