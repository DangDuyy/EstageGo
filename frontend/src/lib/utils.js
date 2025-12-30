import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatLastActive(isoString) {
  if (!isoString) return 'offline'
  const ts = new Date(isoString).getTime()
  if (Number.isNaN(ts)) return 'offline'
  const diff = Date.now() - ts
  if (diff < 60_000) return 'online'
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60) return `${minutes} phút trước`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.floor(hours / 24)
  return `${days} ngày trước`
}
