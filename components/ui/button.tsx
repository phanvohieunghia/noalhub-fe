type ButtonProps = React.ComponentPropsWithoutRef<"button"> & {
  variant?: "primary" | "outline";
};

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-foreground text-background hover:opacity-90",
    outline:
      "border border-black/15 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10",
  } as const;

  return (
    <button type={type} className={`${base} ${variants[variant]} ${className}`} {...props} />
  );
}
