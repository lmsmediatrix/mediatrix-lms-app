import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FaAngleLeft,
  FaBuilding,
  FaCalendarAlt,
  FaClock,
  FaEdit,
  FaIdBadge,
  FaRegUser,
  FaUserCircle,
  FaUserTie,
  FaBriefcase,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { useGetStudentProfile } from "../../hooks/useStudent";
import { useGetDevelopmentPlans } from "../../hooks/useDevelopmentPlan";
import { useStudentSections } from "../../hooks/useSection";
import { useStudentCertificates } from "../../hooks/useCertificate";
import ProfilePageSkeleton from "../../components/skeleton/ProfilePage";
import UserSectionsSkeleton from "../../components/skeleton/UserSectionsSkeleton";
import Button from "../../components/common/Button";
import ChangePasswordModal from "../../components/common/ChangePasswordModal";
import CertificateDisplayCard from "../../components/student/CertificateDisplayCard";
import CertificatePreviewModal from "../../components/student/CertificatePreviewModal";
import { downloadCertificatePdf } from "../../lib/certificatePdf";
import { formatDateMMMDDYYY } from "../../lib/dateUtils";
import { getTerm } from "../../lib/utils";
import { ICertificate, IStudent } from "../../types/interfaces";

type ProfileTab =
  | "overview"
  | "enrollments"
  | "activity"
  | "development-plan"
  | "settings";

interface Section {
  _id: string;
  name: string;
  code?: string;
  status?: string;
  modules?: { _id: string; lessons: { _id: string }[] }[];
  course?: { _id: string; title: string; description?: string };
}

function InfoGrid({
  items,
}: {
  items: { label: string; value: string; icon?: JSX.Element }[];
}) {
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-5 text-sm md:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-start gap-2">
          <span className="mt-1 text-sm text-gray-400">{item.icon}</span>
          <div className="flex flex-col">
            <span className="font-semibold text-gray-800">{item.label}</span>
            <span className="text-gray-500">{item.value || "N/A"}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function EmployeeProfilePage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");
  const [previewCertificate, setPreviewCertificate] = useState<ICertificate | null>(
    null,
  );

  const userId = currentUser.user.id;
  const orgType = currentUser.user.organization.type;
  const learnerTerm = getTerm("learner", orgType);
  const changePassword = searchParams.get("change-password");

  const { data, isPending } = useGetStudentProfile(userId);
  const { data: sectionsData, isPending: isSectionsPending } = useStudentSections({
    studentId: userId,
    limit: 100,
  });
  const { data: certificatesData, isPending: isCertificatesLoading } =
    useStudentCertificates(userId, { enabled: !!userId });
  const developmentPlansQuery = useGetDevelopmentPlans({
    employeeId: userId,
    limit: 50,
    skip: 0,
  });

  const sections: Section[] = sectionsData?.sections || [];

  const metrics = useMemo(
    () => ({
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
    }),
    [sections],
  );

  if (isPending) return <ProfilePageSkeleton />;

  const userData = data?.data as IStudent | undefined;
  const certificates = (certificatesData?.data || []) as ICertificate[];

  if (!userData) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <h1 className="text-3xl font-bold">{learnerTerm} Details</h1>
        <p className="mt-2 text-sm text-gray-500">Unable to load profile.</p>
      </div>
    );
  }

  const userDataWithLastLogin = userData as IStudent & { lastLogin?: string };
  const roleValue = "Employee";
  const subRoleValue = userData.subrole
    ? userData.subrole
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase())
    : "N/A";
  const departmentValue =
    typeof userData.person?.department === "string"
      ? userData.person.department
      : userData.person?.department?.name || userData.department?.name || "";
  const managerValue =
    typeof userData.directTo === "string"
      ? userData.directTo
      : `${userData.directTo?.firstName || ""} ${userData.directTo?.lastName || ""}`.trim();

  const detailItems = [
    { label: "Department", value: departmentValue || "N/A", icon: <FaBuilding /> },
    { label: "Manager", value: managerValue || "Not Assigned", icon: <FaUserTie /> },
    { label: "Role", value: roleValue, icon: <FaBriefcase /> },
    { label: "Subrole", value: subRoleValue, icon: <FaIdBadge /> },
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
      value: userData.createdAt ? formatDateMMMDDYYY(userData.createdAt, true) : "N/A",
      icon: <FaCalendarAlt />,
    },
    {
      label: "Last Updated",
      value: userData.updatedAt ? formatDateMMMDDYYY(userData.updatedAt, true) : "N/A",
      icon: <FaEdit />,
    },
  ];

  const learnerName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || "Learner";

  const handleDownloadCertificate = async () => {
    if (!previewCertificate) return;
    await downloadCertificatePdf({
      certificate: previewCertificate,
      learnerName,
      organizationName: currentUser.user.organization.name,
    });
    setPreviewCertificate(null);
  };

  const tabs: { id: ProfileTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "enrollments", label: "Enrollments" },
    { id: "activity", label: "Activity" },
    { id: "development-plan", label: "Development Plan" },
    { id: "settings", label: "Settings" },
  ];

  const developmentPlans = (
    developmentPlansQuery.data as { data?: Array<Record<string, any>> } | undefined
  )?.data || [];

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{learnerTerm} Details</h1>
        <Button
          variant="link"
          className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-blue-600"
          onClick={() => navigate(-1)}
        >
          <FaAngleLeft /> Go back
        </Button>
      </div>

      <div className="mx-auto max-w-4xl rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="rounded-t-xl bg-[#F5F8FF] p-6">
          <div className="flex items-center space-x-4">
            {userData.avatar ? (
              <img
                src={userData.avatar}
                alt="Profile"
                className="h-24 w-24 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg">
                <FaUserCircle className="size-8 text-gray-400" />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">
                {`${userData.firstName || ""} ${userData.lastName || ""}`.trim()}
              </h2>
              <div className="mt-1 flex items-center space-x-2">
                <span className="text-sm text-gray-600">{userData.email || "N/A"}</span>
                <span className="rounded bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 px-6 pb-2 pt-4">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
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

        {activeTab === "overview" && (
          <div className="p-6">
            <h3 className="mb-4 flex items-center space-x-2 text-base font-medium text-gray-800">
              <FaRegUser className="text-lg text-gray-500" />
              <span>{learnerTerm} Details</span>
            </h3>
            <InfoGrid items={detailItems} />

            <div className="mt-8">
              <h3 className="mb-4 flex items-center space-x-2 text-base font-medium text-gray-800">
                <FaRegUser className="text-lg text-gray-500" />
                <span>System Metadata</span>
              </h3>
              <InfoGrid items={metadataItems} />
            </div>

            <div className="mt-8 border-t border-slate-200 pt-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-medium text-gray-800">All Certificates</h3>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                  {certificates.length}
                </span>
              </div>
              {isCertificatesLoading ? (
                <p className="text-sm text-slate-500">Loading certificates...</p>
              ) : certificates.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                  No certificates yet. Complete lessons/modules with certificate enabled to unlock them.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {certificates.map((certificate) => (
                    <CertificateDisplayCard
                      key={certificate._id}
                      certificate={certificate}
                      learnerName={learnerName}
                      onDownload={setPreviewCertificate}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "enrollments" && (
          <div className="border-t border-gray-100 p-6">
            <h3 className="mb-4 text-base font-medium text-gray-800">Enrollments</h3>
            {isSectionsPending ? (
              <UserSectionsSkeleton />
            ) : sections.length === 0 ? (
              <p className="text-sm text-gray-600">No active enrollments.</p>
            ) : (
              <div className="space-y-3">
                {sections.map((section) => (
                  <div key={section._id} className="rounded-lg border border-gray-200 p-4">
                    <p className="font-medium text-gray-800">{section.name}</p>
                    <p className="mt-1 text-xs text-gray-500">{section.code || "No code"}</p>
                    <p className="mt-2 text-sm text-gray-600">
                      {section.course?.title || "No course title"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "activity" && (
          <div className="border-t border-gray-100 p-6">
            <h3 className="mb-4 text-base font-medium text-gray-800">Learning Activity</h3>
            {isSectionsPending ? (
              <UserSectionsSkeleton />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="mb-1 text-xs text-gray-500">Enrollments</p>
                  <p className="text-2xl font-semibold text-gray-800">{metrics.enrolledCount}</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="mb-1 text-xs text-gray-500">Completed</p>
                  <p className="text-2xl font-semibold text-gray-800">{metrics.completedCount}</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="mb-1 text-xs text-gray-500">Courses Assigned</p>
                  <p className="text-2xl font-semibold text-gray-800">{metrics.uniqueCourseCount}</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="mb-1 text-xs text-gray-500">Lessons Assigned</p>
                  <p className="text-2xl font-semibold text-gray-800">{metrics.lessonCount}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "settings" && (
          <div className="border-t border-gray-100 p-6">
            <h3 className="mb-2 text-base font-medium text-gray-800">Account Settings</h3>
            <p className="mb-4 text-sm text-gray-600">
              Use this to update your account security settings.
            </p>
            <Button onClick={() => setSearchParams({ "change-password": "true" })}>
              Change Password
            </Button>
          </div>
        )}

        {activeTab === "development-plan" && (
          <div className="border-t border-gray-100 p-6">
            <h3 className="mb-4 text-base font-medium text-gray-800">
              Development Plans
            </h3>
            {developmentPlansQuery.isLoading ? (
              <p className="text-sm text-gray-500">Loading development plans...</p>
            ) : developmentPlans.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
                No development plans available.
              </div>
            ) : (
              <div className="space-y-3">
                {developmentPlans.map((plan) => {
                  const quarterPlans = Array.isArray(plan?.quarterPlans)
                    ? plan.quarterPlans
                    : [];
                  return (
                    <div
                      key={String(plan?._id || `${plan?.employee}-${plan?.reviewYear}`)}
                      className="rounded-lg border border-gray-200 p-4"
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-gray-800">
                          Review Year: {plan?.reviewYear || "N/A"}
                        </span>
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          {String(plan?.status || "draft").replace(/_/g, " ")}
                        </span>
                      </div>

                      {quarterPlans.length === 0 ? (
                        <p className="text-sm text-gray-500">No quarter activities yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {quarterPlans.map(
                            (quarterPlan: Record<string, any>, quarterIndex: number) => {
                            const activities = Array.isArray(quarterPlan?.activities)
                              ? quarterPlan.activities
                              : [];
                            return (
                              <div
                                key={String(quarterPlan?.quarter || quarterIndex)}
                                className="rounded-md border border-gray-200 bg-gray-50 p-3"
                              >
                                <p className="text-sm font-semibold text-gray-800">
                                  {quarterPlan?.quarter || "Quarter"}
                                </p>
                                {activities.length === 0 ? (
                                  <p className="mt-1 text-xs text-gray-500">No activities.</p>
                                ) : (
                                  <div className="mt-2 space-y-2">
                                    {activities.map(
                                      (activity: Record<string, any>, activityIndex: number) => (
                                      <div
                                        key={String(
                                          activity?._id || `${activity?.title}-${activityIndex}`,
                                        )}
                                        className="rounded-lg border border-gray-200 bg-white p-3"
                                      >
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                          <p className="text-sm font-medium text-gray-800">
                                            {activity?.title || "Untitled"}
                                          </p>
                                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                                            {String(activity?.status || "planned").replace(
                                              /_/g,
                                              " ",
                                            )}
                                          </span>
                                        </div>

                                        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                          <div className="rounded-md bg-slate-50 px-2.5 py-2">
                                            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                                              Start Batch
                                            </p>
                                            <p className="text-xs text-slate-700">
                                              {activity?.startDate
                                                ? formatDateMMMDDYYY(activity.startDate)
                                                : "N/A"}
                                            </p>
                                          </div>
                                          <div className="rounded-md bg-slate-50 px-2.5 py-2">
                                            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                                              End Batch
                                            </p>
                                            <p className="text-xs text-slate-700">
                                              {activity?.endDate
                                                ? formatDateMMMDDYYY(activity.endDate)
                                                : "N/A"}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                      ),
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                            },
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {changePassword && <ChangePasswordModal onClose={() => setSearchParams({})} />}
      <CertificatePreviewModal
        isOpen={!!previewCertificate}
        onClose={() => setPreviewCertificate(null)}
        onDownload={handleDownloadCertificate}
        certificate={previewCertificate}
        learnerName={learnerName}
        organizationName={currentUser.user.organization.name}
      />
    </div>
  );
}
