// src/lib/utils.js

import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes
 * Handles conflicts intelligently (e.g., 'px-2 px-4' becomes 'px-4')
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}