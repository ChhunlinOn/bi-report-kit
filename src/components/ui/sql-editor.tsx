import * as React from "react";
import { highlightSql, SQL_TOKEN_COLORS } from "@/lib/sqlHighlight";
import { cn } from "@/lib/utils";

export interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** visible height in pixels; content scrolls within it once it overflows */
  height?: number;
  disabled?: boolean;
  className?: string;
}

/**
 * A SQL input styled like a code editor \u2014 black background, syntax
 * colors (keywords/functions/strings/numbers/comments) \u2014 instead of a
 * plain textarea. Built the standard way: a transparent, editable
 * <textarea> layered exactly over a read-only, syntax-highlighted <pre>,
 * kept in sync on every keystroke and scroll. No editor dependency
 * (CodeMirror/Monaco) required for this.
 */
export function SqlEditor({ value, onChange, placeholder, height = 180, disabled, className }: SqlEditorProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const preRef = React.useRef<HTMLPreElement>(null);

  function syncScroll() {
    if (preRef.current && textareaRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }

  const sharedTextStyle: React.CSSProperties = {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
    fontSize: "0.8125rem",
    lineHeight: 1.6,
    padding: "0.75rem",
    margin: 0,
    whiteSpace: "pre",
    wordBreak: "normal",
    overflowWrap: "normal",
  };

  return (
    <div
      className={cn("brk-relative brk-overflow-hidden brk-rounded-md brk-border brk-border-input brk-shadow-sm focus-within:brk-ring-1 focus-within:brk-ring-ring", className)}
      style={{ background: SQL_TOKEN_COLORS.background, height }}
    >
      <pre
        ref={preRef}
        aria-hidden
        className="brk-pointer-events-none brk-absolute brk-inset-0 brk-overflow-auto"
        style={{ ...sharedTextStyle, color: SQL_TOKEN_COLORS.text }}
        dangerouslySetInnerHTML={{ __html: (value ? highlightSql(value) : "") + "\n" }}
      />
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={syncScroll}
        spellCheck={false}
        disabled={disabled}
        className="brk-absolute brk-inset-0 brk-resize-none brk-overflow-auto brk-bg-transparent brk-outline-none disabled:brk-cursor-not-allowed"
        style={{
          ...sharedTextStyle,
          color: "transparent",
          caretColor: "#ffffff",
          WebkitTextFillColor: "transparent",
        }}
      />
      {!value && placeholder && (
        <div
          className="brk-pointer-events-none brk-absolute brk-inset-0"
          style={{ ...sharedTextStyle, color: "#6b7280" }}
        >
          {placeholder}
        </div>
      )}
    </div>
  );
}
