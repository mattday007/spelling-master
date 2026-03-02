"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "success" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  circular?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-blue text-white shadow-lg hover:shadow-xl",
  secondary: "bg-white text-foreground border border-gray-200 shadow-md hover:shadow-lg",
  success: "bg-green text-white shadow-lg hover:shadow-xl",
  danger: "bg-coral text-white shadow-lg hover:shadow-xl",
  ghost: "bg-transparent text-foreground hover:bg-white/50",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
  icon: "w-14 h-14 p-0 flex items-center justify-center",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", circular = false, className = "", children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        className={`
          font-bold no-select transition-colors duration-200
          ${circular ? "rounded-full" : "rounded-full"}
          ${VARIANT_CLASSES[variant]}
          ${SIZE_CLASSES[size]}
          disabled:opacity-50 disabled:pointer-events-none
          ${className}
        `}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
