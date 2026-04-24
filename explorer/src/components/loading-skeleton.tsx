import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function StatCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {Array(4).fill(0).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <Skeleton className="h-4 w-[100px] mb-4" />
            <Skeleton className="h-8 w-[120px]" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="rounded-md border animate-in-fade opacity-80 cursor-wait">
      <div className="h-12 border-b bg-muted/40" />
      <div className="space-y-4 p-4">
        {Array(10).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-6 w-full" />
        ))}
      </div>
    </div>
  );
}

export function DetailCardSkeleton() {
  return (
    <Card className="animate-in-fade bg-card p-6 opacity-80 cursor-wait">
      <div className="space-y-6">
        {Array(6).fill(0).map((_, i) => (
          <div key={i} className="flex gap-4 items-center">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-full max-w-md" />
          </div>
        ))}
      </div>
    </Card>
  );
}
