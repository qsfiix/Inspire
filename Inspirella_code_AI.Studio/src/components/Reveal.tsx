import React from "react";
import { motion, useReducedMotion } from "motion/react";

/**
 * Fades + lifts its content in the first time it scrolls into view.
 * Used to give long pages (home, dashboard) a gentle "one section after
 * another" rhythm. Under prefers-reduced-motion it renders the content in
 * its final state immediately, with no motion at all.
 */
export default function Reveal({
  children,
  delay = 0,
  className = "",
  as = "div"
}: {
  // This project's React typings don't add `key` to function-component
  // props automatically, so it's declared here for list usage.
  key?: React.Key;
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li";
}) {
  const reduceMotion = useReducedMotion();
  const Tag = motion[as];

  if (reduceMotion) {
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Tag>
  );
}
