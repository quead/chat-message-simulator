import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes with clsx
 * Used throughout the app for conditional and dynamic styling
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
