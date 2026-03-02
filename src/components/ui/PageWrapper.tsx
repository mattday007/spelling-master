"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function PageWrapper({ children }: { children: ReactNode }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="min-h-dvh flex flex-col items-center px-4 py-8 relative"
    >
      {children}
    </motion.main>
  );
}
