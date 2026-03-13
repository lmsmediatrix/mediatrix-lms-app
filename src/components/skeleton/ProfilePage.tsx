import { useAuth } from "../../context/AuthContext";

export default function ProfilePageSkeleton() {
  const { currentUser } = useAuth();
  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 animate-pulse">
      {/* Header Section */}
      <div className="flex justify-between items-center pb-6 sm:pb-8 sm:space-y-0">
        <div className="h-6 sm:h-8 w-40 sm:w-48 bg-gray-300 rounded"></div>
        <div className="h-6 sm:h-8 w-6 sm:w-8 bg-gray-300 rounded-full"></div>
      </div>

      {/* Main Profile Section */}
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="border rounded-xl p-4 sm:p-6 space-y-6 sm:space-y-8 bg-white">
          {/* Avatar and Info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="w-24 h-24 sm:w-36 sm:h-36 bg-gray-300 rounded-full"></div>
            <div className="flex flex-col sm:flex-row justify-between flex-1 w-full sm:w-auto">
              <div className="flex-1 pt-2 space-y-3 text-center sm:text-left">
                <div className="h-5 sm:h-6 w-32 sm:w-40 bg-gray-300 rounded"></div>
                <div className="h-4 w-48 sm:w-64 bg-gray-300 rounded"></div>
                <div className="h-4 w-40 sm:w-48 bg-gray-300 rounded"></div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <div className="h-5 sm:h-6 w-16 sm:w-20 bg-gray-300 rounded"></div>
                  <div className="h-5 sm:h-6 w-20 sm:w-24 bg-gray-300 rounded"></div>
                  <div className="h-5 sm:h-6 w-12 sm:w-16 bg-gray-300 rounded"></div>
                </div>
              </div>
              <div className="mt-4 sm:mt-0 sm:ml-2 h-5 sm:h-6 w-20 sm:w-24 bg-gray-300 rounded-full"></div>
            </div>
          </div>

          {/* Bio Section */}
          <div>
            <div className="h-5 sm:h-6 w-16 sm:w-20 bg-gray-300 rounded mb-2"></div>
            <div className="h-16 sm:h-20 w-full bg-gray-300 rounded-lg"></div>
          </div>
        </div>

        {/* Qualifications and Social Links Section */}
        {currentUser?.user.role === "instructor" && (
          <div className="bg-gray-100 rounded-xl p-4 sm:p-6 border space-y-6 sm:space-y-8">
            {/* Qualifications */}
            <div>
              <div className="h-5 sm:h-6 w-28 sm:w-32 bg-gray-300 rounded mb-2"></div>
              <ul className="space-y-2 pl-5 text-sm sm:text-base">
                <li className="h-4 w-40 sm:w-48 bg-gray-300 rounded"></li>
                <li className="h-4 w-48 sm:w-56 bg-gray-300 rounded"></li>
                <li className="h-4 w-32 sm:w-40 bg-gray-300 rounded"></li>
              </ul>
            </div>

            {/* Social Links */}
            <div>
              <div className="h-5 sm:h-6 w-28 sm:w-32 bg-gray-300 rounded mb-2"></div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="h-5 sm:h-6 w-5 sm:w-6 bg-gray-300 rounded-full"></div>
                  <div className="h-4 w-48 sm:w-64 bg-gray-300 rounded"></div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-5 sm:h-6 w-5 sm:w-6 bg-gray-300 rounded-full"></div>
                  <div className="h-4 w-40 sm:w-56 bg-gray-300 rounded"></div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-5 sm:h-6 w-5 sm:w-6 bg-gray-300 rounded-full"></div>
                  <div className="h-4 w-32 sm:w-48 bg-gray-300 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}