export default function AppLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Summary skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-surface-container-lowest rounded-3xl p-8 h-48" />
        <div className="bg-surface-container-high rounded-3xl p-8 h-48" />
      </div>
      {/* Chart skeleton */}
      <div className="bg-surface-container-lowest rounded-3xl p-8 h-64" />
      {/* List skeleton */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface-container-lowest rounded-3xl p-4 h-16" />
        ))}
      </div>
    </div>
  );
}
