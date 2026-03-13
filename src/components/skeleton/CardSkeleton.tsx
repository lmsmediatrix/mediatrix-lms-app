// CardSkeleton.jsx
export default function CardSkeleton() {
  return (
    <div className="bg-white rounded-lg p-4 shadow flex-1 animate-pulse border">
      <div className="h-[180px] bg-gray-200 rounded-lg mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
      </div>
    </div>
  );
}