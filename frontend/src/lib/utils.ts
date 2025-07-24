import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/* export const API_URL_BASE = `http://192.168.15.12:8001` */
/* export const API_URL_BASE = `http://172.20.10.4:8000` */
export const API_URL_BASE = `http://31.97.123.208:8000`
