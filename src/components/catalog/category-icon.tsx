"use client";

import { CircuitBoard, Cpu, Gpu, HardDrive, Laptop, MemoryStick, Plug } from "lucide-react";
import type { Category } from "@/lib/validations/component";

/**
 * Category glyphs.
 *
 * Purely an aid to scanning — a tab strip of seven text labels is slower to
 * navigate than one where each has a distinct silhouette. The label always
 * stays beside the icon, so the icon never has to carry the meaning alone.
 */
const ICONS = {
  cpu: Cpu,
  gpu: Gpu,
  ram: MemoryStick,
  storage: HardDrive,
  motherboard: CircuitBoard,
  psu: Plug,
  laptop: Laptop,
} as const;

export function CategoryIcon({
  category,
  className = "size-3.5",
}: {
  category: Category;
  className?: string;
}) {
  const Icon = ICONS[category];
  return <Icon className={className} aria-hidden />;
}
