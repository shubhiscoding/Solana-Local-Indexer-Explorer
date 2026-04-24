import { Badge } from "@/components/ui/badge";

export function StatusBadge({ success }: { success: boolean }) {
  if (success) {
    return (
      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-mono">
        Success
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 font-mono">
      Failed
    </Badge>
  );
}
