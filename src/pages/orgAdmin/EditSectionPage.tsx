import { FaEdit, FaTrash } from "react-icons/fa";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import DeleteSectionModal from "../../components/orgAdmin/DeleteSectionModal";
import Accordion from "../../components/common/Accordion";
import { IoArrowBack } from "react-icons/io5";
import { ISection, IStudent } from "../../types/interfaces";
import { useSearchSectionByCode } from "../../hooks/useSection";
import EditSectionSkeleton from "../../components/skeleton/EditSectionSkeleton";
import { convert24to12Format } from "../../lib/dateUtils";
import { getTerm } from "../../lib/utils";
import UpsertSectionModal from "../../components/orgAdmin/UpsertSectionModal";
import SectionStudents from "../../components/orgAdmin/SectionStudents";

interface Pagination {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface PaginatedStudents {
  data: IStudent[];
  pagination: Pagination;
}

interface SectionWithPaginatedStudents extends Omit<ISection, "students"> {
  students?: PaginatedStudents;
  totalStudent?: number;
}

const SectionEditPage = () => {
  const { sectionCode, orgCode } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const orgType = currentUser?.user?.organization?.type;
  const [searchParams, setSearchParams] = useSearchParams();
  const modal = searchParams.get("modal");
  const { data, isLoading } = useSearchSectionByCode(sectionCode || "");
  const learnerTerm = getTerm("learner", orgType);

  const section = data?.data as SectionWithPaginatedStudents;

  if (isLoading) {
    return <EditSectionSkeleton />;
  }

  return (
    <div className="pt-16 pb-6 px-4 sm:px-6 lg:py-8">
      {/* Back Navigation */}
      <div className="mb-4 sm:mb-6">
        <button
          onClick={() => navigate(`/${orgCode}/admin/section`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <IoArrowBack className="text-lg sm:text-xl" />
          <span className="text-sm sm:text-base">Back to Sections</span>
        </button>
      </div>

      <div>
        <h1 className="text-3xl font-bold mb-1">{section.name}</h1>
      </div>

      {/* Main Content */}
      {section && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Cover Photo Section */}
          <div className="relative h-[200px] bg-gray-100">
            {section.course?.thumbnail && (
              <img
                src={section.course.thumbnail}
                alt="Course thumbnail"
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Profile Section */}
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 relative">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              {/* Instructor Info */}
              <div className="flex-1 flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                  {section.instructor?.avatar ? (
                    <img
                      src={section.instructor.avatar}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 font-medium text-lg sm:text-xl">
                      {section.instructor
                        ? `${section.instructor.firstName[0]}${section.instructor.lastName[0]}`
                        : "?"}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">
                    Instructor
                  </p>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-1 break-words">
                    {section.instructor
                      ? `${section.instructor.firstName} ${section.instructor.lastName}`
                      : "No instructor assigned"}
                  </h2>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-gray-600">
                    <span className="px-2 sm:px-3 py-1 bg-gray-100 rounded-full text-xs sm:text-sm font-medium w-fit">
                      {section.instructor?.email}
                    </span>
                    <span className="text-sm sm:text-base break-words">
                      {section.course?.title}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() =>
                    setSearchParams({ modal: "edit-section", id: section._id })
                  }
                  className="bg-primary text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-primary/90 flex items-center gap-2 text-sm sm:text-base flex-1 sm:flex-initial justify-center"
                >
                  <FaEdit className="text-sm" />
                  <span className="hidden sm:inline">Edit Section</span>
                  <span className="sm:hidden">Edit</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section Information */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 lg:gap-8 p-4 sm:p-6 lg:p-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold mb-4">
                  Section Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 sm:p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                    <div>
                      <h3 className="text-gray-600 mb-1 text-sm sm:text-base">
                        Section Code
                      </h3>
                      <p className="font-semibold text-base sm:text-lg break-words">
                        {section.code}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-gray-600 mb-1 text-sm sm:text-base">
                        Section Name
                      </h3>
                      <p className="font-semibold text-base sm:text-lg break-words">
                        {section.name}
                      </p>
                    </div>
                  </div>

                  <h3 className="text-gray-600 mt-6 mb-4 text-sm sm:text-base">
                    Schedule Details
                  </h3>
                  <div className="space-y-4">
                    {section.schedule?.breakdown?.map(
                      (sched: any, index: number) => (
                        <div
                          key={index}
                          className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-8"
                        >
                          <div>
                            <p className="font-semibold text-sm sm:text-base">
                              {sched.day.toUpperCase()}
                            </p>
                          </div>
                          <div>
                            <p className="font-semibold text-sm sm:text-base break-words">
                              {sched.time.start && sched.time.end
                                ? `${convert24to12Format(
                                    sched.time.start
                                  )} - ${convert24to12Format(sched.time.end)}`
                                : "No time set"}
                            </p>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="order-first lg:order-last">
              <h3 className="text-lg sm:text-xl font-semibold mb-4">
                Quick Stats
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 sm:p-6 space-y-4">
                <div>
                  <p className="text-gray-600 text-sm sm:text-base">
                    {learnerTerm}s Enrolled
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold">
                    {section.totalStudent || 0}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm sm:text-base">Status</p>
                  <span
                    className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                      section.status === "upcoming"
                        ? "bg-yellow-100 text-yellow-800"
                        : section.status === "active"
                        ? "bg-green-100 text-green-800"
                        : section.status === "completed"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {section.status
                      ? section.status.charAt(0).toUpperCase() +
                        section.status.slice(1)
                      : "Unknown"}
                  </span>
                </div>
                <div>
                  <p className="text-gray-600 text-sm sm:text-base">
                    Schedule Date
                  </p>
                  <p className="font-medium text-sm sm:text-base break-words">
                    {section.schedule?.startDate && section.schedule?.endDate
                      ? `${new Date(
                          section.schedule.startDate
                        ).toLocaleDateString()} - ${new Date(
                          section.schedule.endDate
                        ).toLocaleDateString()}`
                      : "Not scheduled"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Students Section */}
          <SectionStudents />

          {/* Danger Zone */}
          <div className="p-4 sm:p-6 lg:p-8 border-t">
            <Accordion title="Danger Zone" defaultExpanded={false}>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h4 className="font-medium text-red-800 text-sm sm:text-base">
                      Delete Section
                    </h4>
                    <p className="text-xs sm:text-sm text-red-600">
                      This action cannot be undone.
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setSearchParams({
                        modal: "delete-section",
                        id: section._id,
                      })
                    }
                    className="bg-white border border-red-300 text-red-600 px-3 sm:px-4 py-2 rounded-lg hover:bg-red-50 flex items-center gap-2 text-sm sm:text-base justify-center w-full sm:w-auto"
                  >
                    <FaTrash className="text-sm" /> Delete Section
                  </button>
                </div>
              </div>
            </Accordion>
          </div>
        </div>
      )}

      {/* Edit Section Modal */}
      {modal === "edit-section" && (
        <UpsertSectionModal isOpen={true} onClose={() => setSearchParams({})} />
      )}

      {/* Delete Modal */}
      {modal === "delete-section" && (
        <DeleteSectionModal
          isOpen={true}
          onClose={() => setSearchParams({})}
          sectionId={section?._id || ""}
          sectionName={section?.name || ""}
        />
      )}
    </div>
  );
};

export default SectionEditPage;
