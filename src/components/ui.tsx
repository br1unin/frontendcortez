import React from "react";

export function Button({
  className = "",
  variant = "default",
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-2xl font-medium transition active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none";
  const variants: Record<string, string> = {
    default: "bg-black text-white hover:opacity-90",
    ghost: "hover:bg-black/5",
    outline: "border border-black/10 hover:bg-black/5",
    danger: "bg-red-600 text-white hover:opacity-90",
  };
  const sizes: Record<string, string> = {
    sm: "h-9 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    lg: "h-11 px-5 text-base",
  };
  return (
    <button
      className={`${base} ${variants[variant] || variants.default} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    />
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { className?: string }) {
  const { className = "", ...rest } = props;
  return (
    <input
      className={`h-10 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-black/10 ${className}`}
      {...rest}
    />
  );
}

export function Card(props: React.HTMLAttributes<HTMLDivElement> & { className?: string }) {
  const { className = "", ...rest } = props;
  return <div className={`rounded-3xl border border-black/10 bg-white shadow-sm ${className}`} {...rest} />;
}

export function CardHeader(props: React.HTMLAttributes<HTMLDivElement> & { className?: string }) {
  const { className = "", ...rest } = props;
  return <div className={`p-5 ${className}`} {...rest} />;
}

export function CardTitle(props: React.HTMLAttributes<HTMLDivElement> & { className?: string }) {
  const { className = "", ...rest } = props;
  return <div className={`text-base font-semibold ${className}`} {...rest} />;
}

export function CardContent(props: React.HTMLAttributes<HTMLDivElement> & { className?: string }) {
  const { className = "", ...rest } = props;
  return <div className={`px-5 pb-5 ${className}`} {...rest} />;
}

export function Badge(props: React.HTMLAttributes<HTMLSpanElement> & { className?: string }) {
  const { className = "", ...rest } = props;
  return (
    <span
      className={`inline-flex items-center rounded-full bg-black/5 px-2.5 py-1 text-xs font-medium text-black ${className}`}
      {...rest}
    />
  );
}

export function Separator({ className = "" }: { className?: string }) {
  return <div className={`my-4 h-px w-full bg-black/10 ${className}`} />;
}
