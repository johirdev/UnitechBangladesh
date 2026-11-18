import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Stars({ value, size = 16, className }: { value: number; size?: number; className?: string }) {
  return (
    <div className={cn("flex gap-0.5", className)} aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} style={{ width: size, height: size }} className={n <= Math.round(value) ? "fill-brand text-brand" : "fill-gray-200 text-gray-200"} />
      ))}
    </div>
  );
}
