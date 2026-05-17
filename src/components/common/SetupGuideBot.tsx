import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiHelpCircle,
  FiX,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { getSetupTargetId } from "./SideNavigation";

interface SetupGuideBotProps {
  onActiveTargetChange: (target: string | null) => void;
}

interface SetupStep {
  title: string;
  description: string;
  targetLabel: string;
  path: string;
}

const STORAGE_KEY = "lms-admin-setup-guide-collapsed";

const buildPath = (code: string, path: string) => path.replace(":code", code);

export default function SetupGuideBot({
  onActiveTargetChange,
}: SetupGuideBotProps) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem(STORAGE_KEY) !== "true";
  });
  const [activeIndex, setActiveIndex] = useState(0);

  const role = currentUser?.user.role;
  const orgCode = currentUser?.user.organization?.code;
  const orgType = currentUser?.user.organization?.type;

  const steps = useMemo<SetupStep[]>(() => {
    if (!orgCode) return [];

    const commonSteps: SetupStep[] = [
      {
        title: "Create courses",
        description:
          "Add the LMS courses that will become the learning content container.",
        targetLabel: "Courses",
        path: buildPath(orgCode, "/:code/admin/course"),
      },
      {
        title: "Add instructors",
        description:
          "Register instructors before assigning them to classes or batches.",
        targetLabel: "Instructor",
        path: buildPath(orgCode, "/:code/admin/instructor"),
      },
      {
        title: orgType === "corporate" ? "Add employees" : "Add students",
        description:
          orgType === "corporate"
            ? "Upload or create employee accounts that will receive training."
            : "Upload or create student accounts that will enroll in sections.",
        targetLabel: "Student",
        path: buildPath(orgCode, "/:code/admin/student"),
      },
      {
        title: orgType === "corporate" ? "Create batches" : "Create sections",
        description:
          "Group learners, assign instructors, and connect the right course.",
        targetLabel: "Sections",
        path: buildPath(orgCode, "/:code/admin/section"),
      },
      {
        title: "Review progress",
        description:
          "Use progress tracking once learners begin completing lessons and assessments.",
        targetLabel: "Progress",
        path: buildPath(orgCode, "/:code/admin/progress"),
      },
      {
        title: "Open reports",
        description:
          "Export and review LMS activity after setup and learner activity are available.",
        targetLabel: "Reports",
        path: buildPath(orgCode, "/:code/admin/reports"),
      },
    ];

    if (orgType === "corporate") {
      return [
        {
          title: "Start in configuration",
          description:
            "Open the configuration group first. This is where the corporate LMS setup foundation lives.",
          targetLabel: "Configuration",
          path: buildPath(orgCode, "/:code/admin/tna/configuration"),
        },
        {
          title: "Set programs",
          description:
            "Create training programs so courses and development plans can be organized cleanly.",
          targetLabel: "Program",
          path: buildPath(orgCode, "/:code/admin/program"),
        },
        {
          title: "Set departments",
          description:
            "Add departments before mapping employees, roles, and training needs.",
          targetLabel: "Department",
          path: buildPath(orgCode, "/:code/admin/department"),
        },
        {
          title: "Define skills and roles",
          description:
            "Map job roles to required skills so TNA recommendations have a baseline.",
          targetLabel: "Skill and Role",
          path: buildPath(orgCode, "/:code/admin/tna/configuration"),
        },
        {
          title: "Set training needs",
          description:
            "Create training gaps and needs that will feed recommendations and plans.",
          targetLabel: "Training Needs",
          path: buildPath(orgCode, "/:code/admin/tna"),
        },
        {
          title: "Prepare training management",
          description:
            "Use this area to execute and monitor training actions from the TNA flow.",
          targetLabel: "Training Management",
          path: buildPath(orgCode, "/:code/admin/tna/execution"),
        },
        ...commonSteps,
        {
          title: "Check employee TNA",
          description:
            "Review employee recommendations after skills, roles, and needs are ready.",
          targetLabel: "Employee TNA",
          path: buildPath(orgCode, "/:code/admin/tna/employees"),
        },
        {
          title: "Create development plans",
          description:
            "Turn recommended gaps into employee development plans and assigned training.",
          targetLabel: "Development Plan",
          path: buildPath(orgCode, "/:code/admin/tna/development-plan"),
        },
      ];
    }

    return [
      {
        title: "Start in configuration",
        description:
          "Open the configuration group first. These records should exist before creating classes.",
        targetLabel: "Configuration",
        path: buildPath(orgCode, "/:code/admin/category"),
      },
      {
        title: "Create categories",
        description:
          "Set course categories so learning content can be grouped and filtered.",
        targetLabel: "Category",
        path: buildPath(orgCode, "/:code/admin/category"),
      },
      {
        title: "Create faculties",
        description:
          "Add faculties before programs so academic ownership is clear.",
        targetLabel: "Faculty",
        path: buildPath(orgCode, "/:code/admin/faculty"),
      },
      {
        title: "Create programs",
        description:
          "Add programs after faculties, then attach students and sections to them.",
        targetLabel: "Program",
        path: buildPath(orgCode, "/:code/admin/program"),
      },
      ...commonSteps,
    ];
  }, [orgCode, orgType]);

  const activeStep = steps[activeIndex];
  const activeTarget = activeStep ? getSetupTargetId(activeStep.targetLabel) : null;

  useEffect(() => {
    onActiveTargetChange(isOpen ? activeTarget : null);
    return () => onActiveTargetChange(null);
  }, [activeTarget, isOpen, onActiveTargetChange]);

  if (role !== "admin" || !orgCode || steps.length === 0) {
    return null;
  }

  const goToStep = (nextIndex: number) => {
    const boundedIndex = Math.min(Math.max(nextIndex, 0), steps.length - 1);
    setActiveIndex(boundedIndex);
    navigate(steps[boundedIndex].path);
  };

  const closeGuide = () => {
    setActiveIndex(0);
    setIsOpen(false);
    window.localStorage.setItem(STORAGE_KEY, "true");
  };

  const openGuide = () => {
    setActiveIndex(0);
    setIsOpen(true);
    window.localStorage.removeItem(STORAGE_KEY);
    navigate(steps[0].path);
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={openGuide}
        className="fixed bottom-5 right-5 z-[70] flex size-14 items-center justify-center rounded-full bg-primary text-white shadow-[0_18px_40px_-18px_rgba(15,23,42,0.7)] transition hover:scale-105"
        aria-label="Open LMS setup guide"
      >
        <span className="text-2xl font-bold leading-none">?</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-[70] w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_-28px_rgba(15,23,42,0.55)]">
      <div className="flex items-center gap-3 border-b border-slate-100 bg-[color-mix(in_srgb,var(--color-primary)_10%,white_90%)] px-4 py-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-primary text-white">
          <FiHelpCircle size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-900">LMS setup assistant</p>
          <p className="text-xs font-medium text-slate-500">
            Step {activeIndex + 1} of {steps.length}
          </p>
        </div>
        <button
          type="button"
          onClick={closeGuide}
          className="flex size-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-white hover:text-slate-800"
          aria-label="Close setup guide"
        >
          <FiX size={18} />
        </button>
      </div>

      <div className="space-y-4 px-4 py-4">
        <div>
          <p className="text-base font-bold text-slate-900">{activeStep.title}</p>
          <p className="mt-1 text-sm leading-5 text-slate-600">
            {activeStep.description}
          </p>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${((activeIndex + 1) / steps.length) * 100}%` }}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => goToStep(activeIndex - 1)}
            disabled={activeIndex === 0}
            className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FiChevronLeft size={16} />
            Back
          </button>
          <button
            type="button"
            onClick={() =>
              activeIndex === steps.length - 1 ? closeGuide() : goToStep(activeIndex + 1)
            }
            className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition hover:bg-[color-mix(in_srgb,var(--color-primary)_86%,black_14%)]"
          >
            {activeIndex === steps.length - 1 ? (
              <>
                Done
                <FiCheck size={16} />
              </>
            ) : (
              <>
                Next
                <FiChevronRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
