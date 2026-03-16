import { useInfiniteStudentSections } from "../../hooks/useSection";
import SectionCard from "../../components/common/SectionCard";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import CardSkeleton from "../../components/skeleton/CardSkeleton";
import { getTerm } from "../../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { cardVariants } from "../../lib/animations";
import { useDebounce } from "../../hooks/useDebounce";
import { useStudentCompletedAssessments } from "../../hooks/useStudentAssessmentGrade";

interface Section {
  _id: string;
  code: string;
  name: string;
  course: {
    _id: string;
    thumbnail: string;
  };
  instructor: {
    firstName: string;
    lastName: string;
  };
  modules?: Array<{
    _id: string;
    lessons: Array<{
      _id: string;
      progress?: Array<{
        userId: string;
        status: string;
      }>;
    }>;
  }>;
  assessments?: Array<{ _id: string }>;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function StudentSectionsPage() {
  const { currentUser } = useAuth();
  const orgType = currentUser.user.organization.type;
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || "",
  );

  // Debounce the search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Define dynamic terms
  const sectionTerm = getTerm("group", orgType);

  const { data: completedAssessmentIds } = useStudentCompletedAssessments(
    currentUser.user.id,
  );

  const computeSectionProgress = (section: Section) => {
    const userId = currentUser.user.id;
    let totalLessons = 0;
    let completedLessons = 0;
    (section.modules || []).forEach((mod) => {
      (mod.lessons || []).forEach((lesson) => {
        totalLessons++;
        if (
          (lesson.progress || []).some(
            (p) => p.userId?.toString() === userId && p.status === "completed",
          )
        ) {
          completedLessons++;
        }
      });
    });
    const totalAssessments = (section.assessments || []).length;
    const completedAssessments = completedAssessmentIds
      ? (section.assessments || []).filter((a) =>
          completedAssessmentIds.has(a._id?.toString()),
        ).length
      : 0;
    const totalItems = totalLessons + totalAssessments;
    const completedItems = completedLessons + completedAssessments;
    const percent =
      totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    return {
      percent,
      completedLessons,
      totalLessons,
      completedAssessments,
      totalAssessments,
    };
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    isLoading,
  } = useInfiniteStudentSections({
    searchTerm: debouncedSearchTerm, // Use debounced search term
    studentId: currentUser.user.id,
    limit: 8,
  });

  const navigate = useNavigate();

  // Calculate total sections across all pages
  const totalSections =
    data?.pages.reduce((total, page) => total + page.sections.length, 0) || 0;

  // Get all sections from all pages
  const allSections = data?.pages.flatMap((page) => page.sections) || [];

  // Debounced scroll handler
  const handleScroll = useCallback(() => {
    const scrollPosition = window.innerHeight + window.scrollY;
    const scrollThreshold = document.documentElement.scrollHeight - 200; // Reduced threshold for smoother triggering

    if (
      scrollPosition >= scrollThreshold &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    // Initial fetch for first page if content doesn't fill the viewport
    const checkInitialLoad = () => {
      if (
        window.innerHeight >= document.documentElement.scrollHeight &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        fetchNextPage();
      }
    };

    // Debounce scroll event
    let timeoutId: ReturnType<typeof setTimeout>;
    const debouncedScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScroll, 100); // Reduced debounce time
    };

    checkInitialLoad();
    window.addEventListener("scroll", debouncedScroll);
    return () => {
      window.removeEventListener("scroll", debouncedScroll);
      clearTimeout(timeoutId);
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, handleScroll]);

  const handleSectionClick = (sectionCode: string) => {
    navigate(
      `/${currentUser.user.organization.code}/student/sections/${sectionCode}`,
    );
  };

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

  return (
    <div className="max-w-7xl mx-auto py-6 md:py-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">My {sectionTerm}</h1>
        <div className="relative">
          <input
            type="text"
            placeholder={`Search ${sectionTerm.toLowerCase()}`}
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-40 md:w-[20vw] pl-4 md:pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {isLoading ? (
          // Initial loading skeletons
          Array(4)
            .fill(0)
            .map((_, index) => (
              <CardSkeleton key={`skeleton-initial-${index}`} />
            ))
        ) : status === "error" ? (
          <div className="col-span-4 text-center text-red-500">
            Error loading {sectionTerm.toLowerCase()}
          </div>
        ) : allSections.length > 0 ? (
          <AnimatePresence>
            {allSections.map((section: Section, index: number) => (
              <motion.div
                key={section._id}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                custom={index % 4} // Stagger animations per page (reset per 4 items)
                layout // Add layout prop for smooth grid transitions
              >
                <SectionCard
                  code={section.code}
                  name={section.name}
                  course={section.course}
                  status={section.status}
                  instructor={
                    section.instructor.firstName +
                    " " +
                    section.instructor.lastName
                  }
                  progress={computeSectionProgress(section)}
                  onClick={() => handleSectionClick(section.code)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="col-span-4 text-center text-gray-500">
            No {sectionTerm.toLowerCase()} available
          </div>
        )}

        {/* Skeletons for infinite loading */}
        {isFetchingNextPage && (
          <AnimatePresence>
            {Array(4)
              .fill(0)
              .map((_, index) => (
                <motion.div
                  key={`skeleton-next-${index}`}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <CardSkeleton />
                </motion.div>
              ))}
          </AnimatePresence>
        )}
      </div>

      {/* Total Count */}
      <div className="text-center mt-4 text-sm text-gray-500">
        <span className="font-medium">
          {totalSections} {sectionTerm.toLowerCase()}
          {totalSections !== 1 ? "s" : ""} loaded
        </span>
        {data?.pages && (
          <div className="mt-2">
            <span className="bg-gray-100 px-3 py-1 rounded-full">
              Page {data.pages.length} of{" "}
              {data.pages[0]?.pagination?.totalPages || "?"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
