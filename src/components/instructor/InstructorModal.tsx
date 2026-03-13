import FlatModal from "../common/FlatModal";
import { useSearchParams } from "react-router-dom";
import {
  FaBuilding,
  FaEnvelope,
  FaFacebookF,
  FaInstagram,
} from "react-icons/fa";
import { formatDateTimeAgo } from "../../lib/dateUtils";
import { useGetInstructorById } from "../../hooks/useInstructor";
import InstructorModalSkeleton from "../skeleton/InstructorModalSkeleton";

export default function InstructorModal() {
  const [searchParams, setSearchParams] = useSearchParams();
  const instructorId = searchParams.get("instructor");

  const { data: instructor, isPending } = useGetInstructorById(
    instructorId ? instructorId : ""
  );

  const handleClose = () => setSearchParams({});

  if (!instructorId) return null;

  return (
    <FlatModal onClose={handleClose}>
      <div className="space-y-6 p-4 flex flex-col items-center">
        {isPending ? (
          <InstructorModalSkeleton />
        ) : (
          <div className="space-y-6 w-full">
            {/* Avatar and Name */}
            <div className="flex flex-col items-center text-center">
              {instructor.data.avatar ? (
                <img
                  src={instructor.data.avatar}
                  alt={`${instructor.data.firstName} ${instructor.data.lastName}`}
                  className="w-24 h-24 rounded-full object-cover mb-3"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-2xl mb-3">
                  {instructor.data.firstName[0]}
                  {instructor.data.lastName[0]}
                </div>
              )}
              <h2 className="text-xl font-semibold text-gray-800 mb-1">
                {instructor.data.firstName} {instructor.data.lastName}
              </h2>
              {instructor.data.faculty && (
                <p className="text-gray-600">
                  Faculty of{" "}
                  <span className="font-medium">
                    {typeof instructor.data.faculty === "string"
                      ? instructor.data.faculty
                      : instructor.data.faculty.name}
                  </span>
                </p>
              )}
              {instructor.data.lastLogin && (
                <p className="text-gray-500 text-sm">
                  Last Active:{" "}
                  <span>{formatDateTimeAgo(instructor.data.lastLogin)}</span>
                </p>
              )}
            </div>

            {/* Contact Information */}
            <div className="space-y-4 flex flex-col items-center">
              <div className="flex items-center w-fit gap-3 text-gray-600 border border-gray-200 rounded-md p-3">
                <FaEnvelope size={18} className="text-[#00BCD4] min-w-[20px]" />
                <span>{instructor.data.email}</span>
              </div>
            </div>

            {/* Social Accounts */}
            <div className="text-center">
              <h3 className="text-gray-700 font-medium mb-3">
                Social Accounts
              </h3>
              <div className="space-y-3">
                {!instructor.data.socialLinks?.linkedIn &&
                !instructor.data.socialLinks?.twitter &&
                !instructor.data.socialLinks?.website ? (
                  <p className="text-gray-500 text-sm italic">
                    No social accounts linked
                  </p>
                ) : (
                  <>
                    {instructor.data.socialLinks?.linkedIn && (
                      <a
                        href={instructor.data.socialLinks.linkedIn}
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
                    {instructor.data.socialLinks?.twitter && (
                      <a
                        href={instructor.data.socialLinks.twitter}
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
                    {instructor.data.socialLinks?.website && (
                      <a
                        href={instructor.data.socialLinks.website}
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
