import Dialog from "../common/Dialog";
import Button from "../common/Button";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import { useSearchStudents } from "../../hooks/useStudent";
import { useAddStudentsToSection } from "../../hooks/useSection";
import { useSearchParams } from "react-router-dom";
import { IStudent, IProgram } from "../../types/interfaces";
import { getTerm } from "../../lib/utils";
import { useDebounce } from "../../hooks/useDebounce";
import { useProgramsForDropdown } from "../../hooks/useProgram";

interface AddStudentToSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionStudentIds: string[];
}

export default function AddStudentToSectionModal({
  isOpen,
  onClose,
  sectionStudentIds,
}: AddStudentToSectionModalProps) {
  const { currentUser } = useAuth();
  const orgType = currentUser?.user?.organization?.type;
  const learnerTerm = getTerm("learner", orgType);

  const [searchParams] = useSearchParams();
  const sectionCode = searchParams.get("sectionCode") || "";

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("All Programs");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const addStudentsToSection = useAddStudentsToSection();

  const { data: studentsData, isLoading: isLoadingStudents } = useSearchStudents({
    organizationId: currentUser?.user?.organization?._id,
    searchTerm: debouncedSearchTerm,
    filter:
      selectedProgram !== "All Programs"
        ? { key: "program", value: selectedProgram }
        : { key: "role", value: "student" },
    limit: 50,
  });

  const { data: programsData } = useProgramsForDropdown({
    organizationId: currentUser?.user?.organization?._id,
  });

  const students = (studentsData?.students || []).filter(
    (student: IStudent) => !sectionStudentIds.includes(student._id)
  );
  const totalStudents = students.length;

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedStudents(students.map((student: IStudent) => student._id));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleStudentSelect = (studentId: string, checked: boolean) => {
    if (checked) {
      setSelectedStudents((prev) => [...prev, studentId]);
    } else {
      setSelectedStudents((prev) => prev.filter((id) => id !== studentId));
      setSelectAll(false);
    }
  };

  useEffect(() => {
    if (students.length > 0) {
      const allSelected = students.every((student: IStudent) =>
        selectedStudents.includes(student._id)
      );
      setSelectAll(allSelected);
    }
  }, [selectedStudents, students]);

  const handleAddStudents = () => {
    if (selectedStudents.length === 0) {
      toast.error("Please select at least one student");
      return;
    }

    toast.promise(
      addStudentsToSection.mutateAsync(
        { sectionCode, studentIds: selectedStudents },
        {
          onSuccess: () => {
            onClose();
            setSelectedStudents([]);
            setSearchTerm("");
            setSelectedProgram("All Programs");
          },
          onError: (error) => {
            console.error("Error adding students to section:", error);
          },
        }
      ),
      {
        pending: `Adding ${selectedStudents.length} ${learnerTerm}${
          selectedStudents.length > 1 ? "s" : ""
        } to section...`,
        success: `${selectedStudents.length} ${learnerTerm}${
          selectedStudents.length > 1 ? "s" : ""
        } added to section successfully`,
        error: {
          render({ data }) {
            return (data as { message: string }).message;
          },
        },
      }
    );
  };

  const handleClose = () => {
    setSelectedStudents([]);
    setSearchTerm("");
    setSelectedProgram("All Programs");
    setSelectAll(false);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title={`Add ${learnerTerm} to Section`}
      size="6xl"
      backdrop="blur"
    >
      <div className="space-y-6">
        {/* Tabs */}

        {/* Search and Filter Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search {learnerTerm}s
            </label>
            <input
              type="text"
              placeholder={`Search by name, email, ID, or program...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {orgType === "school" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Program
              </label>
              <select
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="All Programs">All Programs</option>
                {programsData?.map((program: IProgram) => (
                  <option key={program._id} value={program._id}>
                    {program.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Select All Checkbox */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="select-all"
              checked={selectAll}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label
              htmlFor="select-all"
              className="ml-2 text-sm font-medium text-gray-700"
            >
              Select All ({totalStudents} {learnerTerm.toLowerCase()}s)
            </label>
          </div>
          <div className="text-sm text-gray-500">
            {selectedStudents.length} selected
          </div>
        </div>

        {/* Students Grid */}
        <div className="max-h-[400px] overflow-y-auto">
          {isLoadingStudents ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
              {[...Array(6)].map((_, index) => (
                <div
                  key={index}
                  className="relative border border-gray-200 rounded-lg p-3"
                >
                  {/* Skeleton Checkbox */}
                  <div className="absolute top-2 right-2">
                    <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                  </div>

                  {/* Skeleton Student Content */}
                  <div className="flex flex-col items-center text-center space-y-2">
                    {/* Skeleton Avatar */}
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
                    </div>

                    {/* Skeleton Student Info */}
                    <div className="w-full space-y-2">
                      <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mx-auto" />
                      <div className="h-3 w-5/6 bg-gray-200 rounded animate-pulse mx-auto" />
                      <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse mx-auto" />
                      <div className="h-3 w-2/3 bg-gray-200 rounded animate-pulse mx-auto" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                No {learnerTerm.toLowerCase()}s found
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
              {students.map((student: IStudent) => (
                <div
                  key={student._id}
                  className={`relative border rounded-lg p-3 cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedStudents.includes(student._id)
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() =>
                    handleStudentSelect(
                      student._id,
                      !selectedStudents.includes(student._id)
                    )
                  }
                >
                  {/* Checkbox */}
                  <div className="absolute top-2 right-2">
                    <input
                      type="checkbox"
                      id={`student-${student._id}`}
                      checked={selectedStudents.includes(student._id)}
                      onChange={(e) =>
                        handleStudentSelect(student._id, e.target.checked)
                      }
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                  </div>

                  {/* Student Content */}
                  <div className="flex flex-col items-center text-center space-y-2">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {student.avatar ? (
                        <img
                          src={student.avatar}
                          alt={`${student.firstName} ${student.lastName}`}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {student.firstName.charAt(0)}
                            {student.lastName.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Student Info */}
                    <div className="w-full">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {student.firstName} {student.lastName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {student.email}
                      </p>
                      {student.studentId && (
                        <p className="text-xs text-gray-400 mt-1">
                          ID: {student.studentId}
                        </p>
                      )}
                      {student.program && (
                        <p className="text-xs text-gray-400 truncate mt-1">
                          {student.program.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Students Section */}
        {selectedStudents.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Selected {learnerTerm}s ({selectedStudents.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {selectedStudents.map((studentId) => {
                const student = students.find(
                  (s: IStudent) => s._id === studentId
                );
                if (!student) return null;

                return (
                  <div
                    key={studentId}
                    className="flex items-center bg-white rounded-md px-3 py-1 border border-blue-300"
                  >
                    <div className="flex-shrink-0 mr-2">
                      {student.avatar ? (
                        <img
                          src={student.avatar}
                          alt={`${student.firstName} ${student.lastName}`}
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-700">
                            {student.firstName.charAt(0)}
                            {student.lastName.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {student.firstName} {student.lastName}
                      </p>
                    </div>
                    <button
                      onClick={() => handleStudentSelect(studentId, false)}
                      className="ml-2 text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="cancel"
            onClick={handleClose}
            disabled={addStudentsToSection.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleAddStudents}
            disabled={
              selectedStudents.length === 0 || addStudentsToSection.isPending
            }
            className="bg-primary text-white hover:bg-primary/90"
          >
            {addStudentsToSection.isPending
              ? `Adding ${selectedStudents.length} ${learnerTerm}${
                  selectedStudents.length > 1 ? "s" : ""
                }...`
              : `Add ${selectedStudents.length} ${learnerTerm}${
                  selectedStudents.length > 1 ? "s" : ""
                }`}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}