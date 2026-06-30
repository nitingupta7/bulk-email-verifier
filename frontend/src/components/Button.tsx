import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> & {
  variant?: "primary" | "secondary" | "ghost";
};

const variants = {
  primary: "bg-ink-900 text-white hover:bg-ink-700",
  secondary: "border border-ink-300 bg-white text-ink-900 hover:bg-ink-50",
  ghost: "text-ink-700 hover:bg-ink-100"
};

export const Button = ({ children, className = "", variant = "primary", ...props }: ButtonProps) => {
  return (
    <button
      className={[
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
};
