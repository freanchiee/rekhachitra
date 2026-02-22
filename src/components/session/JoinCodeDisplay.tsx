"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { formatJoinCode } from "@/lib/utils/session";

interface JoinCodeDisplayProps {
  code: string;
  url?: string;
}

export function JoinCodeDisplay({ code, url }: JoinCodeDisplayProps) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  const copyToClipboard = async (text: string, type: "code" | "link") => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div>
        <p
          className="text-center text-xs font-semibold uppercase tracking-widest mb-2"
          style={{ color: "var(--color-muted)", fontFamily: "var(--font-body)" }}
        >
          Join Code
        </p>
        <div
          className="flex items-center gap-3 px-6 py-4 rounded-2xl cursor-pointer group hover:opacity-90 transition-opacity"
          style={{ backgroundColor: "var(--color-brand-teal)" }}
          onClick={() => copyToClipboard(code, "code")}
          title="Click to copy code"
        >
          <span
            className="text-5xl font-bold tracking-[0.15em] text-white select-all"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {formatJoinCode(code)}
          </span>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/20 group-hover:bg-white/30 transition-colors">
            {copied === "code" ? (
              <Check size={16} color="white" />
            ) : (
              <Copy size={16} color="white" />
            )}
          </div>
        </div>
      </div>

      {url && (
        <button
          onClick={() => copyToClipboard(url, "link")}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg transition-colors hover:bg-[var(--color-surface)]"
          style={{ color: "var(--color-brand-teal)", fontFamily: "var(--font-body)" }}
        >
          {copied === "link" ? (
            <><Check size={14} /> Link copied!</>
          ) : (
            <><Copy size={14} /> Copy join link</>
          )}
        </button>
      )}
    </div>
  );
}
