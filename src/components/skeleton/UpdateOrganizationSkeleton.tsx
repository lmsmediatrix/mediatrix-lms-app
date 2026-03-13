import { FaAngleLeft } from "react-icons/fa";
import Button from "../common/Button";
import { useNavigate } from "react-router-dom";

export default function UpdateOrganizationSkeleton() {
    const navigate = useNavigate();
  return (
    <div className="max-w-6xl mx-auto pt-8">
            <Button
              variant="link"
              className="flex items-center gap-2"
              onClick={() => navigate(-1)}
            >
              <FaAngleLeft /> Go back
            </Button>
            <div className="pt-4 md:p-6 max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="animate-pulse">
                  {/* Header */}
                  <div className="flex justify-between items-center mb-6">
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-10 bg-gray-200 rounded w-24"></div>
                  </div>
      
                  {/* Background Upload */}
                  <div className="relative mb-6">
                    <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-48 bg-gray-200 rounded-lg"></div>
                    {/* Logo Placeholder */}
                    <div className="absolute top-[78px] md:top-[90px] left-4 md:left-10 w-28 h-28 bg-gray-200 rounded-full"></div>
                  </div>
      
                  {/* Organization Name and Code */}
                  <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="md:col-span-2">
                      <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                    <div className="md:col-span-1">
                      <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                  </div>
      
                  {/* Description and Organization Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="md:col-span-2">
                      <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-32 bg-gray-200 rounded"></div>
                    </div>
                    <div>
                      <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                  </div>
      
                  {/* Branding Section */}
                  <div className="mt-8 border-t pt-6">
                    <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
      
                    {/* Brand Colors */}
                    <div className="mb-6">
                      <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        <div>
                          <div className="h-4 bg-gray-200 rounded w-1/2 mb-1"></div>
                          <div className="h-10 bg-gray-200 rounded"></div>
                        </div>
                        <div>
                          <div className="h-4 bg-gray-200 rounded w-1/2 mb-1"></div>
                          <div className="h-10 bg-gray-200 rounded"></div>
                        </div>
                        <div>
                          <div className="h-4 bg-gray-200 rounded w-1/2 mb-1"></div>
                          <div className="h-10 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    </div>
      
                    {/* UI Colors */}
                    <div>
                      <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        <div>
                          <div className="h-4 bg-gray-200 rounded w-1/2 mb-1"></div>
                          <div className="h-10 bg-gray-200 rounded"></div>
                        </div>
                        <div>
                          <div className="h-4 bg-gray-200 rounded w-1/2 mb-1"></div>
                          <div className="h-10 bg-gray-200 rounded"></div>
                        </div>
                        <div>
                          <div className="h-4 bg-gray-200 rounded w-1/2 mb-1"></div>
                          <div className="h-10 bg-gray-200 rounded"></div>
                        </div>
                        <div>
                          <div className="h-4 bg-gray-200 rounded w-1/2 mb-1"></div>
                          <div className="h-10 bg-gray-200 rounded"></div>
                        </div>
                        <div>
                          <div className="h-4 bg-gray-200 rounded w-1/2 mb-1"></div>
                          <div className="h-10 bg-gray-200 rounded"></div>
                        </div>
                        <div>
                          <div className="h-4 bg-gray-200 rounded w-1/2 mb-1"></div>
                          <div className="h-10 bg-gray-200 rounded"></div>
                        </div>
                        <div>
                          <div className="h-4 bg-gray-200 rounded w-1/2 mb-1"></div>
                          <div className="h-10 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    </div>
                  </div>
      
                  {/* Danger Zone */}
                  <div className="mt-12 border-2 border-dashed border-gray-200 rounded-lg p-4 sm:p-6">
                    <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <div className="h-5 bg-gray-200 rounded w-1/2 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </div>
                      <div className="h-10 bg-gray-200 rounded w-full sm:w-40"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
  )
}
