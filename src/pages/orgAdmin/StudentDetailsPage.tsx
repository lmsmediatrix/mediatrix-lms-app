import { useLocation, useNavigate } from "react-router-dom";
import { useGetStudentProfile } from "../../hooks/useStudent";
import { FaAngleLeft, FaUserCircle } from "react-icons/fa";
import {
  FaLinkedin,
  FaTwitter,
  FaGlobe,
  FaRegUser,
  FaHashtag,
  FaBook,
} from "react-icons/fa6";
import ProfilePageSkeleton from "../../components/skeleton/ProfilePage";
import UserSectionsSkeleton from "../../components/skeleton/UserSectionsSkeleton";
import { IStudent } from "../../types/interfaces";
import { useStudentSections } from "../../hooks/useSection";
import Button from "../../components/common/Button";
import { useAuth } from "../../context/AuthContext";
import { getTerm, getYearLevelText } from "../../lib/utils";

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
  course: Course;
  modules: Module[];
}

interface InfoGridProps {
  items: { label: string; value: string; icon?: JSX.Element }[];
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
}: {
  userId: string;
  useSectionsHook: any;
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
          <span>Sections</span>
        </h3>
        <p className="text-gray-600 text-sm">
          No sections available for this student.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto rounded-xl border border-gray-200 shadow-sm bg-white p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-medium flex items-center space-x-2 text-gray-800">
          <FaRegUser className="text-gray-500 text-lg" />
          <span>Sections</span>
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-gray-600 text-sm">Sort by:</span>
          <select className="border border-gray-200 rounded-lg px-2 py-1 text-gray-600 text-sm">
            <option>Newest</option>
            <option>Oldest</option>
          </select>
        </div>
      </div>

      {sections.map((section: Section) => {
        const totalLessons = section.modules.reduce(
          (sum: number, module: Module) => sum + (module.lessons?.length || 0),
          0
        );

        return (
          <div key={section._id} className="border-b pb-4 last:border-b-0">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">
              {section.name}
            </h4>
            <div className="flex space-x-4">
              <img
                src={section.course.thumbnail}
                alt={section.course.title}
                className="w-48 h-28 object-cover rounded-lg border border-gray-200"
              />
              <div className="flex-1">
                <p className="text-gray-600 text-sm">
                  {section.course.description}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  {totalLessons} lessons
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function StudentDetailsPage() {
  const location = useLocation();
  const studentId = location.pathname.split("/").pop();
  const { data, isPending } = useGetStudentProfile(studentId as string);
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const orgType = currentUser.user.organization.type;
  const learnerTerm = getTerm("learner", orgType);

  if (isPending) return <ProfilePageSkeleton />;

  const userData = data?.data as IStudent;

  const socialIcons = {
    linkedIn: <FaLinkedin className="text-blue-600 text-lg" />,
    twitter: <FaTwitter className="text-blue-400 text-lg" />,
    website: <FaGlobe className="text-gray-600 text-lg" />,
  };

  const infoItems = [
    {
      label: "Student ID",
      value: userData?.studentId || "",
      icon: <FaHashtag />,
    },
    {
      label: "Program",
      value: userData?.program?.name || "",
      icon: <FaBook />,
    },
    {
      label: "Year Level",
      value: userData?.yearLevel ? getYearLevelText(userData.yearLevel) : "",
      icon: <FaBook />,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{learnerTerm} Details</h1>
          <p className="text-sm text-gray-500">
            View student account information
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

      {/* Profile Section */}
      <div className="max-w-4xl mx-auto rounded-xl border border-gray-200 shadow-sm bg-white mb-4">
        <div className="bg-[#F5F8FF] rounded-t-xl p-6">
          <div className="flex items-center space-x-4">
            <div>
              {userData?.avatar ? (
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
                <h2 className="text-2xl font-semibold text-gray-800">{`${userData?.firstName} ${userData?.lastName}`}</h2>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-sm text-gray-600">
                    {userData?.email}
                  </span>
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    Active
                  </span>
                </div>
              </div>
              {userData?.gpa && (
                <div className="mt-1 py-1 px-3 bg-gray-100 rounded-full text-center">
                  <p className="text-gray-800 text-sm">
                    GPA: <span className="font-bold">{userData.gpa}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Student Details Section */}
        {orgType === "school" && (
          <div className="p-6">
            <h3 className="text-base font-medium flex items-center space-x-2 text-gray-800 mb-4">
              <FaRegUser className="text-gray-500 text-lg" />
              <span>Student Details</span>
            </h3>
            <InfoGrid items={infoItems} />
          </div>
        )}

        {/* Social Links Section */}
        <div className="p-6">
          <h3 className="text-base font-medium flex items-center space-x-2 text-gray-800 mb-4">
            <FaRegUser className="text-gray-500 text-lg" />
            <span>Social Links</span>
          </h3>
          <div className="space-y-2">
            {!userData?.socialLinks ||
            Object.values(userData.socialLinks).every((url) => !url) ? (
              <p className="text-gray-600 text-sm">No social links available</p>
            ) : (
              Object.entries(userData.socialLinks).map(([platform, url]) =>
                url ? (
                  <div key={platform} className="flex items-center space-x-2">
                    <span className="w-6 h-6 flex items-center justify-center">
                      {socialIcons[platform as keyof typeof socialIcons]}
                    </span>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm truncate"
                    >
                      {url}
                    </a>
                  </div>
                ) : null
              )
            )}
          </div>
        </div>
      </div>

      {/* Sections Display */}
      <SectionsDisplayGeneric
        userId={studentId as string}
        useSectionsHook={useStudentSections}
      />
    </div>
  );
}
