import { Card, CardContent } from "@/components/ui/card";
import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export function StatCard({ label, value, icon: Icon, trend }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden group">
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div className="rounded-md bg-primary/10 p-2">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-2xl font-bold font-heading">{value}</div>
          {trend ? (
            <p className="text-xs text-muted-foreground">
              <span className={trend.isPositive ? "text-emerald-500" : "text-red-500"}>
                {trend.value}
              </span>{" "}
              from last epoch
            </p>
          ) : (
            <div className="h-4" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
