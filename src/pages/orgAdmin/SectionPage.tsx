import { FaPlus } from "react-icons/fa";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import {
  useAdminSections,
  useExportSectionToCsv,
} from "../../hooks/useSection";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getTerm } from "../../lib/utils";
import { exportToCSVUtil } from "../../lib/exportCsvUtils";
import ExportModal from "../../components/orgAdmin/ExportModal";
import TableEmptyState from "../../components/common/TableEmptyState";
import ActionMenuButton from "../../components/orgAdmin/ActionMenuButton";
import FilterDropdownButton from "../../components/orgAdmin/FilterDropdownButton";
import ResponsiveFilterButton from "../../components/orgAdmin/ResponsiveFilterButton";
import { ISection } from "../../types/interfaces";
import { useCoursesForDropdown } from "../../hooks/useCourse";
import { useInstructorsForDropdown } from "../../hooks/useInstructor";
import TableSkeletonClean from "../../components/skeleton/TableSkeletonClean";
import { useDebounce } from "../../hooks/useDebounce";

export default function SectionPage() {
  const { currentUser } = useAuth();
  const orgType = currentUser.user.organization.type;
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );

  const [selectedCourse, setSelectedCourse] = useState(
    searchParams.get("course") || ""
  );
  const [selectedInstructor, setSelectedInstructor] = useState(
    searchParams.get("instructor") || ""
  );
  const [archiveStatus, setArchiveStatus] = useState<"only" | "none">(
    (searchParams.get("archiveStatus") as "only" | "none") || "none"
  );
  const [skipLimit, setSkipLimit] = useState({
    skip: Number(searchParams.get("page") || "1") - 1,
    limit: 10,
  });
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const exportSection = useExportSectionToCsv();

  // Define dynamic terms
  const sectionTerm = getTerm("group", orgType);
  const sectionsTerm = getTerm("group", orgType, true);
  const learnerTerm = getTerm("learner", orgType);
  const instructorTerm = getTerm("instructor", orgType);
    const debouncedSearchTerm = useDebounce(searchTerm, 500);


  // Build filters array based on selected filters
  const filters = [];
  if (selectedCourse) {
    filters.push({ key: "course", value: selectedCourse });
  }
  if (selectedInstructor) {
    filters.push({ key: "instructor", value: selectedInstructor });
  }
  // Always include organization filter
  filters.push({
    key: "organizationId",
    value: currentUser.user.organization._id,
  });

  const { data, isLoading, isError } = useAdminSections({
    skip: skipLimit.skip,
    limit: skipLimit.limit,
    searchTerm: debouncedSearchTerm,
    filter:
      filters.length > 0
        ? filters[0]
        : { key: "organizationId", value: currentUser.user.organization._id },
    archiveStatus,
  });

  const { data: coursesData, isLoading: isLoadingCourses } =
    useCoursesForDropdown({
      organizationId: currentUser.user.organization._id,
    });

  const { data: instructorsData, isLoading: isLoadingInstructors } =
    useInstructorsForDropdown({
      organizationId: currentUser.user.organization._id,
    });

  const navigate = useNavigate();
  const { orgCode } = useParams();

  const handleSearchChange = (search: string) => {
    setSearchTerm(search);
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      if (search) {
        newParams.set("search", search);
      } else {
        newParams.delete("search");
      }
      return newParams;
    });
  };

  const handleCourseChange = (course: string) => {
    setSelectedCourse(course);
    setSearchParams((prev) => {
      if (course) {
        prev.set("course", course);
      } else {
        prev.delete("course");
      }
      return prev;
    });
  };

  const handleInstructorChange = (instructor: string) => {
    setSelectedInstructor(instructor);
    setSearchParams((prev) => {
      if (instructor) {
        prev.set("instructor", instructor);
      } else {
        prev.delete("instructor");
      }
      return prev;
    });
  };

  const handlePageChange = (newSkip: number) => {
    setSkipLimit((prev) => ({
      ...prev,
      skip: newSkip,
    }));
    setSearchParams((prev) => {
      prev.set("page", String(newSkip + 1));
      return prev;
    });
  };

  const tableColumns = [
    { key: "code", header: `${sectionTerm} Code`, width: "20%" },
    { key: "name", header: "Name", width: "20%" },
    { key: "instructor", header: instructorTerm, width: "20%" },
    { key: "course", header: "Course", width: "25%" },
    {
      key: "students",
      header: `Total ${learnerTerm}`,
      width: "15%",
    },
  ];

  // Skeleton configuration for sections
  const sectionTableColumns = [
    { width: "20%" }, // Section Code
    { width: "20%" }, // Name
    { width: "20%" }, // Instructor
    { width: "25%" }, // Course
    { width: "15%" }, // Total Students
  ];

  const exportToCSV = (type: "all" | "current") => {
    exportToCSVUtil({
      mutationFn: async (params) => {
        return await exportSection.mutateAsync(params);
      },
      mutationParams:
        type === "all"
          ? { limit: 1000 }
          : { limit: skipLimit.limit, skip: skipLimit.skip },
      filenamePrefix: "1bislms-sections",
      toastMessages: {
        pending: `Exporting ${type} data to CSV...`,
        success: `Successfully exported ${type} data to CSV`,
        error: `Failed to export ${type} data to CSV`,
      },
      onError: (error) => console.error("Export error:", error),
    });
  };

  const renderTableRows = () => {
    if (isError) {
      return (
        <tr className="border-b border-gray-200">
          <td colSpan={5} className="py-4 px-4 text-center text-gray-500">
            Error loading {sectionsTerm.toLowerCase()}
          </td>
        </tr>
      );
    }

    if (!data?.sections || data.sections.length === 0) {
      const isFiltered = Boolean(
        searchTerm ||
          selectedCourse ||
          selectedInstructor ||
          archiveStatus !== "none"
      );
      return (
        <TableEmptyState
          title={`Create Your First ${sectionTerm}`}
          description={`Start by creating a ${sectionTerm.toLowerCase()}. You'll need courses, ${instructorTerm.toLowerCase()}s, and ${learnerTerm.toLowerCase()}s first.`}
          primaryActionLabel={`Create ${sectionTerm}`}
          primaryActionPath={`/${orgCode}/admin/section/new`}
          colSpan={5}
          type="section"
          isFiltered={isFiltered}
        />
      );
    }

    return data.sections.map((section: ISection) => (
      <tr
        key={section._id}
        className={`border-b border-gray-200 hover:bg-gray-50 cursor-pointer ${
          archiveStatus === "only" ? "text-gray-500 line-through" : ""
        }`}
        onClick={() => navigate(`/${orgCode}/admin/section/${section.code}`)}
      >
        <td className="py-4 px-4">
          <span className="font-semibold">{section.code}</span>
        </td>
        <td className="py-4 px-4">
          <span>{section.name}</span>
        </td>
        <td className="py-4 px-4">
          {section.instructor && (
            <span>{`${section.instructor.firstName} ${section.instructor.lastName}`}</span>
          )}
        </td>
        <td className="py-4 px-4">
          {section.instructor && <span>{section.course?.title}</span>}
        </td>
        <td className="py-4 px-4">
          <div className="flex flex-col">
            <span>
              {section.totalStudent} {learnerTerm.toLowerCase()}
              {section.totalStudent !== 1 ? "s" : ""}
            </span>
            {section.maxStudents && (
              <span className="text-sm text-gray-500">
                Max: {section.maxStudents}
              </span>
            )}
          </div>
        </td>
      </tr>
    ));
  };

  return (
    <div className=" pt-14 pb-6 px-6 lg:p-6">
      <h1 className="text-3xl font-bold">{sectionsTerm}</h1>

      {/* Table Section */}
      <div className="flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
        {/* Search and Filter */}
        <div className="flex flex-col gap-3 md:flex-row md:flex-1 md:items-center md:gap-2 md:min-w-0">
          {/* Search Input and Mobile Filter Row */}
          <div className="flex gap-2 items-center flex-1 md:min-w-0">
            <input
              type="text"
              placeholder={`Search ${sectionsTerm.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="flex-1 md:max-w-[400px] px-4 py-2.5 h-[42px] border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-base md:text-sm"
            />

            {/* Mobile Filter Button - Next to search on mobile, hidden on tablet+ */}
            <div className="md:hidden">
              <ResponsiveFilterButton
                activeFiltersCount={
                  (selectedCourse ? 1 : 0) + (selectedInstructor ? 1 : 0)
                }
                filters={[
                  {
                    key: "course",
                    label: "Course",
                    value: selectedCourse,
                    options:
                      coursesData?.map((course: any) => ({
                        value: course._id,
                        label: course.title,
                      })) || [],
                    onChange: handleCourseChange,
                    loading: isLoadingCourses,
                    placeholder: "All Courses",
                  },
                  {
                    key: "instructor",
                    label: instructorTerm,
                    value: selectedInstructor,
                    options:
                      instructorsData?.map((instructor: any) => ({
                        value: instructor._id,
                        label: `${instructor.firstName} ${instructor.lastName}`,
                      })) || [],
                    onChange: handleInstructorChange,
                    loading: isLoadingInstructors,
                    placeholder: `All ${instructorTerm}s`,
                  },
                ]}
              />
            </div>
          </div>

          {/* Desktop Filter Buttons - Hidden on mobile & tablet */}
          <div className="hidden xl:flex gap-2 items-center flex-shrink-0">
            {/* Course Filter Button */}
            <FilterDropdownButton
              label="Course"
              value={selectedCourse}
              options={
                coursesData?.map((course: any) => ({
                  value: course._id,
                  label: course.title,
                })) || []
              }
              onChange={handleCourseChange}
              loading={isLoadingCourses}
              placeholder="All Courses"
            />

            {/* Instructor Filter Button */}
            <FilterDropdownButton
              label={instructorTerm}
              value={selectedInstructor}
              options={
                instructorsData?.map((instructor: any) => ({
                  value: instructor._id,
                  label: `${instructor.firstName} ${instructor.lastName}`,
                })) || []
              }
              onChange={handleInstructorChange}
              loading={isLoadingInstructors}
              placeholder={`All ${instructorTerm}s`}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-shrink-0">
          {/* Tablet Filter Button - Hidden on mobile and desktop */}
          <div className="hidden md:block xl:hidden">
            <ResponsiveFilterButton
              activeFiltersCount={
                (selectedCourse ? 1 : 0) + (selectedInstructor ? 1 : 0)
              }
              filters={[
                {
                  key: "course",
                  label: "Course",
                  value: selectedCourse,
                  options:
                    coursesData?.map((course: any) => ({
                      value: course._id,
                      label: course.title,
                    })) || [],
                  onChange: handleCourseChange,
                  loading: isLoadingCourses,
                  placeholder: "All Courses",
                },
                {
                  key: "instructor",
                  label: instructorTerm,
                  value: selectedInstructor,
                  options:
                    instructorsData?.map((instructor: any) => ({
                      value: instructor._id,
                      label: `${instructor.firstName} ${instructor.lastName}`,
                    })) || [],
                  onChange: handleInstructorChange,
                  loading: isLoadingInstructors,
                  placeholder: `All ${instructorTerm}s`,
                },
              ]}
            />
          </div>
          <Button
            variant="primary"
            onClick={() => navigate(`/${orgCode}/admin/section/new`)}
            className="whitespace-nowrap text-sm flex-1 md:flex-initial"
          >
            <FaPlus />
            <span className="hidden sm:inline">Add {sectionTerm}</span>
            <span className="sm:hidden">Create</span>
          </Button>
          <ActionMenuButton
            entityTerm="Course"
            onExport={() => setIsExportModalOpen(true)}
          />

          {/* Archive Status Toggle Switch */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const newStatus = archiveStatus === "only" ? "none" : "only";
                setArchiveStatus(newStatus);
                setSkipLimit((prev) => ({ ...prev, skip: 0 }));
                setSearchParams((prev) => {
                  prev.set("archiveStatus", newStatus);
                  prev.set("page", "1");
                  return prev;
                });
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#3E5B93] focus:ring-offset-2 ${
                archiveStatus === "only" ? "bg-gray-200" : "bg-primary"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  archiveStatus === "only" ? "translate-x-1" : "translate-x-6"
                }`}
              />
            </button>
            <span className="text-sm text-gray-600 hidden lg:inline whitespace-nowrap">
              {archiveStatus === "only" ? "Archived" : "Active"}
            </span>
            <span className="text-sm text-gray-600 lg:hidden">
              {archiveStatus === "only" ? "Archived" : "Active"}
            </span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <TableSkeletonClean columns={sectionTableColumns} rows={10} />
      ) : (
        <Table columns={tableColumns} scrollable={true} maxHeight="500px">
          {renderTableRows()}
        </Table>
      )}

      {/* Pagination */}
      {!isLoading && (
        <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
          <span>
            {data?.pagination?.totalItems || 0} result
            {data?.pagination?.totalItems !== 1 ? "s" : ""}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(skipLimit.skip - 1)}
              disabled={!data?.pagination?.hasPreviousPage}
              className={`px-4 py-2 rounded-md border border-[#60B2F0] transition-all duration-300 ${
                !data?.pagination?.hasPreviousPage
                  ? "opacity-50 cursor-not-allowed border-gray-300 text-gray-400"
                  : "text-[#60B2F0] hover:bg-[#60B2F0] hover:text-white"
              }`}
            >
              Previous
            </button>

            <span className="px-4 py-2 bg-gray-100 rounded-md font-medium">
              Page {data?.pagination?.currentPage} of{" "}
              {data?.pagination?.totalPages}
            </span>

            <button
              onClick={() => handlePageChange(skipLimit.skip + 1)}
              disabled={!data?.pagination?.hasNextPage}
              className={`px-4 py-2 rounded-md border border-[#60B2F0] transition-all duration-300 ${
                !data?.pagination?.hasNextPage
                  ? "opacity-50 cursor-not-allowed border-gray-300 text-gray-400"
                  : "text-[#60B2F0] hover:bg-[#60B2F0] hover:text-white"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={exportToCSV}
      />
    </div>
  );
}
