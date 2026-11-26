"use client";

import React from "react";
import Spinner from "./Spinner";

export interface ButtonLoadingProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  spinnerSize?: "sm" | "md";
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
}

export default function ButtonLoading({
  children,
  loading = false,
  loadingText,
  spinnerSize = "sm",
  disabled,
  className = "",
  variant,
  ...props
}: ButtonLoadingProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading ? "true" : "false"}
      className={`relative inline-flex items-center justify-center transition-all select-none ${
        loading ? "cursor-not-allowed opacity-80" : ""
      } ${className}`}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <Spinner size={spinnerSize} className="shrink-0" />
          <span>{loadingText || children}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
