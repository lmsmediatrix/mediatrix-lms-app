import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGetStudentProfile } from "../../hooks/useStudent";
import {
  FaAngleLeft,
  FaUserCircle,
  FaRegUser,
  FaHashtag,
  FaBook,
  FaBuilding,
  FaUserTie,
  FaBriefcase,
  FaIdBadge,
  FaClock,
  FaCalendarAlt,
  FaEdit,
} from "react-icons/fa";
import ProfilePageSkeleton from "../../components/skeleton/ProfilePage";
import UserSectionsSkeleton from "../../components/skeleton/UserSectionsSkeleton";
import { IStudent } from "../../types/interfaces";
import { useStudentSections } from "../../hooks/useSection";
import Button from "../../components/common/Button";
import { useAuth } from "../../context/AuthContext";
import { getTerm, getYearLevelText } from "../../lib/utils";
import { formatDateMMMDDYYY } from "../../lib/dateUtils";
import DeleteStudentModal from "../../components/student/DeleteStudentModal";
import HoverHelpTooltip from "../../components/common/HoverHelpTooltip";

interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnail: string;
}

interface Module {
  _id: string;
  lessons: { _id: string }[];
}

interface Section {
  _id: string;
  name: string;
  code?: string;
  status?: string;
  course?: Course;
  modules?: Module[];
  schedule?: {
    startDate?: string;
    endDate?: string;
  };
}

interface InfoGridProps {
  items: { label: string; value: string; icon?: JSX.Element }[];
}

interface SectionsHookResult {
  data?: { sections?: Section[] };
  isPending: boolean;
}

function InfoGrid({ items }: InfoGridProps) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
      {items.map(({ label, value, icon }, index) => (
        <div key={index} className="flex items-start space-x-2">
          {icon && <span className="text-gray-400 text-sm mt-1">{icon}</span>}
          <div className="flex flex-col">
            <span className="text-gray-800 font-semibold">{label}</span>
            <span className="text-gray-500">{value || "N/A"}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionsDisplayGeneric({
  userId,
  useSectionsHook,
  learnerTerm,
  sectionTerm,
  onManageEnrollments,
}: {
  userId: string;
  useSectionsHook: (params: { studentId: string }) => SectionsHookResult;
  learnerTerm: string;
  sectionTerm: string;
  onManageEnrollments: () => void;
}) {
  const { data: sectionsData, isPending: isSectionsPending } = useSectionsHook({
    studentId: userId,
  });
  const sections: Section[] = sectionsData?.sections || [];

  if (isSectionsPending) {
    return <UserSectionsSkeleton />;
  }

  if (!sections.length) {
    return (
      <div className="max-w-4xl mx-auto rounded-xl border border-gray-200 shadow-sm bg-white p-6">
        <h3 className="text-base font-medium flex items-center space-x-2 text-gray-800 mb-4">
          <FaRegUser className="text-gray-500 text-lg" />
          <span>{sectionTerm} Enrollments</span>
        </h3>
        <p className="text-gray-600 text-sm mb-4">
          No active {sectionTerm.toLowerCase()} enrollments for this{" "}
          {learnerTerm.toLowerCase()}.
        </p>
        <Button variant="outline" onClick={onManageEnrollments}>
          Manage Enrollments
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto rounded-xl border border-gray-200 shadow-sm bg-white p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-medium flex items-center space-x-2 text-gray-800">
          <FaRegUser className="text-gray-500 text-lg" />
          <span>{sectionTerm} Enrollments</span>
        </h3>
        <Button variant="outline" onClick={onManageEnrollments}>
          Manage Enrollments
        </Button>
      </div>

      {sections.map((section: Section) => {
        const totalLessons = (section.modules || []).reduce(
          (sum: number, module: Module) => sum + (module.lessons?.length || 0),
          0,
        );
        const enrollmentStatus = section.status
          ? section.status.charAt(0).toUpperCase() + section.status.slice(1)
          : "Unknown";
        const scheduleStart = section.schedule?.startDate
          ? formatDateMMMDDYYY(section.schedule.startDate, true)
          : "N/A";
        const scheduleEnd = section.schedule?.endDate
          ? formatDateMMMDDYYY(section.schedule.endDate, true)
          : "N/A";

        return (
          <div
            key={section._id}
            className="border border-gray-200 rounded-lg p-4 mb-3 last:mb-0"
          >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
              <div>
                <h4 className="text-lg font-semibold text-gray-800">
                  {section.name}
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  {section.code || "No Code"}
                </p>
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded bg-blue-100 text-blue-700 w-fit">
                {enrollmentStatus}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 text-sm">
              <div>
                <p className="text-gray-500">Role</p>
                <p className="font-medium text-gray-800">{learnerTerm}</p>
              </div>
              <div>
                <p className="text-gray-500">Course</p>
                <p className="font-medium text-gray-800">
                  {section.course?.title || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Start Date</p>
                <p className="font-medium text-gray-800">{scheduleStart}</p>
              </div>
              <div>
                <p className="text-gray-500">End Date</p>
                <p className="font-medium text-gray-800">{scheduleEnd}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              {totalLessons} lessons assigned
            </p>
            {section.course?.description && (
              <p className="text-sm text-gray-600 mt-2">
                {section.course.description}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

type ProfileTab = "overview" | "enrollments" | "activity" | "settings";

export default function StudentDetailsPage() {
  const { id: studentId = "", orgCode = "" } = useParams();
  const { data, isPending } = useGetStudentProfile(studentId, {
    includeArchived: true,
  });
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const orgType = currentUser.user.organization.type;
  const learnerTerm = getTerm("learner", orgType);
  const sectionTerm = getTerm("group", orgType);
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);

  const { data: sectionsData, isPending: isSectionsPending } =
    useStudentSections({
      studentId,
    });
  const sections: Section[] = sectionsData?.sections || [];

  if (isPending) return <ProfilePageSkeleton />;

  const userData = data?.data as IStudent | undefined;
  const isArchived = Boolean(
    (userData as IStudent & { archive?: { status?: boolean } })?.archive
      ?.status,
  );
  const statusText = isArchived
    ? "Archived"
    : userData?.status
      ? `${userData.status.charAt(0).toUpperCase()}${userData.status.slice(1)}`
      : "Active";

  if (!userData) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{learnerTerm} Details</h1>
          <p className="text-sm text-gray-500">
            We couldn&apos;t load this {learnerTerm.toLowerCase()} profile.
          </p>
        </div>
        <Button
          variant="link"
          className="flex items-center gap-2 text-gray-700 hover:text-blue-600 text-sm font-medium"
          onClick={() => navigate(-1)}
        >
          <FaAngleLeft /> Go back
        </Button>
      </div>
    );
  }

  const userDataWithLastLogin = userData as IStudent & { lastLogin?: string };

  const roleValue =
    orgType === "corporate"
      ? "Employee"
      : userData.role
        ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1)
        : learnerTerm;
  const subRoleValue = userData.subrole
    ? userData.subrole
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase())
    : "N/A";

  const infoItems = [
    {
      label: `${learnerTerm} ID`,
      value: userData.studentId || "",
      icon: <FaHashtag />,
    },
    {
      label: "Program",
      value: userData.program?.name || "",
      icon: <FaBook />,
    },
    {
      label: "Year Level",
      value: userData.yearLevel ? getYearLevelText(userData.yearLevel) : "",
      icon: <FaBook />,
    },
    {
      label: "Role",
      value: roleValue,
      icon: <FaBriefcase />,
    },
    {
      label: "Subrole",
      value: subRoleValue,
      icon: <FaIdBadge />,
    },
  ];

  const departmentValue =
    typeof userData.person?.department === "string"
      ? userData.person.department
      : userData.person?.department?.name || userData.department?.name || "";

  const managerValue =
    typeof userData.directTo === "string"
      ? userData.directTo
      : `${userData.directTo?.firstName || ""} ${userData.directTo?.lastName || ""}`.trim();

  const corporateInfoItems = [
    {
      label: "Department",
      value: departmentValue,
      icon: <FaBuilding />,
    },
    {
      label: "Manager",
      value: managerValue || "Not Assigned",
      icon: <FaUserTie />,
    },
    {
      label: "Role",
      value: roleValue,
      icon: <FaBriefcase />,
    },
    {
      label: "Subrole",
      value: subRoleValue,
      icon: <FaIdBadge />,
    },
  ];

  const metadataItems = [
    {
      label: "Last Login",
      value: userDataWithLastLogin.lastLogin
        ? formatDateMMMDDYYY(userDataWithLastLogin.lastLogin, true)
        : "No login record",
      icon: <FaClock />,
    },
    {
      label: "Created Date",
      value: userData.createdAt
        ? formatDateMMMDDYYY(userData.createdAt, true)
        : "N/A",
      icon: <FaCalendarAlt />,
    },
    {
      label: "Last Updated",
      value: userData.updatedAt
        ? formatDateMMMDDYYY(userData.updatedAt, true)
        : "N/A",
      icon: <FaEdit />,
    },
  ];

  const metrics = {
    enrolledCount: sections.length,
    completedCount: sections.filter((section) => section.status === "completed")
      .length,
    lessonCount: sections.reduce((total, section) => {
      return (
        total +
        (section.modules || []).reduce((sectionTotal, module) => {
          return sectionTotal + (module.lessons?.length || 0);
        }, 0)
      );
    }, 0),
    uniqueCourseCount: new Set(
      sections
        .map((section) => section.course?._id)
        .filter((courseId): courseId is string => Boolean(courseId)),
    ).size,
  };

  const tabs: { id: ProfileTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "enrollments", label: "Enrollments" },
    { id: "activity", label: "Activity" },
    { id: "settings", label: "Settings" },
  ];

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{learnerTerm} Details</h1>
            <HoverHelpTooltip
              text={`View ${learnerTerm.toLowerCase()} account information`}
              className="shrink-0"
            />
          </div>
        </div>
        <Button
          variant="link"
          className="flex items-center gap-2 text-gray-700 hover:text-blue-600 text-sm font-medium"
          onClick={() => navigate(-1)}
        >
          <FaAngleLeft /> Go back
        </Button>
      </div>

      <div className="max-w-4xl mx-auto rounded-xl border border-gray-200 shadow-sm bg-white mb-4">
        <div className="bg-[#F5F8FF] rounded-t-xl p-6">
          <div className="flex items-center space-x-4">
            <div>
              {userData.avatar ? (
                <img
                  src={userData.avatar}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center">
                  <FaUserCircle className="size-8 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex justify-between flex-1">
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-gray-800">
                  {`${userData.firstName || ""} ${userData.lastName || ""}`.trim() ||
                    `Unnamed ${learnerTerm}`}
                </h2>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-sm text-gray-600">
                    {userData.email || "No email available"}
                  </span>
                  <span
                    className={`text-xs font-medium px-2.5 py-0.5 rounded ${
                      isArchived
                        ? "bg-red-100 text-red-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {statusText}
                  </span>
                </div>
              </div>
              {userData.gpa && (
                <div className="mt-1 py-1 px-3 bg-gray-100 rounded-full text-center">
                  <p className="text-gray-800 text-sm">
                    GPA: <span className="font-bold">{userData.gpa}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 pt-4 pb-2 border-t border-gray-100">
          <div className="flex gap-2 flex-wrap">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "overview" && orgType === "school" && (
          <div className="p-6">
            <h3 className="text-base font-medium flex items-center space-x-2 text-gray-800 mb-4">
              <FaRegUser className="text-gray-500 text-lg" />
              <span>{learnerTerm} Details</span>
            </h3>
            <InfoGrid items={infoItems} />
            <div className="mt-6">
              <h3 className="text-base font-medium flex items-center space-x-2 text-gray-800 mb-4">
                <FaRegUser className="text-gray-500 text-lg" />
                <span>System Metadata</span>
              </h3>
              <InfoGrid items={metadataItems} />
            </div>
          </div>
        )}

        {activeTab === "overview" && orgType === "corporate" && (
          <div className="p-6">
            <h3 className="text-base font-medium flex items-center space-x-2 text-gray-800 mb-4">
              <FaRegUser className="text-gray-500 text-lg" />
              <span>{learnerTerm} Details</span>
            </h3>
            <InfoGrid items={corporateInfoItems} />
            <div className="mt-6">
              <h3 className="text-base font-medium flex items-center space-x-2 text-gray-800 mb-4">
                <FaRegUser className="text-gray-500 text-lg" />
                <span>System Metadata</span>
              </h3>
              <InfoGrid items={metadataItems} />
            </div>
          </div>
        )}

        {activeTab === "activity" && (
          <div className="p-6 border-t border-gray-100">
            <h3 className="text-base font-medium text-gray-800 mb-4">
              Learning Activity & Performance
            </h3>
            {isSectionsPending ? (
              <UserSectionsSkeleton />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-xs text-gray-500 mb-1">
                    {sectionTerm}s Enrolled
                  </p>
                  <p className="text-2xl font-semibold text-gray-800">
                    {metrics.enrolledCount}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-xs text-gray-500 mb-1">
                    Completed Enrollments
                  </p>
                  <p className="text-2xl font-semibold text-gray-800">
                    {metrics.completedCount}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-xs text-gray-500 mb-1">Courses Assigned</p>
                  <p className="text-2xl font-semibold text-gray-800">
                    {metrics.uniqueCourseCount}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-xs text-gray-500 mb-1">Lessons Assigned</p>
                  <p className="text-2xl font-semibold text-gray-800">
                    {metrics.lessonCount}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "settings" && (
          <div className="p-6 border-t border-gray-100">
            <h3 className="text-base font-medium text-gray-800 mb-2">
              Administrative Actions
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Manage enrollments, review performance, and control account
              status.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => navigate(`/${orgCode}/admin/section`)}
              >
                Manage Enrollments
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  navigate(`/${orgCode}/admin/performance/${studentId}`)
                }
              >
                View Performance
              </Button>
              <Button
                variant="destructive"
                onClick={() => setIsArchiveModalOpen(true)}
                disabled={isArchived}
              >
                {isArchived ? "Already Archived" : `Archive ${learnerTerm}`}
              </Button>
            </div>
            {!isArchived && (
              <p className="text-xs text-gray-500 mt-3">
                Archiving will show section/batch impact and automatically
                detach active enrollments while preserving historical records.
              </p>
            )}
          </div>
        )}
      </div>

      {activeTab === "enrollments" && (
        <SectionsDisplayGeneric
          userId={studentId}
          useSectionsHook={useStudentSections}
          learnerTerm={learnerTerm}
          sectionTerm={sectionTerm}
          onManageEnrollments={() => navigate(`/${orgCode}/admin/section`)}
        />
      )}

      <DeleteStudentModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        studentId={studentId}
        studentName={
          `${userData.firstName || ""} ${userData.lastName || ""}`.trim() ||
          `Unnamed ${learnerTerm}`
        }
      />
    </div>
  );
}
