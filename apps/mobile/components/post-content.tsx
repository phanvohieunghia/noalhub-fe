import React, { createContext, useContext } from "react";
import { Image, Text, View } from "react-native";

import type { BlogBlockNode, BlogDoc, BlogInlineNode } from "@noalhub/api/blog";

/** Body text size; `lg` is for content that is the whole point of a screen, like a quiz question. */
type ContentSize = "base" | "lg";

const PARAGRAPH_CLASSES: Record<ContentSize, string> = {
  base: "text-base leading-relaxed",
  lg: "text-xl font-medium leading-relaxed",
};

const SizeContext = createContext<ContentSize>("base");

/** Native JSON AST Renderer */
export function NativePostContent({ doc, size = "base" }: { doc: BlogDoc; size?: ContentSize }) {
  if (!doc || !Array.isArray(doc.content)) {
    return null;
  }

  return (
    <SizeContext.Provider value={size}>
      <View className="gap-3">
        {doc.content.map((block, index) => (
          <NativeBlock key={index} block={block} />
        ))}
      </View>
    </SizeContext.Provider>
  );
}

function NativeBlock({ block }: { block: BlogBlockNode }) {
  const size = useContext(SizeContext);
  switch (block.type) {
    case "paragraph":
      return (
        <Text className={`text-foreground ${PARAGRAPH_CLASSES[size]}`}>
          {block.content?.map((inline, i) => (
            <NativeInline key={i} inline={inline} />
          ))}
        </Text>
      );
    case "heading":
      return (
        <Text
          className={`font-bold text-foreground mt-2 ${
            block.attrs.level === 2 ? "text-xl" : "text-lg"
          }`}
        >
          {block.content?.map((inline, i) => (
            <NativeInline key={i} inline={inline} />
          ))}
        </Text>
      );
    case "blockquote":
      return (
        <View className="rounded-r-lg border-l-4 border-primary bg-primary/5 pl-3 py-2 my-2">
          {block.content?.map((b, i) => (
            <NativeBlock key={i} block={b} />
          ))}
        </View>
      );
    case "codeBlock":
      return (
        <View className="rounded-xl border border-border bg-muted/70 p-3 my-2">
          <Text className="font-mono text-xs text-foreground">
            {block.content?.map((inline) => ("text" in inline ? inline.text : "")).join("")}
          </Text>
        </View>
      );
    case "bulletList":
      return (
        <View className="pl-2 gap-1.5 my-1">
          {block.content?.map((item, i) => (
            <View key={i} className="flex-row items-start">
              <Text className="text-primary mr-2 text-base">•</Text>
              <View className="flex-1">
                {item.content?.map((b, j) => (
                  <NativeBlock key={j} block={b} />
                ))}
              </View>
            </View>
          ))}
        </View>
      );
    case "orderedList":
      return (
        <View className="pl-2 gap-1.5 my-1">
          {block.content?.map((item, i) => (
            <View key={i} className="flex-row items-start">
              <Text className="text-primary mr-2 text-sm font-semibold">
                {i + 1}.
              </Text>
              <View className="flex-1">
                {item.content?.map((b, j) => (
                  <NativeBlock key={j} block={b} />
                ))}
              </View>
            </View>
          ))}
        </View>
      );
    case "image":
      return (
        <Image
          source={{ uri: block.attrs.src }}
          className="h-48 w-full rounded-xl bg-muted my-2"
          resizeMode="cover"
        />
      );
    case "horizontalRule":
      return <View className="h-px bg-border my-4" />;
    default:
      return null;
  }
}

function NativeInline({ inline }: { inline: BlogInlineNode }) {
  if (inline.type === "hardBreak") {
    return <Text>{"\n"}</Text>;
  }

  const marks = inline.marks ?? [];
  const isBold = marks.some((m) => m.type === "bold");
  const isItalic = marks.some((m) => m.type === "italic");
  const isCode = marks.some((m) => m.type === "code");
  const isLink = marks.some((m) => m.type === "link");

  let textStyle = "";
  if (isBold) textStyle += " font-bold";
  if (isItalic) textStyle += " italic";
  if (isCode) textStyle += " font-mono bg-muted/60 px-1 rounded";
  if (isLink) textStyle += " text-primary underline";

  return <Text className={textStyle}>{inline.text}</Text>;
}
