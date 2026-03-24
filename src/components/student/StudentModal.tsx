import FlatModal from "../common/FlatModal";
import { useGetStudentDetails } from "../../hooks/useStudent";
import { useSearchParams } from "react-router-dom";
import {
  FaBuilding,
  FaEnvelope,
  FaFacebookF,
  FaInstagram,
} from "react-icons/fa";
import { formatDateTimeAgo } from "../../lib/dateUtils";
import StudentModalSkeleton from "../skeleton/StudentModalSkeleton";
import { getYearLevelText } from "../../lib/utils";

export default function StudentModal() {
  const [searchParams, setSearchParams] = useSearchParams();
  const studentId = searchParams.get("studentId");

  const { data: student, isPending } = useGetStudentDetails(
    studentId ? studentId : ""
  );

  const handleClose = () => setSearchParams({ tab: "students" });

  if (!studentId) return null;

  return (
    <FlatModal onClose={handleClose}>
      <div className="space-y-6 p-4 flex flex-col items-center">
        {isPending ? (
          <StudentModalSkeleton />
        ) : (
          <div className="space-y-6 w-full">
            {/* Avatar and Name */}
            <div className="flex flex-col items-center text-center">
              {student.data.avatar ? (
                <img
                  src={student.data.avatar}
                  alt={`${student.data.firstName} ${student.data.lastName}`}
                  className="w-24 h-24 rounded-full object-cover mb-3"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-2xl mb-3">
                  {student.data.firstName[0]}
                  {student.data.lastName[0]}
                </div>
              )}
              <h2 className="text-xl font-semibold text-gray-800 mb-1">
                {student.data.firstName} {student.data.lastName}
              </h2>
              <p className="text-gray-600">
                Student #: {student.data.studentId}
              </p>
              <p className="text-gray-600">
                Year Level: {getYearLevelText(student.data.yearLevel)}
              </p>
              <p className="text-gray-500 text-sm">
                Last Active:{" "}
                <span>{formatDateTimeAgo(student.data.lastLogin)}</span>
              </p>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3 text-gray-600 border border-gray-200 rounded-md p-3">
                <FaEnvelope size={18} className="text-[#00BCD4] min-w-[20px]" />
                <span>{student.data.email}</span>
              </div>
            </div>

            {/* Social Accounts */}
            <div className="text-center">
              <h3 className="text-gray-700 font-medium mb-3">
                Social Accounts
              </h3>
              <div className="space-y-3">
                {!student.data.socialLinks?.linkedIn &&
                !student.data.socialLinks?.twitter &&
                !student.data.socialLinks?.website ? (
                  <p className="text-gray-500 text-sm italic">
                    No social accounts linked
                  </p>
                ) : (
                  <>
                    {student.data.socialLinks?.linkedIn && (
                      <a
                        href={student.data.socialLinks.linkedIn}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between text-gray-600 py-2 border-b"
                      >
                        <div className="flex items-center gap-3">
                          <FaFacebookF size={18} className="text-[#00BCD4]" />
                          <span>LinkedIn</span>
                        </div>
                        <span className="text-gray-400">›</span>
                      </a>
                    )}
                    {student.data.socialLinks?.twitter && (
                      <a
                        href={student.data.socialLinks.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between text-gray-600 py-2 border-b"
                      >
                        <div className="flex items-center gap-3">
                          <FaInstagram size={18} className="text-[#00BCD4]" />
                          <span>Twitter</span>
                        </div>
                        <span className="text-gray-400">›</span>
                      </a>
                    )}
                    {student.data.socialLinks?.website && (
                      <a
                        href={student.data.socialLinks.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between text-gray-600 py-2 border-b"
                      >
                        <div className="flex items-center gap-3">
                          <FaBuilding size={18} className="text-[#00BCD4]" />
                          <span>Website</span>
                        </div>
                        <span className="text-gray-400">›</span>
                      </a>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </FlatModal>
  );
}
