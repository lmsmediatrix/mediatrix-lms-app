const TaskSkeleton = () => {
  return (
    <>
      {[1, 2, 3].map((index) => (
        <div
          key={index}
          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg animate-pulse"
        >
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="space-x-2">
            <button className="px-3 py-1 text-sm bg-gray-200 text-transparent rounded-md">
              Edit
            </button>
            <button className="px-3 py-1 text-sm bg-gray-200 text-transparent rounded-md">
              Delete
            </button>
          </div>
        </div>
      ))}
    </>
  );
};

export default TaskSkeleton;
