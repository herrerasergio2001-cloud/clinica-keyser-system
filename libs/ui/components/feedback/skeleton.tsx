'use client';

export function LoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-12 animate-pulse rounded-lg bg-gradient-to-r from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-800"
        />
      ))}
    </div>
  );
}
