import { useLocation, useNavigate } from "react-router-dom";
import { IInstructor } from "../../types/interfaces";
import { useGetInstructorById } from "../../hooks/useInstructor";
import { useInstructorSections } from "../../hooks/useSection";
import UserDetailsSkeleton from "../../components/skeleton/UserDetailsSkeleton";
import UserSectionsSkeleton from "../../components/skeleton/UserSectionsSkeleton";
import Button from "../../components/common/Button";
import { FaAngleLeft, FaUserCircle } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { FiMail } from "react-icons/fi";
import { IoBookOutline } from "react-icons/io5";

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

// Define color classes for background and text
const colorStyles = [
  "bg-blue-100 text-blue-600 border-blue-600", // Blue
  "bg-yellow-100 text-yellow-600 border-yellow-600", // Yellow
  "bg-green-100 text-green-600 border-green-600", // Green
];
// Sections component

function SectionsDisplay({ instructorId }: { instructorId: string }) {
  const { data: sectionsData, isPending: isSectionsPending } =
    useInstructorSections({ instructorId });
  const sections: Section[] = sectionsData?.sections || [];

  if (isSectionsPending) {
    return <UserSectionsSkeleton />;
  }

  if (!sections.length) {
    return (
      <div className="mt-6 border rounded-xl p-6">
        <h2 className="text-3xl font-bold">Sections</h2>
        <p className="text-gray-600 mt-4">
          No sections available for this instructor.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 border rounded-xl p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <IoBookOutline className="size-6" />
          <h2 className="text-2xl font-bold">Sections</h2>
        </div>
        {/* <div className="flex items-center space-x-2">
          <span className="text-gray-600">Sort by:</span>
          <select className="border rounded-lg px-2 py-1 text-gray-600">
            <option>Newest</option>
            <option>Oldest</option>
          </select>
        </div> */}
      </div>

      {sections.map((section: Section) => {
        const totalLessons = section.modules.reduce(
          (sum: number, module: Module) => sum + (module.lessons?.length || 0),
          0
        );

        return (
          <div key={section._id} className="border-b pb-4 last:border-b-0">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-semibold">{section.name}</h3>
            </div>
            <div className="flex space-x-4 p-4 bg-gray-100 rounded-lg">
              <img
                src={section.course.thumbnail}
                alt={section.course.title}
                className="w-96 h-40 object-cover rounded-lg border"
              />
              <div className="flex-1">
                <p className="text-gray-600 mt-2">
                  {section.course.description}
                </p>
                <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                  <IoBookOutline className="size-4" /> {totalLessons} lesson(s)
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function InstructorDetailsPage() {
  const { currentUser } = useAuth();
  const orgType = currentUser.user.organization.code;
  const instructorId = useLocation().pathname.split("/").pop() || "";
  const {
    data: instructorDetails,
    isPending: isInstructorDetailsPending,
    isError,
  } = useGetInstructorById(instructorId);
  const navigate = useNavigate();

  // Handle error case - instructor not found
  if (isError) {
    return (
      <div className="max-w-7xl mx-auto pt-16 pb-6 px-6 lg:py-8 lg:px-8">
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-center space-y-6 p-8">
            <h1 className="text-6xl font-bold text-gray-800">404</h1>
            <h2 className="text-2xl font-semibold text-gray-700">
              Instructor Not Found
            </h2>
            <p className="text-gray-500 max-w-md">
              The instructor you are looking for might have been removed, had
              their ID changed, or is temporarily unavailable.
            </p>
            <Button
              variant="primary"
              onClick={() => navigate(-1)}
              className="px-6 py-3"
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isInstructorDetailsPending) {
    return (
      <div className="max-w-7xl mx-auto pt-16 pb-6 px-6 lg:py-8 lg:px-8 min-w-[1000px]">
        <div className="mt-6 flex space-x-6">
          <div className="flex-1">
            <UserDetailsSkeleton />
            <UserSectionsSkeleton />
          </div>
          <div className="w-1/3 bg-gray-100 p-4 rounded-xl">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="mt-4 space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-2">
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-2 w-full bg-gray-200 rounded-full animate-pulse" />
                </div>
              ))}
            </div>
            <div className="mt-8">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-48 bg-gray-200 rounded mt-2 animate-pulse" />
            </div>
            <div className="mt-8">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="mt-2 flex space-x-2">
                <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const instructor: IInstructor = instructorDetails?.data || {};

  return (
    <div className="max-w-7xl mx-auto pt-16 pb-6 px-6 lg:py-8 lg:px-8">
      <Button
        variant="link"
        className="flex items-center gap-2"
        onClick={() => navigate(-1)}
      >
        <FaAngleLeft /> Go back
      </Button>

      <div className="mt-4 flex space-x-6">
        <div className="flex-1">
          <div className="flex-1 border rounded-xl p-6 space-y-8 h-fit">
            <div className="flex justify-between items-start space-x-4">
              <div className="flex flex-1 gap-6 items-center">
                <div className="p-1 shadow-xl rounded-full">
                  {instructor.avatar ? (
                    <img
                      src={instructor.avatar}
                      alt="Profile"
                      className="w-28 h-28 rounded-full object-cover"
                    />
                  ) : (
                    <FaUserCircle className="w-28 h-28 text-gray-400" />
                  )}
                </div>
                <div className="">
                  <div className="flex gap-4 items-center">
                    <h1 className="text-3xl font-bold mb-2">{`${instructor.firstName} ${instructor.lastName}`}</h1>
                    <div className="flex justify-end py-1 px-2 bg-[color-mix(in_srgb,var(--color-primary)_5%,transparent_90%)] h-fit rounded-full">
                      <p className="text-primary capitalize text-sm font-medium">
                        {instructor.employmentType.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-600 flex gap-1 items-center">
                    <FiMail /> {instructor.email}
                  </p>
                  {orgType === "school" && (
                    <p className="text-gray-600">
                      Faculty of{" "}
                      <span className="font-semibold">
                        {instructor.faculty
                          ? typeof instructor.faculty === "string"
                            ? instructor.faculty
                            : instructor.faculty.name
                          : "N/A"}
                      </span>
                    </p>
                  )}
                  <div className="mt-2 flex space-x-2">
                    {instructor.expertise?.map(
                      (item: string, index: number) => {
                        // Cycle through colors using modulo
                        const style = colorStyles[index % 3];

                        return (
                          <span
                            key={index}
                            className={`text-sm px-2 py-[1px] rounded-full border font-medium ${style}`}
                          >
                            {item}
                          </span>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold">Bio</h2>
              <p className="mt-2 text-gray-600 bg-gray-100 p-4 rounded-lg">
                {instructor.bio || "No bio available for this instructor."}
              </p>
            </div>
          </div>

          <SectionsDisplay instructorId={instructorId} />
        </div>

        <div className="w-1/3 bg-gray-100 p-6 rounded-xl">
          <div>
            <p className="font-bold text-xl">Qualifications</p>
            <div>
              {instructor.qualifications && instructor.qualifications.length > 0 ? (
                instructor.qualifications?.map(
                  (qual: string, index: number) => {
                    // Define color classes for the dot
                    const dotColors = [
                      "bg-blue-500", // Blue
                      "bg-yellow-500", // Yellow
                      "bg-green-500", // Green
                    ];
                    // Cycle through colors using modulo
                    const dotColor = dotColors[index % 3];

                    return (
                      <div key={index} className="flex items-center mt-2 px-2">
                        <span
                          className={`w-2 h-2 rounded-full ${dotColor} mr-2`}
                        ></span>
                        <p className="text-gray-600 font-medium">{qual}</p>
                      </div>
                    );
                  }
                )
              ) : (
                  <p className="text-gray-600">No qualifications available</p>
              )}
            </div>
          </div>
          {instructor.socialLinks ? (
            <div className="mt-8 space-y-2">
              <p className="font-bold text-lg">Profile Link</p>
              <div className="space-x-2">
                <input
                  type="text"
                  value={instructor.socialLinks?.linkedIn || ""}
                  readOnly
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-600"
                />
              </div>
              <div className="space-x-2">
                <input
                  type="text"
                  value={instructor.socialLinks?.twitter || ""}
                  readOnly
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-600"
                />
              </div>
              <div className="space-x-2">
                <input
                  type="text"
                  value={instructor.socialLinks?.website || ""}
                  readOnly
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-600"
                />
              </div>
            </div>
          ) : (
            <div className="mt-8">
              <p className="font-bold text-lg">Profile Link</p>
              <p className="text-gray-600">No social links available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
