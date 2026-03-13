export default function VoucherSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[...Array(3)].map((_, index) => (
        <div
          key={index}
          className="relative w-full sm:w-[600px] mx-auto bg-gray-200 rounded-lg p-4 sm:p-6 shadow-lg flex flex-col justify-between overflow-hidden animate-pulse"
        >
          <div className="absolute top-2 right-2 h-6 w-6 bg-gray-300 rounded-full" />
          <div>
            <div className="h-6 w-48 bg-gray-300 rounded mb-2" />
            <div className="h-4 w-32 bg-gray-300 rounded mb-2" />
            <div className="h-4 w-full sm:w-80 bg-gray-300 rounded" />
          </div>
          <div className="mt-4 sm:mt-6">
            <div className="h-3 w-40 bg-gray-300 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
