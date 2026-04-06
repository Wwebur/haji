import { Extension } from "@tiptap/core";

export type FontWeightOptions = {
  types: string[];
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fontWeight: {
      setFontWeight: (fontWeight: string) => ReturnType;
      unsetFontWeight: () => ReturnType;
    };
  }
}

declare module "@tiptap/extension-text-style" {
  interface TextStyleAttributes {
    fontWeight?: string | null;
  }
}

/**
 * Adds `font-weight` to the TipTap `textStyle` mark (same pattern as FontSize).
 */
export const FontWeight = Extension.create<FontWeightOptions>({
  name: "fontWeight",

  addOptions() {
    return {
      types: ["textStyle"],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontWeight: {
            default: null,
            parseHTML: (element: HTMLElement) =>
              element.style.fontWeight?.trim() || null,
            renderHTML: (attributes: Record<string, unknown>) => {
              const w = attributes.fontWeight;
              if (!w || typeof w !== "string") return {};
              return { style: `font-weight: ${w}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontWeight:
        (fontWeight: string) =>
        ({ chain }) => {
          return chain().setMark("textStyle", { fontWeight }).run();
        },
      unsetFontWeight:
        () =>
        ({ chain }) => {
          return chain()
            .setMark("textStyle", { fontWeight: null })
            .removeEmptyTextStyle()
            .run();
        },
    };
  },
});
