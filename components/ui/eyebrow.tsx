import { cn } from "@/lib/utils";

interface EyebrowProps extends React.HTMLAttributes<HTMLSpanElement> {
  as?: "span" | "p" | "div" | "h2";
  size?: "xs" | "sm";
}

/**
 * Notion-calm section label: bold uppercase letter-spaced muted text.
 * Used above titles, in card corners, and as section headings.
 */
export function Eyebrow({
  as: Component = "span",
  size = "xs",
  className,
  children,
  ...rest
}: EyebrowProps) {
  const sizeClass =
    size === "xs"
      ? "text-[0.6875rem] tracking-widest"
      : "text-xs tracking-wider";

  return (
    <Component
      className={cn(
        "font-bold uppercase text-muted-foreground",
        sizeClass,
        className,
      )}
      {...rest}
    >
      {children}
    </Component>
  );
}
