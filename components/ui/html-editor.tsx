"use client";

import {
  useEditor,
  EditorContent,
  useEditorState,
  type Editor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyleKit } from "@tiptap/extension-text-style";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  HardBreakWithInlineStyles,
  ParagraphWithInlineStyles,
} from "@/lib/tiptap-preserve-inline-styles";
import { FontWeight } from "@/lib/tiptap-font-weight";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link2, Unlink } from "lucide-react";

const FONT_SIZE_UNSET = "__fs_default__";
const FONT_SIZE_PRESETS = [
  "10px",
  "11px",
  "12px",
  "13px",
  "14px",
  "15px",
  "16px",
  "18px",
  "20px",
  "24px",
  "28px",
  "32px",
  "36px",
] as const;

const FONT_WEIGHT_UNSET = "__fw_default__";
const FONT_WEIGHT_PRESETS: { value: string; label: string }[] = [
  { value: "400", label: "標準" },
  { value: "500", label: "中" },
  { value: "600", label: "半太" },
  { value: "700", label: "太" },
  { value: "bold", label: "bold" },
];

/** Normalize CSS color to #rrggbb for `<input type="color">`. */
function colorToHexInputValue(cssColor: string | null | undefined): string {
  if (!cssColor?.trim()) return "#000000";
  const c = cssColor.trim();
  if (/^#[0-9a-f]{6}$/i.test(c)) return c;
  if (/^#[0-9a-f]{3}$/i.test(c)) {
    const r = c[1];
    const g = c[2];
    const b = c[3];
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  if (typeof document === "undefined") return "#000000";
  const el = document.createElement("div");
  el.style.color = c;
  document.body.appendChild(el);
  const rgb = getComputedStyle(el).color;
  el.remove();
  const rgbMatch = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(rgb);
  if (!rgbMatch) return "#000000";
  return `#${[rgbMatch[1], rgbMatch[2], rgbMatch[3]]
    .map((x) => Number(x).toString(16).padStart(2, "0"))
    .join("")}`;
}

function stripHtml(html: string): string {
  if (typeof document === "undefined") {
    return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  }
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

interface HtmlEditorProps {
  value: string;
  onChange: (html: string, plainText?: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

function MenuBar({ editor }: { editor: Editor | null }) {
  const [linkPanelOpen, setLinkPanelOpen] = useState(false);
  const [linkHref, setLinkHref] = useState("");

  const textStyleAttrs = useEditorState({
    editor,
    selector: (snap) => {
      const ed = snap.editor;
      if (!ed) {
        return {
          color: null as string | null,
          fontSize: null as string | null,
          fontWeight: null as string | null,
        };
      }
      const a = ed.getAttributes("textStyle") as {
        color?: string | null;
        fontSize?: string | null;
        fontWeight?: string | null;
      };
      return {
        color: a.color ?? null,
        fontSize: a.fontSize ?? null,
        fontWeight: a.fontWeight ?? null,
      };
    },
  });

  if (!editor) return null;

  const colorInputValue = colorToHexInputValue(textStyleAttrs?.color);

  const currentFontSize = textStyleAttrs?.fontSize ?? null;
  const fontSizeSelectValue = currentFontSize ?? FONT_SIZE_UNSET;
  const fontSizeItems =
    currentFontSize &&
    !(FONT_SIZE_PRESETS as readonly string[]).includes(currentFontSize)
      ? [currentFontSize, ...FONT_SIZE_PRESETS]
      : [...FONT_SIZE_PRESETS];

  const currentFontWeight = textStyleAttrs?.fontWeight ?? null;
  const presetWeightValues = FONT_WEIGHT_PRESETS.map((p) => p.value);
  const fontWeightSelectValue =
    currentFontWeight &&
    !presetWeightValues.includes(currentFontWeight)
      ? currentFontWeight
      : currentFontWeight ?? FONT_WEIGHT_UNSET;
  const fontWeightItems =
    currentFontWeight && !presetWeightValues.includes(currentFontWeight)
      ? [
          { value: currentFontWeight, label: currentFontWeight },
          ...FONT_WEIGHT_PRESETS,
        ]
      : FONT_WEIGHT_PRESETS;

  const openLinkPanel = () => {
    const href = (editor.getAttributes("link").href as string | undefined) ?? "";
    setLinkHref(href);
    setLinkPanelOpen(true);
  };

  const applyLink = () => {
    const trimmed = linkHref.trim();
    if (!trimmed) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().setLink({ href: trimmed }).run();
    }
    setLinkPanelOpen(false);
  };

  const removeLink = () => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setLinkPanelOpen(false);
    setLinkHref("");
  };

  return (
    <div className="border-b">
      <div className="flex flex-wrap items-center gap-1 p-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`rounded px-2 py-1 text-sm ${editor.isActive("bold") ? "bg-muted" : ""}`}
          title="太字"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`rounded px-2 py-1 text-sm ${editor.isActive("italic") ? "bg-muted" : ""}`}
          title="斜体"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`rounded px-2 py-1 text-sm ${editor.isActive("bulletList") ? "bg-muted" : ""}`}
          title="箇条書き"
        >
          •
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`rounded px-2 py-1 text-sm ${editor.isActive("orderedList") ? "bg-muted" : ""}`}
          title="番号付きリスト"
        >
          1.
        </button>
        <span
          className="mx-0.5 hidden h-6 w-px shrink-0 bg-border sm:block"
          aria-hidden
        />
        <Select
          value={fontSizeSelectValue}
          onValueChange={(v) => {
            if (v === FONT_SIZE_UNSET) {
              editor.chain().focus().unsetFontSize().run();
            } else {
              editor.chain().focus().setFontSize(v).run();
            }
          }}
        >
          <SelectTrigger size="sm" className="h-8 w-[104px]" title="フォントサイズ">
            <SelectValue placeholder="サイズ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={FONT_SIZE_UNSET}>サイズ（既定）</SelectItem>
            {fontSizeItems.map((px) => (
              <SelectItem key={px} value={px}>
                {px}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={fontWeightSelectValue}
          onValueChange={(v) => {
            if (v === FONT_WEIGHT_UNSET) {
              editor.chain().focus().unsetFontWeight().run();
            } else {
              editor.chain().focus().setFontWeight(v).run();
            }
          }}
        >
          <SelectTrigger size="sm" className="h-8 w-[108px]" title="フォントの太さ">
            <SelectValue placeholder="太さ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={FONT_WEIGHT_UNSET}>太さ（既定）</SelectItem>
            {fontWeightItems.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span
          className="mx-0.5 hidden h-6 w-px shrink-0 bg-border sm:block"
          aria-hidden
        />
        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
          <span className="whitespace-nowrap">文字色</span>
          <input
            type="color"
            className="h-8 w-10 cursor-pointer overflow-hidden rounded border bg-background p-0.5"
            value={colorInputValue}
            onChange={(e) =>
              editor.chain().focus().setColor(e.target.value).run()
            }
            title="文字色"
          />
        </label>
        <button
          type="button"
          onClick={() => editor.chain().focus().unsetColor().run()}
          className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
          title="文字色をリセット"
        >
          色リセット
        </button>
        <span
          className="mx-0.5 hidden h-6 w-px shrink-0 bg-border sm:block"
          aria-hidden
        />
        <Button
          type="button"
          variant={editor.isActive("link") ? "secondary" : "outline"}
          size="sm"
          className="h-8 gap-1 px-2"
          onClick={openLinkPanel}
          title="ハイパーリンク"
        >
          <Link2 className="size-3.5" />
          リンク
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1 px-2"
          onClick={() => editor.chain().focus().unsetLink().run()}
          disabled={!editor.isActive("link")}
          title="リンク解除"
        >
          <Unlink className="size-3.5" />
        </Button>
      </div>
      {linkPanelOpen ? (
        <div className="flex flex-wrap items-center gap-2 border-t bg-muted/30 p-2">
          <Input
            type="url"
            value={linkHref}
            onChange={(e) => setLinkHref(e.target.value)}
            placeholder="https://example.com"
            className="max-w-md min-w-[200px] flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyLink();
              }
            }}
          />
          <Button type="button" size="sm" onClick={applyLink}>
            適用
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={removeLink}>
            解除
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setLinkPanelOpen(false)}
          >
            閉じる
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function HtmlEditor({
  value,
  onChange,
  placeholder = "Enter content...",
  className,
  minHeight = "120px",
}: HtmlEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: false,
        hardBreak: false,
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: {
            class: "text-primary underline underline-offset-2",
            rel: "noopener noreferrer",
            target: "_blank",
          },
        },
      }),
      ParagraphWithInlineStyles,
      HardBreakWithInlineStyles,
      TextStyleKit.configure({
        backgroundColor: false,
        lineHeight: false,
      }),
      FontWeight,
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-[80px] p-3 outline-none focus:outline-none text-sm [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:ml-4 [&_ol]:ml-4 [&_p]:mb-2",
      },
      handleDOMEvents: {
        blur: (view) => {
          const html = view.dom.innerHTML;
          onChange(html, stripHtml(html));
        },
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  const handleUpdate = useCallback(() => {
    if (editor) {
      const html = editor.getHTML();
      onChange(html, stripHtml(html));
    }
  }, [editor, onChange]);

  useEffect(() => {
    if (!editor) return;
    editor.on("update", handleUpdate);
    return () => {
      editor.off("update", handleUpdate);
    };
  }, [editor, handleUpdate]);

  return (
    <div
      className={cn(
        "rounded-md border bg-background overflow-hidden",
        className
      )}
    >
      <MenuBar editor={editor} />
      <div style={{ minHeight }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
