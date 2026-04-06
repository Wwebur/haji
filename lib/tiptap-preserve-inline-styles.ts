import { HardBreak } from "@tiptap/extension-hard-break";
import { Paragraph } from "@tiptap/extension-paragraph";

const styleAttr = {
  default: null as string | null,
  parseHTML: (element: HTMLElement) => element.getAttribute("style"),
  renderHTML: (attributes: Record<string, unknown>) => {
    const style = attributes.style;
    if (!style || typeof style !== "string" || !style.trim()) return {};
    return { style };
  },
};

/**
 * Keeps `style` on `<p>` so pasted HTML (font-size, color, font-family, etc.) round-trips.
 */
export const ParagraphWithInlineStyles = Paragraph.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: styleAttr,
    };
  },
});

/**
 * Keeps `style` on `<br>` (common in legacy recruiter HTML).
 */
export const HardBreakWithInlineStyles = HardBreak.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: styleAttr,
    };
  },
});
