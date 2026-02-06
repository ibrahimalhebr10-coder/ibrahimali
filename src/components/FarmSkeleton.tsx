export default function FarmSkeleton() {
  return (
    <div className="relative group animate-pulse">
      <div className="relative bg-white rounded-2xl overflow-hidden shadow-md h-[420px]">
        <div className="relative h-56 bg-gradient-to-br from-emerald-100 to-emerald-50">
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>

        <div className="p-4 space-y-3">
          <div className="h-5 bg-emerald-100 rounded-lg w-3/4"></div>

          <div className="space-y-2">
            <div className="h-3 bg-emerald-50 rounded w-full"></div>
            <div className="h-3 bg-emerald-50 rounded w-5/6"></div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <div className="h-4 w-4 bg-emerald-100 rounded"></div>
            <div className="h-3 bg-emerald-50 rounded w-32"></div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="space-y-1">
              <div className="h-3 bg-emerald-50 rounded w-20"></div>
              <div className="h-6 bg-emerald-100 rounded w-24"></div>
            </div>
            <div className="space-y-1">
              <div className="h-3 bg-emerald-50 rounded w-20"></div>
              <div className="h-6 bg-emerald-100 rounded w-16"></div>
            </div>
          </div>

          <div className="pt-2">
            <div className="h-11 bg-gradient-to-r from-emerald-100 to-emerald-50 rounded-xl w-full"></div>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shimmer"></div>
    </div>
  );
}
