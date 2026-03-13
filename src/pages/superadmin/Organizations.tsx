import { useNavigate, useSearchParams } from "react-router-dom";
import Button from "../../components/common/Button";
import OrganizationCard from "../../components/common/OrganizationCard";
import { FaPlus } from "react-icons/fa6";
import CardSkeleton from "../../components/skeleton/CardSkeleton";
import { useInfiniteOrganizations } from "../../hooks/useOrganization";
import { useState, useEffect } from "react";
import { IoFilterOutline } from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion"; // Import Framer Motion
import { cardVariants } from "../../lib/animations";

export default function Organizations() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const [selectedType, setSelectedType] = useState(
    searchParams.get("type") || ""
  );
  const [sortBy, setSortBy] = useState(
    searchParams.get("sort") || "-updatedAt"
  );
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    isLoading,
  } = useInfiniteOrganizations({
    limit: 8,
    searchTerm,
    sort: sortBy,
    filter: selectedType ? { key: "type", value: selectedType } : undefined,
  });

  useEffect(() => {
    let isThrottled = false;

    const handleScroll = () => {
      if (isThrottled) return;

      isThrottled = true;
      setTimeout(() => {
        isThrottled = false;
      }, 300);
      const scrollPosition = window.innerHeight + window.scrollY;
      const scrollThreshold = document.documentElement.scrollHeight - 800;

      if (scrollPosition >= scrollThreshold) {
        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      }
    };

    setTimeout(() => {
      if (
        window.innerHeight >= document.documentElement.scrollHeight &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        fetchNextPage();
      }
    }, 500);

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

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

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      if (type) {
        newParams.set("type", type);
      } else {
        newParams.delete("type");
      }
      return newParams;
    });
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      if (sort) {
        newParams.set("sort", sort);
      } else {
        newParams.delete("sort");
      }
      return newParams;
    });
  };

  const totalOrganizations =
    data?.pages.reduce((total, page) => total + page.organizations.length, 0) ||
    0;

  const allOrganizations =
    data?.pages.flatMap((page) => page.organizations) || [];

  const ORGANIZATION_TYPES = ["corporate", "school"];
  const SORT_OPTIONS = [
    { value: "-updatedAt", label: "Last Updated (Newest)" },
    { value: "updatedAt", label: "Last Updated (Oldest)" },
    { value: "name", label: "Name (A-Z)" },
    { value: "-name", label: "Name (Z-A)" },
    { value: "code", label: "Code (A-Z)" },
    { value: "-code", label: "Code (Z-A)" },
  ];

  return (
    <div className="max-w-7xl mx-auto py-12 lg:py-6 px-6 overflow-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-2xl sm:text-3xl font-bold">All Organizations</h3>
        <Button
          onClick={() => navigate("/admin/organization/create")}
          className="bg-secondary border border-secondary text-white hover:bg-white hover:text-primary hover:border-primary transition-all duration-300 w-full sm:w-auto"
        >
          <FaPlus className="mr-2" /> Create New Organization
        </Button>
      </div>

      {/* Search and Filter Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:py-6 gap-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center flex-wrap">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#3E5B93] w-full"
            />
          </div>

          <div className="relative w-full sm:w-40">
            <select
              value={selectedType}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#3E5B93] appearance-none w-full"
            >
              <option value="">All Types</option>
              {ORGANIZATION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
            <IoFilterOutline className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>

          <div className="relative w-full sm:w-56">
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#3E5B93] appearance-none w-full"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <IoFilterOutline className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {isLoading ? (
          [1, 2, 3, 4].map((index) => <CardSkeleton key={index} />)
        ) : status === "error" ? (
          <div className="col-span-full text-center py-8 text-red-500">
            Error loading organizations
          </div>
        ) : allOrganizations.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            No organizations found
          </div>
        ) : (
          <AnimatePresence>
            {allOrganizations.map((org, index: number) => (
              <motion.div
                key={org._id}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                custom={index} // Pass index for staggered animation
              >
                <OrganizationCard
                  name={org.name}
                  code={org.code}
                  type={org.type}
                  lastUpdated={org.updatedAt}
                  imageUrl={org.branding?.logo}
                  onClick={() => navigate(`/admin/organization/${org.code}`)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Load More Button */}
      {hasNextPage && (
        <div className="flex justify-center mt-6 sm:mt-8">
          <Button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="bg-white border border-secondary text-secondary hover:bg-secondary hover:text-white transition-all duration-300 w-full sm:w-auto px-4 sm:px-6"
          >
            {isFetchingNextPage ? "Loading more..." : "Load More"}
          </Button>
        </div>
      )}

      {/* Total Count */}
      <div className="text-center mt-4 text-sm text-gray-500">
        <span className="font-medium">
          {totalOrganizations} organization{totalOrganizations !== 1 ? "s" : ""}{" "}
          loaded
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

      {/* Loading indicator for next page */}
      {isFetchingNextPage && (
        <div className="flex justify-center mt-4 items-center gap-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-secondary"></div>
          <span className="text-gray-600">Loading more organizations...</span>
        </div>
      )}
    </div>
  );
}
