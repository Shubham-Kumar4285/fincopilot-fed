/** Loading placeholder shaped like a table. */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col" role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="grid h-14 grid-cols-4 items-center gap-6 border-b border-line px-4 last:border-b-0">
          {[0, 1, 2, 3].map((cell) => (
            <i key={cell} className="h-2.5 animate-pulse rounded-sm bg-line motion-reduce:animate-none" />
          ))}
        </div>
      ))}
    </div>
  );
}
