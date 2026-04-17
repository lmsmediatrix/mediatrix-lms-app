import { useParams, useSearchParams } from "react-router-dom";
import { FaUserPlus } from "react-icons/fa";
import { FiTrash2 } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useSectionStudent } from "../../hooks/useSection";
import { IStudent } from "../../types/interfaces";
import AddStudentToSectionModal from "../../components/orgAdmin/AddStudentToSectionModal";
import DeleteStudentFromSectionModal from "../../components/orgAdmin/DeleteStudentFromSectionModal";
import StudentModal from "../../components/student/StudentModal";
import { getTerm } from "../../lib/utils";
import { useAuth } from "../../context/AuthContext";
import SectionStudentsSkeleton from "../skeleton/SectionStudentSkeleton";
import BulkImportSectionStudentModal from "./BulkImportStudentModal";

const SectionStudents = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { sectionCode, orgCode } = useParams();
  const orgType = currentUser?.user?.organization?.type;
  const role = currentUser.user.role;
  const learnerTerm = getTerm("learner", orgType);
  const [searchParams, setSearchParams] = useSearchParams();
  const modal = searchParams.get("modal");
  const studentId = searchParams.get("studentId");
  const { data: studentsData, isPending: isStudentsDataPending } =
    useSectionStudent({ sectionCode });
  const sectionStudentIds =
    studentsData?.data?.student?.map((student: IStudent) => student._id) || [];

  const [studentToDelete, setStudentToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  if (isStudentsDataPending) {
    return <SectionStudentsSkeleton />;
  }

  const viewStudentDetails = (studentId: string) => {
    if (role === "admin") {
      navigate(`/${orgCode}/admin/student/${studentId}`);
    } else {
      setSearchParams({
        ...Object.fromEntries(searchParams),
        studentId: studentId,
        tab: "students",
      });
    }
  };

  const handleModalClose = () => {
    if (searchParams.get("tab") === "students") {
      setSearchParams({ tab: "students" });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="sm:p-4 lg:p-6">
      {studentId && <StudentModal />}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
        <h3 className="text-lg sm:text-xl font-semibold">
          {learnerTerm}s{" "}
          <span className="font-normal text-gray-400">
            ({studentsData.data.student.length || 0})
          </span>
        </h3>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={() =>
              setSearchParams({
                ...Object.fromEntries(searchParams),
                modal: "add-student",
                ...(sectionCode ? { sectionCode: sectionCode } : {}),
              })
            }
            className="bg-primary text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-primary/90 flex items-center gap-2 text-sm sm:text-base justify-center"
          >
            <FaUserPlus className="text-sm" />
            <span>Add {learnerTerm}s</span>
          </button>
          <button
            onClick={() =>
              setSearchParams({
                ...Object.fromEntries(searchParams),
                modal: "import-student",
                ...(sectionCode ? { sectionCode: sectionCode } : {}),
              })
            }
            className="bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2 text-sm sm:text-base justify-center"
          >
            <span>Import {learnerTerm}s</span>
          </button>
        </div>
      </div>

      {studentsData?.data?.student && studentsData.data.student.length > 0 ? (
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-h-[430px] overflow-y-auto">
          {studentsData.data.student.map((student: IStudent) => (
            <div
              key={student._id}
              className="flex flex-col items-center gap-3 p-4 bg-white hover:bg-gray-50 rounded-lg cursor-pointer border border-gray-200"
              onClick={() => {
                viewStudentDetails(student._id);
              }}
            >
              <div className="w-16 h-16 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                {student.avatar ? (
                  <img
                    src={student.avatar}
                    alt={learnerTerm}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600 font-medium text-lg">
                    {`${student.firstName[0]}${student.lastName[0]}`}
                  </div>
                )}
              </div>
              <div className="text-center flex-1">
                <p className="font-medium text-base break-words">{`${student.firstName} ${student.lastName}`}</p>
                <p className="text-gray-600 text-sm line-clamp-1">
                  {student.email}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setStudentToDelete({
                    id: student._id,
                    name: `${student.firstName} ${student.lastName}`,
                  });
                }}
                className="p-2 hover:bg-gray-100 rounded-full text-red-600"
                title={`Remove ${learnerTerm.toLowerCase()} from ${getTerm("group", orgType).toLowerCase()}`}
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm sm:text-base">
          No {learnerTerm.toLowerCase()}s enrolled in this {getTerm("group", orgType).toLowerCase()}
        </p>
      )}

      {/* Delete Student From Section Modal */}
      <DeleteStudentFromSectionModal
        isOpen={!!studentToDelete}
        onClose={() => setStudentToDelete(null)}
        sectionCode={sectionCode || ""}
        studentId={studentToDelete?.id || ""}
        studentName={studentToDelete?.name || ""}
      />

      {/* Add Student To Section Modal */}
      {modal === "add-student" && (
        <AddStudentToSectionModal
          isOpen={true}
          onClose={handleModalClose}
          sectionStudentIds={sectionStudentIds}
        />
      )}

      {/* BulkImportStudentModal */}
      {modal === "import-student" && (
        <BulkImportSectionStudentModal
          isOpen={true}
          onClose={handleModalClose}
          sectionCode={sectionCode || ""}
        />
      )}
    </div>
  );
};

export default SectionStudents;
