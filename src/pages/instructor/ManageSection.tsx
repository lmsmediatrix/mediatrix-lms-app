import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Button from "../../components/common/Button";
import { FaAngleLeft, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useEffect, useState } from "react";
import CreateModuleTab from "./CreateModuleTab";
import CreateAnnouncementTab from "./CreateAnnouncementTab";
import CreateAssessmenttTab from "./CreateAssessmentTab";
import CreateGradesTab from "./CreateGradesTab";
import { TActiveTab } from "../../types/interfaces";
import { useSectionByCode } from "../../hooks/useSection";
import { getTerm } from "../../lib/utils";
import { useAuth } from "../../context/AuthContext";
import SectionStudents from "../../components/orgAdmin/SectionStudents";
import ModuleTabSkeleton from "../../components/skeleton/ModuleTabSkeleton";
import AnnouncementTabSkeleton from "../../components/skeleton/AnnouncementTabSkeleton";
import AssessmentTabSkeleton from "../../components/skeleton/AssessmentTabSkeleton";
import CreateGradesTabSkeleton from "../../components/skeleton/CreateGradesTabSkeleton";
import StudentsTabSkeleton from "../../components/skeleton/StudentsTabSkeleton";

export default function ManageSection() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const sectionCode = location.pathname.split("/")[4] as string;
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") || "modules") as TActiveTab;
  const modal = searchParams.get("modal");
  const orgType = currentUser.user.organization.type;

  const { data, isPending } = useSectionByCode({
    sectionCode,
  });
  const sectionData = data?.sections?.[0];
  const sectionTerm = getTerm("group", orgType);

  // State to track the current tab index for mobile view
  const [currentMobileTabIndex, setCurrentMobileTabIndex] = useState(0);

  const tabs = [
    { name: "Modules", value: "modules" },
    { name: "Assessments", value: "assessments" },
    { name: "Grading System", value: "grades" },
    { name: "Manage Students", value: "students" },
    { name: "Announcements", value: "announcements" },
  ];

  // Sync currentMobileTabIndex with activeTab from URL on mount
  useEffect(() => {
    const tabIndex = tabs.findIndex((tab) => tab.value === activeTab);
    if (tabIndex !== -1) {
      setCurrentMobileTabIndex(tabIndex);
    }
  }, [activeTab]);

  useEffect(() => {
    if (
      data?.sections[0]?._id &&
      !isPending &&
      (modal === "create-announcements" ||
        modal === "edit-announcements" ||
        modal === "create-assessment" ||
        modal === "edit-assessment" ||
        activeTab === "grades")
    ) {
      const currentParams = Object.fromEntries(searchParams.entries());
      setSearchParams({
        ...currentParams,
        sectionId: data.sections[0]._id,
      });
    }
  }, [data, modal, activeTab, searchParams, setSearchParams, isPending]);

  const handleTabClick = (tabValue: string) => {
    navigate(
      tabValue === "basics"
        ? location.pathname
        : `${location.pathname}?tab=${tabValue}`,
    );
  };

  // Function to handle Previous tab navigation
  const handlePreviousTab = () => {
    const newIndex =
      currentMobileTabIndex === 0 ? tabs.length - 1 : currentMobileTabIndex - 1;
    setCurrentMobileTabIndex(newIndex);
    navigate(`${location.pathname}?tab=${tabs[newIndex].value}`);
  };

  // Function to handle Next tab navigation
  const handleNextTab = () => {
    const newIndex =
      currentMobileTabIndex === tabs.length - 1 ? 0 : currentMobileTabIndex + 1;
    setCurrentMobileTabIndex(newIndex);
    navigate(`${location.pathname}?tab=${tabs[newIndex].value}`);
  };

  const renderTabContent = () => {
    if (isPending || !data) {
      switch (activeTab) {
        case "announcements":
          return <AnnouncementTabSkeleton />;
        case "assessments":
          return <AssessmentTabSkeleton />;
        case "grades":
          return <CreateGradesTabSkeleton />;
        case "students":
          return <StudentsTabSkeleton />;
        default:
          return <ModuleTabSkeleton />;
      }
    }

    switch (activeTab) {
      case "modules":
        return (
          <CreateModuleTab
            sectionName={sectionData.name}
            sectionCode={sectionCode}
          />
        );
      case "announcements":
        return (
          <CreateAnnouncementTab
            sectionName={sectionData.name}
            sectionCode={sectionCode}
          />
        );
      case "assessments":
        return (
          <CreateAssessmenttTab
            sectionName={sectionData.name}
            sectionCode={sectionCode}
          />
        );
      case "grades":
        return <CreateGradesTab sectionCode={sectionCode} />;
      case "students":
        return (
          <div className="border rounded-md bg-white shadow-md">
            <SectionStudents />
          </div>
        );
      default:
        return <div></div>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="md:mb-4">
        <Button
          variant="link"
          className="flex items-center gap-2 px-0"
          onClick={() => {
            navigate(location.pathname.replace("/manage", "?tab=modules"));
          }}
          disabled={isPending}
        >
          <FaAngleLeft /> Go back
        </Button>
        <div className=" mb-4 md:py-6">
          {sectionData?.name ? (
            <h1 className="text-2xl md:text-3xl font-bold">
              {sectionData?.name}
            </h1>
          ) : (
            <div className="h-8 w-64 bg-gray-300 rounded animate-pulse"></div>
          )}
          <p className="text-gray-500 text-sm">
            Manage your <span className="lowercase">{sectionTerm}</span> content
            through the tabs below.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 md:gap-8">
        {/* Tabs Navigation */}
        <div className="w-full lg:w-48">
          {/* Desktop View: Sidebar navigation */}
          <nav className="hidden lg:flex flex-col">
            {tabs.map(({ name, value }) => (
              <button
                key={value}
                onClick={() => handleTabClick(value)}
                className={`py-3 px-4 text-sm font-medium text-left hover:bg-gray-100
                  ${
                    value === activeTab
                      ? "text-primary bg-gray-100 border-l-4 border-primary"
                      : "text-gray-500 border-l-4 border-transparent"
                  }
                  `}
              >
                {name}
              </button>
            ))}
          </nav>

          {/* Mobile View: Single tab with Previous/Next buttons */}
          <div className="flex lg:hidden items-center justify-between w-full text-sm font-medium border-b-2 border-gray-200">
            <button
              onClick={handlePreviousTab}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-full border-2 border-gray-500 active:bg-gray-500"
              disabled={isPending}
            >
              <FaChevronLeft />
            </button>

            <button
              onClick={() => handleTabClick(tabs[currentMobileTabIndex].value)}
              className={`py-4 px-8 relative ${
                tabs[currentMobileTabIndex].value === activeTab
                  ? "text-[#3E5B93] border-b-4 border-[#3E5B93]"
                  : "border-b-4 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-all"
              }`}
              disabled={isPending}
            >
              {tabs[currentMobileTabIndex].name}
            </button>

            <button
              onClick={handleNextTab}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-full border-2 border-gray-500 active:bg-gray-500"
              disabled={isPending}
            >
              <FaChevronRight />
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1">{renderTabContent()}</div>
      </div>
    </div>
  );
}
