import React from "react";
import { cssInterop } from "nativewind";
import { SvgXml, type XmlProps } from "react-native-svg";

import { ICON_DATA, type IconName } from "./icon-data.generated";

// Lets `className="text-foreground"` drive the SVG's `currentColor`, so icons
// take theme tokens like text does — no hex at the call site.
cssInterop(SvgXml, {
  className: { target: "style", nativeStyleToProp: { color: true } },
});

export type { IconName };

export type IconProps = Omit<XmlProps, "xml" | "width" | "height"> & {
  name: IconName;
  /** Width and height in dp. */
  size?: number;
  /** A text-color token, e.g. `text-foreground`; it becomes the stroke. */
  className?: string;
};

/**
 * Mobile counterpart of the web `Icon` (packages/ui/src/icons.tsx): lucide,
 * rendered offline from bundled data. Decorative by default — put the label on
 * the pressable around it, not here.
 */
export function Icon({ name, size = 20, className = "text-foreground", ...props }: IconProps) {
  const icon = ICON_DATA[name];
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${icon.width} ${icon.height}">${icon.body}</svg>`;

  return (
    <SvgXml
      xml={xml}
      width={size}
      height={size}
      className={className}
      accessibilityElementsHidden
      importantForAccessibility="no"
      {...props}
    />
  );
}
