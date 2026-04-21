import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { z } from "zod";
import Button from "../../components/common/Button";
import GroupedDataTable, {
  GroupedTableColumn,
  GroupedTableGroup,
} from "../../components/common/GroupedDataTable";
import HoverHelpTooltip from "../../components/common/HoverHelpTooltip";
import { SearchableSelect } from "../../components/SearchableSelect";
import { useAuth } from "../../context/AuthContext";
import { useCourses } from "../../hooks/useCourse";
import { useSearchStudents } from "../../hooks/useStudent";
import {
  useAnalyzeTna,
  useGetEmployeeTnaRecommendations,
  useGetTnaEmployeeSkills,
  useGetTnaRecommendations,
  useGetTnaRoleRequirements,
  useGetTnaSkills,
  useUpsertEmployeeSkill,
} from "../../hooks/useTna";
import { getTerm } from "../../lib/utils";

type LevelRow = { skillId: string; level: number };
type ComplianceRow = { title: string; courseId: string; mandatory: boolean };
type RecommendationStatus = "pending" | "assigned" | "completed";
type TrainingProgressStatus = "pending" | "in_progress" | "completed";
type StepKey = "employee-skills" | "analyze" | "recommendations";
type PrefillEmployeeSkill = { skillId?: string; skillName?: string; level?: number };
type RecommendationRow = {
  _id: string;
  employee?: { _id?: string; firstName?: string; lastName?: string; email?: string };
  jobRole?: string;
  createdAt?: string;
  updatedAt?: string;
  status?: string;
  skillGaps?: Array<unknown>;
  recommendedTrainings?: Array<{
    title?: string;
    reasonType?: string;
    progressStatus?: string;
  }>;
};

const FLOW_STEPS: Array<{
  key: StepKey;
  title: string;
  description: string;
}> = [
  {
    key: "employee-skills",
    title: "Capture Employee Role and Skills",
    description: "Select employee, target role, and current competency levels.",
  },
  {
    key: "analyze",
    title: "Run TNA Analysis",
    description: "Compare gaps and include test, manager, compliance, and request signals.",
  },
  {
    key: "recommendations",
    title: "Track Recommendations",
    description: "Review recommendations and move their status to assigned/completed.",
  },
];

const TNA_ACTIVE_STEP_STORAGE_KEY = "tna_active_step";

const STEP_GUIDANCE: Record<
  StepKey,
  {
    goal: string;
    checklist: string[];
  }
> = {
  "employee-skills": {
    goal: "Capture employee profile inputs so gaps can be measured accurately.",
    checklist: [
      "Select an employee profile.",
      "Select the target role from configured role standards.",
      "Add current skill levels using the same 1 to 5 scale.",
      "Save before moving to analysis.",
    ],
  },
  analyze: {
    goal: "Run analysis to compare role standards versus employee profile and extra signals.",
    checklist: [
      "Choose employee and job role.",
      "Review role standard preview to confirm required levels.",
      "Run analysis to generate recommendations.",
    ],
  },
  recommendations: {
    goal: "Track and manage generated recommendations through completion.",
    checklist: [
      "Review skill gap and recommendation counts per employee.",
      "Status updates automatically when downstream workflow events are triggered.",
      "Open employee details for full recommendation breakdown.",
    ],
  },
};

const parseList = (value: string): string[] =>
  value
    .split(/[\n,]/g)
    .map((item) => item.trim())
    .filter(Boolean);

const skillPayloadSchema = z.object({
  skillId: z.string().trim().min(1, "Skill is required"),
  currentLevel: z.number().min(0).max(5),
});

const saveEmployeeSkillsFormSchema = z.object({
  employeeId: z.string().trim().min(1, "Employee is required"),
  jobRole: z.string().trim().min(1, "Job role is required. Configure role standards in Skill and Role."),
  skills: z.array(skillPayloadSchema).min(1, "Add at least one skill"),
});

const runAnalysisFormSchema = z.object({
  employeeId: z.string().trim().min(1, "Employee is required"),
  jobRole: z.string().trim().min(1, "Job role is required"),
  preAssessmentScore: z
    .number()
    .min(0, "Pre-assessment score must be between 0 and 100")
    .max(100, "Pre-assessment score must be between 0 and 100")
    .optional(),
  performanceGaps: z.array(z.string().trim().min(1).max(200)),
  managerRecommendations: z.array(z.string().trim().min(1).max(200)),
  employeeRequests: z.array(z.string().trim().min(1).max(200)),
  complianceRequirements: z.array(
    z.object({
      title: z.string().trim().min(2).max(200),
      courseId: z.string().trim().optional(),
      mandatory: z.boolean(),
    })
  ),
});

const getFirstZodIssueMessage = (error: z.ZodError): string =>
  error.issues[0]?.message || "Please check the form inputs.";

const isTnaEligibleLearnerRole = (role: unknown): boolean => {
  const normalizedRole = String(role || "")
    .trim()
    .toLowerCase();
  return normalizedRole === "employee" || normalizedRole === "student";
};

const parsePrefillEmployeeSkills = (value: string): PrefillEmployeeSkill[] => {
  if (!value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const raw = item as { skillId?: string; skillName?: string; level?: number };
        return {
          skillId: typeof raw.skillId === "string" ? raw.skillId : "",
          skillName: typeof raw.skillName === "string" ? raw.skillName : "",
          level: typeof raw.level === "number" ? raw.level : undefined,
        };
      })
      .filter(Boolean) as PrefillEmployeeSkill[];
  } catch (_error) {
    return [];
  }
};

const getErrorMessage = (error: unknown): string => {
  if (typeof error === "string" && error.trim()) return error;
  if (error && typeof error === "object") {
    const err = error as {
      response?: {
        data?: {
          message?: unknown;
          error?: unknown;
          errors?: unknown;
        };
      };
      data?: { message?: unknown; error?: unknown };
      message?: unknown;
    };

    const messageCandidates = [
      err.response?.data?.error,
      err.response?.data?.message,
      err.response?.data?.errors,
      err.data?.error,
      err.data?.message,
      err.message,
    ];

    for (const candidate of messageCandidates) {
      if (typeof candidate === "string" && candidate.trim()) return candidate;
      if (candidate && typeof candidate === "object") {
        const nestedMessage = (candidate as { message?: unknown }).message;
        if (typeof nestedMessage === "string" && nestedMessage.trim()) return nestedMessage;
      }
    }
  }
  return "Something went wrong";
};

const normalizeStatus = (status?: string): RecommendationStatus => {
  if (status === "assigned" || status === "completed") return status;
  return "pending";
};

const themePrimarySoftBadgeClass =
  "border-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_28%,white)] bg-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_10%,white)] text-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_80%,black)]";
const themePrimaryStrongBadgeClass =
  "border-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_34%,white)] bg-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_16%,white)] text-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_86%,black)]";
const themeSecondarySoftBadgeClass =
  "border-[color:color-mix(in_srgb,var(--color-secondary,#0ea5e9)_30%,white)] bg-[color:color-mix(in_srgb,var(--color-secondary,#0ea5e9)_10%,white)] text-[color:color-mix(in_srgb,var(--color-secondary,#0ea5e9)_80%,black)]";
const themeSecondaryTextClass =
  "text-[color:color-mix(in_srgb,var(--color-secondary,#0ea5e9)_80%,black)]";

const getRecommendationStatusMeta = (status: RecommendationStatus) => {
  if (status === "completed") {
    return {
      label: "Completed",
      className: themePrimaryStrongBadgeClass,
    };
  }
  if (status === "assigned") {
    return {
      label: "Assigned",
      className: themePrimarySoftBadgeClass,
    };
  }
  return {
    label: "Pending",
    className: themeSecondarySoftBadgeClass,
  };
};

const normalizeRoleValue = (value: string): string => value.trim().toLowerCase();
const normalizeTrainingProgressStatus = (value?: string): TrainingProgressStatus => {
  if (value === "in_progress" || value === "completed") return value;
  return "pending";
};

const parseSkillLevelFromTrainingTitle = (
  title: string
): { skillName: string; targetLevel: number | null } => {
  const trimmedTitle = String(title || "").trim();
  if (!trimmedTitle) return { skillName: "", targetLevel: null };

  const match = trimmedTitle.match(/\s+(I|II|III|IV|V)$/i);
  if (!match) return { skillName: trimmedTitle, targetLevel: null };

  const roman = String(match[1] || "").toUpperCase();
  const map: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5 };
  const targetLevel = map[roman] ?? null;
  return {
    skillName: trimmedTitle.replace(/\s+(I|II|III|IV|V)$/i, "").trim(),
    targetLevel,
  };
};

export default function TnaPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orgCode = currentUser?.user?.organization?.code || "";
  const orgType = currentUser?.user?.organization?.type;
  const organizationId = currentUser?.user?.organization?._id;
  const employeeTerm = getTerm("learner", orgType || "school");
  const employeeTermPlural = getTerm("learner", orgType || "school", true);

  const skillsQuery = useGetTnaSkills({ limit: 200, skip: 0 });
  const roleRequirementsQuery = useGetTnaRoleRequirements({ limit: 200, skip: 0 });
  const studentsQuery = useSearchStudents({
    organizationId,
    limit: 200,
    skip: 0,
    archiveStatus: "none",
  });
  const coursesQuery = useCourses({ organizationId, limit: 200, skip: 0, archiveStatus: "none" });
  const recommendationsQuery = useGetTnaRecommendations({ limit: 50, skip: 0 });
  const employeeSkillsQuery = useGetTnaEmployeeSkills({ limit: 500, skip: 0 });

  const upsertEmployeeSkillMutation = useUpsertEmployeeSkill();
  const analyzeTnaMutation = useAnalyzeTna();

  const skills = useMemo(() => {
    const response = skillsQuery.data as { data?: any[] } | undefined;
    return Array.isArray(response?.data) ? response.data : [];
  }, [skillsQuery.data]);

  const employees = useMemo(() => {
    const response = studentsQuery.data as { students?: any[] } | undefined;
    const students = Array.isArray(response?.students) ? response.students : [];
    return students.filter((student) => isTnaEligibleLearnerRole(student?.role));
  }, [studentsQuery.data]);

  const roleRequirements = useMemo(() => {
    const response = roleRequirementsQuery.data as { data?: any[] } | undefined;
    return Array.isArray(response?.data) ? response.data : [];
  }, [roleRequirementsQuery.data]);

  const roleOptions = useMemo(() => {
    const uniqueRoles = new Set<string>();
    for (const roleRequirement of roleRequirements) {
      const roleName = String(roleRequirement?.jobRole || "").trim();
      if (roleName) uniqueRoles.add(roleName);
    }
    return Array.from(uniqueRoles).sort((a, b) => a.localeCompare(b));
  }, [roleRequirements]);

  const courses = useMemo(() => {
    const response = coursesQuery.data as { courses?: any[] } | undefined;
    return Array.isArray(response?.courses) ? response.courses : [];
  }, [coursesQuery.data]);

  const recommendations = useMemo(() => {
    const response = recommendationsQuery.data as { data?: any[] } | undefined;
    return Array.isArray(response?.data) ? response.data : [];
  }, [recommendationsQuery.data]);

  const employeeSkillAssignments = useMemo(() => {
    const response = employeeSkillsQuery.data as { data?: any[] } | undefined;
    return Array.isArray(response?.data) ? response.data : [];
  }, [employeeSkillsQuery.data]);

  const prefillEmployeeId = (searchParams.get("employeeId") || "").trim();
  const prefillStepParam = (searchParams.get("step") || "").trim();
  const prefillJobRole = (searchParams.get("jobRole") || "").trim();
  const prefillEmployeeSkillsParam = (searchParams.get("employeeSkills") || "").trim();

  const [activeStep, setActiveStep] = useState<StepKey>(() => {
    if (typeof window === "undefined") return "employee-skills";
    const storedStep = window.sessionStorage.getItem(TNA_ACTIVE_STEP_STORAGE_KEY);
    if (
      storedStep === "employee-skills" ||
      storedStep === "analyze" ||
      storedStep === "recommendations"
    ) {
      return storedStep;
    }
    return "employee-skills";
  });
  const [employeeId, setEmployeeId] = useState("");
  const [employeeSkills, setEmployeeSkills] = useState<LevelRow[]>([{ skillId: "", level: 1 }]);

  const selectedEmployeeRecommendationsQuery = useGetEmployeeTnaRecommendations(employeeId, {
    limit: 200,
    skip: 0,
  });

  const [analyzeEmployeeId, setAnalyzeEmployeeId] = useState("");
  const [analyzeJobRole, setAnalyzeJobRole] = useState("");
  const [score, setScore] = useState("");
  const [performanceGaps, setPerformanceGaps] = useState("");
  const [managerRecommendations, setManagerRecommendations] = useState("");
  const [employeeRequests, setEmployeeRequests] = useState("");
  const [compliance, setCompliance] = useState<ComplianceRow[]>([
    { title: "", courseId: "", mandatory: true },
  ]);
  const [didApplyPrefillSkills, setDidApplyPrefillSkills] = useState(false);
  const [isRoleEditMode, setIsRoleEditMode] = useState(false);
  const [hasCompletedAnalysis, setHasCompletedAnalysis] = useState(false);

  const resolveRoleSkillRows = (jobRole: string, currentRows: LevelRow[] = []): LevelRow[] => {
    const normalizedRole = jobRole.trim().toLowerCase();
    if (!normalizedRole) return [{ skillId: "", level: 1 }];

    const matchedRoleRequirement = roleRequirements.find(
      (roleRequirement) =>
        String(roleRequirement?.jobRole || "").trim().toLowerCase() === normalizedRole
    );

    const requiredSkills = Array.isArray(matchedRoleRequirement?.requiredSkills)
      ? matchedRoleRequirement.requiredSkills
      : [];
    if (requiredSkills.length === 0) return [{ skillId: "", level: 1 }];

    const existingLevelBySkillId = new Map<string, number>();
    for (const row of currentRows) {
      const rowSkillId = String(row?.skillId || "").trim();
      if (!rowSkillId) continue;
      const rowLevel = Number(row?.level);
      const normalizedLevel = Number.isFinite(rowLevel) ? Math.max(0, Math.min(5, rowLevel)) : 1;
      existingLevelBySkillId.set(rowSkillId, normalizedLevel);
    }

    const roleRows: LevelRow[] = [];
    const seenSkillIds = new Set<string>();

    for (const requiredSkill of requiredSkills) {
      const rawSkillId = requiredSkill?.skill ?? requiredSkill?.skillId;
      let resolvedSkillId =
        typeof rawSkillId === "string"
          ? rawSkillId.trim()
          : String(rawSkillId?._id || "").trim();

      if (!resolvedSkillId) {
        const skillName =
          String(requiredSkill?.skillName || requiredSkill?.skill?.name || rawSkillId?.name || "")
            .trim()
            .toLowerCase();
        if (skillName) {
          const matchedSkill = skills.find(
            (skill) => String(skill?.name || "").trim().toLowerCase() === skillName
          );
          resolvedSkillId = String(matchedSkill?._id || "").trim();
        }
      }

      if (!resolvedSkillId || seenSkillIds.has(resolvedSkillId)) continue;
      seenSkillIds.add(resolvedSkillId);

      roleRows.push({
        skillId: resolvedSkillId,
        level: existingLevelBySkillId.get(resolvedSkillId) ?? 1,
      });
    }

    return roleRows.length > 0 ? roleRows : [{ skillId: "", level: 1 }];
  };

  const applyRoleSkillsToEmployee = (jobRole: string) => {
    setHasCompletedAnalysis(false);
    setAnalyzeJobRole(jobRole);
    setEmployeeSkills((previous) => {
      const next = resolveRoleSkillRows(jobRole, previous);
      const previousSignature = JSON.stringify(previous);
      const nextSignature = JSON.stringify(next);
      return previousSignature === nextSignature ? previous : next;
    });
  };

  const resolveRoleOption = (roleName: string): string => {
    const normalizedRoleName = normalizeRoleValue(roleName);
    if (!normalizedRoleName) return "";
    const matchedRoleOption = roleOptions.find(
      (roleOption) => normalizeRoleValue(roleOption) === normalizedRoleName
    );
    return matchedRoleOption || "";
  };

  const resolveSuggestedRoleForEmployee = (selectedEmployeeId: string): string => {
    const normalizedEmployeeId = String(selectedEmployeeId || "").trim();
    if (!normalizedEmployeeId) return "";

    const savedEmployeeSkillRole = employeeSkillAssignments.find((employeeSkillItem) => {
      const employeeSkillEmployeeId = String(employeeSkillItem?.employee?._id || employeeSkillItem?.employee || "")
        .trim();
      return employeeSkillEmployeeId === normalizedEmployeeId;
    });
    const savedRole = resolveRoleOption(String(savedEmployeeSkillRole?.jobRole || ""));
    if (savedRole) return savedRole;

    const matchedEmployee = employees.find(
      (employee) => String(employee?._id || "").trim() === normalizedEmployeeId
    );
    const subroleBasedRole = resolveRoleOption(String(matchedEmployee?.subrole || ""));
    if (subroleBasedRole) return subroleBasedRole;

    return "";
  };

  const applyEmployeeSelection = (selectedEmployeeId: string) => {
    setHasCompletedAnalysis(false);
    setEmployeeId(selectedEmployeeId);
    setAnalyzeEmployeeId(selectedEmployeeId);
    setIsRoleEditMode(false);

    const suggestedRole = resolveSuggestedRoleForEmployee(selectedEmployeeId);
    if (suggestedRole) {
      applyRoleSkillsToEmployee(suggestedRole);
      return;
    }

    setAnalyzeJobRole("");
    setEmployeeSkills([{ skillId: "", level: 1 }]);
  };

  const selectedEmployeeAssignment = useMemo(() => {
    const normalizedSelectedEmployeeId = String(employeeId || "").trim();
    if (!normalizedSelectedEmployeeId) return null;
    return (
      employeeSkillAssignments.find((employeeSkillItem) => {
        const employeeSkillEmployeeId = String(
          employeeSkillItem?.employee?._id || employeeSkillItem?.employee || ""
        ).trim();
        return employeeSkillEmployeeId === normalizedSelectedEmployeeId;
      }) || null
    );
  }, [employeeId, employeeSkillAssignments]);

  const selectedEmployeeRecommendations = useMemo(() => {
    const response = selectedEmployeeRecommendationsQuery.data as { data?: RecommendationRow[] } | undefined;
    return Array.isArray(response?.data) ? response.data : [];
  }, [selectedEmployeeRecommendationsQuery.data]);

  useEffect(() => {
    if (selectedEmployeeRecommendations.length > 0) {
      setHasCompletedAnalysis(true);
    }
  }, [selectedEmployeeRecommendations.length]);

  const skillTrainingProgressByName = useMemo(() => {
    const map = new Map<
      string,
      Array<{ title: string; status: TrainingProgressStatus; targetLevel: number | null }>
    >();

    const sortedRecommendations = [...selectedEmployeeRecommendations].sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    for (const recommendation of sortedRecommendations) {
      const trainings = Array.isArray(recommendation?.recommendedTrainings)
        ? recommendation.recommendedTrainings
        : [];

      for (const training of trainings) {
        if (String(training?.reasonType || "").trim() !== "skill_gap") continue;
        const status = normalizeTrainingProgressStatus(training?.progressStatus);
        if (status !== "pending" && status !== "in_progress") continue;

        const title = String(training?.title || "").trim();
        const parsed = parseSkillLevelFromTrainingTitle(title);
        const normalizedSkillName = normalizeRoleValue(parsed.skillName);
        if (!normalizedSkillName) continue;

        const items = map.get(normalizedSkillName) || [];
        const hasDuplicate = items.some(
          (item) => item.title === title && item.status === status && item.targetLevel === parsed.targetLevel
        );
        if (!hasDuplicate) {
          items.push({
            title,
            status,
            targetLevel: parsed.targetLevel,
          });
        }
        map.set(normalizedSkillName, items);
      }
    }

    for (const [skillName, items] of map.entries()) {
      items.sort((a, b) => {
        const rank = (value: TrainingProgressStatus) =>
          value === "in_progress" ? 3 : value === "pending" ? 2 : 1;
        return rank(b.status) - rank(a.status);
      });
      map.set(skillName, items);
    }

    return map;
  }, [selectedEmployeeRecommendations]);

  const selectedEmployeeAssignedRole = String(selectedEmployeeAssignment?.jobRole || "").trim();
  const hasAssignedRole = Boolean(selectedEmployeeAssignedRole);
  const isChangingAssignedRole =
    hasAssignedRole &&
    Boolean(analyzeJobRole.trim()) &&
    normalizeRoleValue(selectedEmployeeAssignedRole) !== normalizeRoleValue(analyzeJobRole);

  const cancelRoleEditMode = () => {
    if (!employeeId) {
      setIsRoleEditMode(false);
      return;
    }
    const suggestedRole = resolveSuggestedRoleForEmployee(employeeId);
    if (suggestedRole) {
      applyRoleSkillsToEmployee(suggestedRole);
    }
    setIsRoleEditMode(false);
  };

  const selectedAnalyzeRoleRequirement = useMemo(() => {
    const normalizedRole = analyzeJobRole.trim().toLowerCase();
    if (!normalizedRole) return null;
    return (
      roleRequirements.find(
        (roleRequirement) =>
          String(roleRequirement?.jobRole || "").trim().toLowerCase() === normalizedRole
      ) || null
    );
  }, [analyzeJobRole, roleRequirements]);

  const selectedAnalyzeRoleSkills = useMemo(() => {
    if (!selectedAnalyzeRoleRequirement) return [];
    if (!Array.isArray(selectedAnalyzeRoleRequirement.requiredSkills)) return [];
    return selectedAnalyzeRoleRequirement.requiredSkills.filter((skillItem: any) =>
      Boolean(skillItem?.skillName)
    );
  }, [selectedAnalyzeRoleRequirement]);

  const analyzeThreshold = useMemo(() => {
    const roleThreshold = Number(selectedAnalyzeRoleRequirement?.preAssessmentThreshold);
    if (Number.isFinite(roleThreshold) && roleThreshold >= 0 && roleThreshold <= 100) {
      return roleThreshold;
    }
    return 70;
  }, [selectedAnalyzeRoleRequirement]);

  useEffect(() => {
    if (!employeeId && employees.length > 0) setEmployeeId(employees[0]._id);
    if (!analyzeEmployeeId && employees.length > 0) setAnalyzeEmployeeId(employees[0]._id);
  }, [employees, employeeId, analyzeEmployeeId]);

  useEffect(() => {
    if (!prefillEmployeeId || employees.length === 0) return;
    const hasMatchingEmployee = employees.some(
      (employee) => String(employee?._id || "") === prefillEmployeeId
    );
    if (!hasMatchingEmployee) return;
    setEmployeeId(prefillEmployeeId);
    setAnalyzeEmployeeId(prefillEmployeeId);
  }, [prefillEmployeeId, employees]);

  useEffect(() => {
    if (!prefillStepParam) return;
    const validSteps = new Set<StepKey>(["employee-skills", "analyze", "recommendations"]);
    if (validSteps.has(prefillStepParam as StepKey)) {
      setActiveStep(prefillStepParam as StepKey);
    }
  }, [prefillStepParam]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(TNA_ACTIVE_STEP_STORAGE_KEY, activeStep);
  }, [activeStep]);

  useEffect(() => {
    if (!prefillJobRole) return;
    applyRoleSkillsToEmployee(prefillJobRole);
  }, [prefillJobRole]);

  useEffect(() => {
    if (!analyzeJobRole.trim()) return;
    if (employeeSkills.length !== 1) return;
    if (String(employeeSkills[0]?.skillId || "").trim()) return;
    setEmployeeSkills((previous) => {
      const next = resolveRoleSkillRows(analyzeJobRole, previous);
      const previousSignature = JSON.stringify(previous);
      const nextSignature = JSON.stringify(next);
      return previousSignature === nextSignature ? previous : next;
    });
  }, [analyzeJobRole, employeeSkills, roleRequirements, skills]);

  useEffect(() => {
    if (didApplyPrefillSkills) return;

    const parsedPrefillSkills = parsePrefillEmployeeSkills(prefillEmployeeSkillsParam);
    if (parsedPrefillSkills.length === 0) {
      setDidApplyPrefillSkills(true);
      return;
    }

    if (skills.length === 0) return;

    const normalized = parsedPrefillSkills
      .map((prefillSkill) => {
        const requestedSkillId = String(prefillSkill.skillId || "").trim();
        const requestedSkillName = String(prefillSkill.skillName || "").trim().toLowerCase();

        let resolvedSkillId = requestedSkillId;
        if (!resolvedSkillId && requestedSkillName) {
          const matchedSkill = skills.find(
            (skill) => String(skill?.name || "").trim().toLowerCase() === requestedSkillName
          );
          resolvedSkillId = String(matchedSkill?._id || "").trim();
        }

        if (!resolvedSkillId) return null;

        const parsedLevel = Number(prefillSkill.level ?? 0);
        const normalizedLevel = Number.isFinite(parsedLevel)
          ? Math.max(0, Math.min(5, parsedLevel))
          : 0;

        return {
          skillId: resolvedSkillId,
          level: normalizedLevel,
        } as LevelRow;
      })
      .filter(Boolean) as LevelRow[];

    if (normalized.length > 0) {
      setEmployeeSkills(normalized);
    }

    setDidApplyPrefillSkills(true);
  }, [didApplyPrefillSkills, prefillEmployeeSkillsParam, skills]);

  const completionByStep = useMemo<Record<StepKey, boolean>>(
    () => ({
      "employee-skills":
        Boolean(employeeId) &&
        Boolean(analyzeJobRole.trim()) &&
        employeeSkills.some((skill) => Boolean(String(skill.skillId || "").trim())),
      analyze: hasCompletedAnalysis,
      recommendations: hasCompletedAnalysis,
    }),
    [employeeId, analyzeJobRole, employeeSkills, hasCompletedAnalysis]
  );

  const stepEnabledByStep = useMemo<Record<StepKey, boolean>>(
    () => {
      const hasReachedAnalyze = activeStep === "analyze" || activeStep === "recommendations";
      const hasReachedRecommendations = activeStep === "recommendations";

      return {
        "employee-skills": true,
        analyze: completionByStep["employee-skills"] || hasReachedAnalyze || hasCompletedAnalysis,
        recommendations:
          (completionByStep["employee-skills"] && completionByStep.analyze) ||
          hasReachedRecommendations ||
          hasCompletedAnalysis,
      };
    },
    [completionByStep, activeStep, hasCompletedAnalysis]
  );

  const goToStep = (stepKey: StepKey) => {
    if (stepEnabledByStep[stepKey]) {
      setActiveStep(stepKey);
      return;
    }
    if (stepKey === "analyze") {
      toast.error("Complete Step 1 fields first before moving to Step 2.");
      return;
    }
    if (stepKey === "recommendations") {
      toast.error("Complete Step 2 first by running TNA analysis.");
    }
  };

  const pendingRecommendations = useMemo(
    () =>
      recommendations.filter(
        (recommendation) => normalizeStatus(recommendation.status) === "pending"
      ).length,
    [recommendations]
  );

  const skillSelectOptions = useMemo(
    () =>
      skills.map((skill) => ({
        value: String(skill._id || ""),
        label: String(skill.name || "Unnamed skill"),
      })),
    [skills]
  );

  const employeeSelectOptions = useMemo(
    () =>
      employees.map((employee) => {
        const firstName = String(employee.firstName || "").trim();
        const lastName = String(employee.lastName || "").trim();
        const fullName = `${firstName} ${lastName}`.trim() || employee.email || "Unnamed employee";
        return {
          value: String(employee._id || ""),
          label: fullName,
          description: employee.email || undefined,
        };
      }),
    [employees]
  );

  const roleSelectOptions = useMemo(
    () =>
      roleOptions.map((roleOption) => ({
        value: roleOption,
        label: roleOption,
      })),
    [roleOptions]
  );

  const courseSelectOptions = useMemo(
    () =>
      courses.map((course) => ({
        value: String(course._id || ""),
        label: `${course.code ? `${course.code} - ` : ""}${course.title || "Untitled course"}`,
      })),
    [courses]
  );

  const recommendationStatusFilterOptions = useMemo(
    () => [
      { value: "pending", label: "Pending" },
      { value: "assigned", label: "Assigned" },
      { value: "completed", label: "Completed" },
    ],
    []
  );

  const recommendationTableGroups = useMemo(
    (): GroupedTableGroup<RecommendationRow>[] => [
      {
        key: "recommendations",
        title: "Recommendations",
        rows: recommendations as RecommendationRow[],
      },
    ],
    [recommendations]
  );

  const skillNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const skill of skills) {
      const skillId = String(skill?._id || "").trim();
      const skillName = String(skill?.name || "").trim();
      if (!skillId || !skillName) continue;
      map.set(skillId, skillName);
    }
    return map;
  }, [skills]);

  const selectedEmployeeSkillTrainingSignals = useMemo(
    () =>
      Array.from(skillTrainingProgressByName.entries()).flatMap(([skillName, items]) =>
        items.map((item) => ({
          skillName,
          title: item.title,
          status: item.status,
          targetLevel: item.targetLevel,
        }))
      ),
    [skillTrainingProgressByName]
  );

  const getInProgressSkillLevelConflicts = (rows: LevelRow[]) => {
    const conflicts: string[] = [];

    for (const row of rows) {
      const skillId = String(row?.skillId || "").trim();
      if (!skillId) continue;
      const skillName = String(skillNameById.get(skillId) || "").trim();
      if (!skillName) continue;

      const signals = (skillTrainingProgressByName.get(normalizeRoleValue(skillName)) || []).filter(
        (signal) => signal.status === "in_progress" && typeof signal.targetLevel === "number"
      );
      if (signals.length === 0) continue;

      const currentLevel = Number(row?.level);
      if (!Number.isFinite(currentLevel)) continue;

      const blockedSignal = signals
        .slice()
        .sort((a, b) => Number(a.targetLevel || 0) - Number(b.targetLevel || 0))
        .find((signal) => currentLevel >= Number(signal.targetLevel || 0));

      if (!blockedSignal) continue;
      conflicts.push(
        `${skillName}: level ${currentLevel} conflicts with active "${blockedSignal.title}" (in progress).`
      );
    }

    return conflicts;
  };

  const hasAnyInProgressSkillTraining = useMemo(
    () =>
      selectedEmployeeSkillTrainingSignals.some(
        (signal) => normalizeTrainingProgressStatus(signal.status) === "in_progress"
      ),
    [selectedEmployeeSkillTrainingSignals]
  );

  const recommendationTableColumns = useMemo(
    (): GroupedTableColumn<RecommendationRow>[] => [
      {
        key: "employee",
        label: "Employee",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search employee",
        sortAccessor: (row) => {
          const firstName = String(row.employee?.firstName || "").trim();
          const lastName = String(row.employee?.lastName || "").trim();
          const fullName = `${firstName} ${lastName}`.trim() || row.employee?.email || "Unknown employee";
          return fullName;
        },
        filterAccessor: (row) => {
          const firstName = String(row.employee?.firstName || "").trim();
          const lastName = String(row.employee?.lastName || "").trim();
          const fullName = `${firstName} ${lastName}`.trim();
          return `${fullName} ${row.employee?.email || ""}`.trim();
        },
        className: "min-w-[220px]",
        render: (row) => {
          const firstName = String(row.employee?.firstName || "").trim();
          const lastName = String(row.employee?.lastName || "").trim();
          const fullName = `${firstName} ${lastName}`.trim() || row.employee?.email || "Unknown employee";
          return (
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-slate-900">{fullName}</p>
              <p className="text-xs text-slate-500">{row.employee?.email || "--"}</p>
            </div>
          );
        },
      },
      {
        key: "role",
        label: "Role",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search role",
        sortAccessor: (row) => row.jobRole || "",
        filterAccessor: (row) => row.jobRole || "",
        className: "min-w-[170px]",
        render: (row) => <span className="text-sm text-slate-700">{row.jobRole || "--"}</span>,
      },
      {
        key: "created",
        label: "Created",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search date",
        sortAccessor: (row) => (row.createdAt ? new Date(row.createdAt).getTime() : 0),
        filterAccessor: (row) =>
          row.createdAt ? new Date(row.createdAt).toLocaleString() : "",
        className: "min-w-[180px]",
        render: (row) => (
          <span className="text-sm text-slate-700 whitespace-nowrap">
            {new Date(row.createdAt || Date.now()).toLocaleString()}
          </span>
        ),
      },
      {
        key: "skillGaps",
        label: "Skill Gaps",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search count",
        sortAccessor: (row) => (Array.isArray(row.skillGaps) ? row.skillGaps.length : 0),
        filterAccessor: (row) => String(Array.isArray(row.skillGaps) ? row.skillGaps.length : 0),
        align: "right",
        className: "min-w-[120px]",
        render: (row) => (
          <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
            {Array.isArray(row.skillGaps) ? row.skillGaps.length : 0}
          </span>
        ),
      },
      {
        key: "recommended",
        label: "Recommended",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search count",
        sortAccessor: (row) =>
          Array.isArray(row.recommendedTrainings) ? row.recommendedTrainings.length : 0,
        filterAccessor: (row) =>
          String(Array.isArray(row.recommendedTrainings) ? row.recommendedTrainings.length : 0),
        align: "right",
        className: "min-w-[130px]",
        render: (row) => (
          <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
            {Array.isArray(row.recommendedTrainings) ? row.recommendedTrainings.length : 0}
          </span>
        ),
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        filterable: true,
        filterVariant: "select",
        filterSelectAllLabel: "All Status",
        filterOptions: recommendationStatusFilterOptions,
        sortAccessor: (row) => normalizeStatus(row.status),
        filterAccessor: (row) => normalizeStatus(row.status),
        className: "min-w-[140px]",
        render: (row) => {
          const currentStatus = normalizeStatus(row.status);
          const statusMeta = getRecommendationStatusMeta(currentStatus);
          return (
            <div className="w-[120px]" data-row-click-stop="true">
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusMeta.className}`}
              >
                {statusMeta.label}
              </span>
            </div>
          );
        },
      },
    ],
    [recommendationStatusFilterOptions]
  );

  const getStepStatusMeta = (stepKey: StepKey) => {
    if (completionByStep[stepKey]) {
      return {
        label: "Complete",
        className: themePrimaryStrongBadgeClass,
      };
    }
    if (activeStep === stepKey) {
      return {
        label: "In Progress",
        className: themePrimarySoftBadgeClass,
      };
    }
    return {
      label: "Pending",
      className: themeSecondarySoftBadgeClass,
    };
  };

  if (orgType !== "corporate") {
    return <Navigate to={`/${orgCode}/admin/dashboard`} replace />;
  }

  const inputClassName =
    "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition duration-200 focus:outline-none focus:border-[color:var(--color-primary,#2563eb)] focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_18%,transparent)]";
  const textareaClassName =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition duration-200 focus:outline-none focus:border-[color:var(--color-primary,#2563eb)] focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_18%,transparent)]";
  const panelClassName =
    "rounded-2xl border border-slate-200 bg-white p-4 md:p-6 shadow-[0_14px_40px_-24px_rgba(15,23,42,0.35)]";
  const fieldLabelClassName = "text-xs font-semibold uppercase tracking-wider text-slate-500";
  const fieldHintClassName = "mt-1 text-xs text-slate-500";
  const sectionSurfaceClassName = "rounded-xl border border-slate-200 bg-white p-3.5";
  const employeeSkillsStatus = getStepStatusMeta("employee-skills");
  const analyzeStatus = getStepStatusMeta("analyze");
  const recommendationsStatus = getStepStatusMeta("recommendations");

  const saveEmployeeSkills = async () => {
    const payloadSkills = employeeSkills
      .filter((item) => String(item.skillId || "").trim())
      .map((item) => ({
        skillId: String(item.skillId || "").trim(),
        currentLevel: Number(item.level),
      }));
    const validationResult = saveEmployeeSkillsFormSchema.safeParse({
      employeeId: String(employeeId || "").trim(),
      jobRole: String(analyzeJobRole || "").trim(),
      skills: payloadSkills,
    });
    if (!validationResult.success) {
      return toast.error(getFirstZodIssueMessage(validationResult.error));
    }
    if (hasAssignedRole && isChangingAssignedRole && !isRoleEditMode) {
      return toast.error("Click 'Edit Assigned Role' first before changing this employee role.");
    }
    if (hasAnyInProgressSkillTraining) {
      return toast.error(
        "Cannot save employee skill levels while skill training is in progress. Complete or close in-progress training first."
      );
    }
    const inProgressConflicts = getInProgressSkillLevelConflicts(employeeSkills);
    if (inProgressConflicts.length > 0) {
      return toast.error(inProgressConflicts[0]);
    }
    try {
      await toast.promise(
        upsertEmployeeSkillMutation.mutateAsync({
          employeeId: validationResult.data.employeeId,
          jobRole: validationResult.data.jobRole,
          allowRoleChange: isRoleEditMode && isChangingAssignedRole,
          skills: validationResult.data.skills,
        }),
        {
          pending: "Saving employee skills...",
          success: "Saved",
          error: {
            render: ({ data }) => getErrorMessage(data),
          },
        }
      );
      setAnalyzeEmployeeId(employeeId);
      setIsRoleEditMode(false);
      setActiveStep("analyze");
    } catch {}
  };

  const runAnalysis = async () => {
    const preAssessmentScore = score.trim() ? Number(score) : undefined;
    if (typeof preAssessmentScore === "number" && !Number.isFinite(preAssessmentScore)) {
      return toast.error("Pre-assessment score must be a valid number");
    }
    const complianceRequirements = compliance
      .filter((item) => item.title.trim())
      .map((item) => ({
        title: item.title.trim(),
        courseId: item.courseId ? item.courseId.trim() : undefined,
        mandatory: item.mandatory,
      }));
    const validationResult = runAnalysisFormSchema.safeParse({
      employeeId: String(analyzeEmployeeId || "").trim(),
      jobRole: String(analyzeJobRole || "").trim(),
      preAssessmentScore,
      performanceGaps: parseList(performanceGaps),
      managerRecommendations: parseList(managerRecommendations),
      employeeRequests: parseList(employeeRequests),
      complianceRequirements,
    });
    if (!validationResult.success) {
      return toast.error(getFirstZodIssueMessage(validationResult.error));
    }
    if (hasAnyInProgressSkillTraining) {
      return toast.error(
        "Cannot run analysis while skill training is in progress. Complete or close in-progress training first."
      );
    }
    const inProgressConflicts = getInProgressSkillLevelConflicts(employeeSkills);
    if (inProgressConflicts.length > 0) {
      return toast.error(inProgressConflicts[0]);
    }
    try {
      await toast.promise(
        analyzeTnaMutation.mutateAsync({
          employeeId: validationResult.data.employeeId,
          jobRole: validationResult.data.jobRole,
          preAssessment: typeof validationResult.data.preAssessmentScore === "number"
            ? { score: validationResult.data.preAssessmentScore, threshold: analyzeThreshold }
            : undefined,
          performanceGaps: validationResult.data.performanceGaps,
          managerRecommendations: validationResult.data.managerRecommendations,
          employeeRequests: validationResult.data.employeeRequests,
          complianceRequirements: validationResult.data.complianceRequirements,
        }),
        {
          pending: "Running TNA analysis...",
          success: "Analysis complete",
          error: {
            render: ({ data }) => getErrorMessage(data),
          },
        }
      );
      setHasCompletedAnalysis(true);
      setActiveStep("recommendations");
    } catch {}
  };

  return (
    <div className="pt-14 pb-6 px-4 md:px-6 lg:p-6 space-y-6">
      <section
        className="rounded-2xl border border-slate-200 p-5 md:p-6"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 15%, #ffffff), #ffffff 55%, color-mix(in srgb, var(--color-secondary) 15%, #ffffff))",
        }}
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Corporate Workflow</p>
              <div className="mt-1 flex items-center gap-2">
                <h1 className="text-3xl font-bold text-slate-900">Training Needs Analysis</h1>
                <HoverHelpTooltip
                  text="This flow is focused on employee role and level capture, analysis, and recommendation tracking. Skills and role standards are configured in a separate Configuration page."
                  
                  className="shrink-0"
                />
              </div>
            </div>
            <Button
              variant="outline"
              className="h-10 w-full sm:w-[200px] md:shrink-0 text-center whitespace-nowrap"
              onClick={() => navigate(`/${orgCode}/admin/tna/configuration`)}
            >
              Open Skill and Role
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Skill Library</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">{skills.length}</p>
              <p className="text-xs text-slate-500 mt-1">Reusable skills available</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Role Standards</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">{roleOptions.length}</p>
              <p className="text-xs text-slate-500 mt-1">Configured role profiles</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{employeeTermPlural}</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">{employees.length}</p>
              <p className="text-xs text-slate-500 mt-1">Profiles ready for TNA</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending Actions</p>
              <p className={`text-2xl font-bold mt-2 ${themeSecondaryTextClass}`}>{pendingRecommendations}</p>
              <p className="text-xs text-slate-500 mt-1">Recommendations waiting assignment</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-3 md:p-4 shadow-[0_12px_36px_-24px_rgba(15,23,42,0.3)]">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
  {FLOW_STEPS.map((step, index) => {
    const isActive = activeStep === step.key;
    const isStepEnabled = stepEnabledByStep[step.key];
    const isStepLocked = !isStepEnabled && !isActive;
    const stepGuide = STEP_GUIDANCE[step.key] || STEP_GUIDANCE["employee-skills"];
    const hoverAlignClass = index >= FLOW_STEPS.length - 2 ? "right-0" : "left-0";

    return (
      <div key={`flow-chip-${step.key}`} className="relative group">
        <button
          type="button"
          onClick={() => goToStep(step.key)}
          disabled={isStepLocked}
          className={`w-full rounded-xl border px-3 py-2 text-left transition-colors ${
            isActive
              ? "border-primary bg-primary/10 shadow-[0_10px_24px_-20px_rgba(37,99,235,0.9)]"
              : isStepLocked
              ? "border-slate-200 bg-slate-100/80 cursor-not-allowed"
              : "border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-white"
          }`}
        >
          <p className={`text-[11px] font-semibold uppercase tracking-wide ${isStepLocked ? "text-slate-400" : "text-slate-500"}`}>
            Step {index + 1}
          </p>
          <p className={`mt-0.5 flex items-center gap-2 text-sm font-medium ${isStepLocked ? "text-slate-400" : "text-slate-900"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isStepLocked ? "bg-slate-300" : "bg-slate-500"}`} />
            <span>{step.title}</span>
          </p>
        </button>

        <div
          className={`pointer-events-none absolute ${hoverAlignClass} top-full z-30 mt-2 w-[320px] max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white/95 p-3 shadow-[0_20px_50px_-22px_rgba(15,23,42,0.45)] backdrop-blur-sm opacity-0 translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Step {index + 1}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{step.title}</p>
          <p className="mt-1 text-xs leading-5 text-slate-600">{step.description}</p>
          <div className="mt-2 space-y-1.5">
            {stepGuide.checklist.map((item) => (
              <div key={`${step.key}-${item}`} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/80" />
                <p className="text-xs leading-5 text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  })}
</div>
      </section>

      <div className="space-y-6">
          {activeStep === "employee-skills" && (
          <section
            id="employee-skills"
            className={`${panelClassName} space-y-4 ${
              activeStep === "employee-skills" ? "ring-2 ring-primary/20" : ""
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className={fieldLabelClassName}>Step 1</p>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${employeeSkillsStatus.className}`}
                  >
                    {employeeSkillsStatus.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-slate-900">Capture {employeeTerm} Role and Skills</h2>
                  <HoverHelpTooltip
                    text={`Assign role for new ${employeeTerm.toLowerCase()} profiles, or edit existing role assignment.`}
                    
                    className="shrink-0"
                  />
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => goToStep("analyze")}
                disabled={!stepEnabledByStep.analyze}
                className="h-fit"
              >
                Next Step
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div
                className={`rounded-xl border p-3.5 ${
                  hasAssignedRole
                    ? "border-slate-200 bg-slate-50/70"
                    : "border-primary/30 bg-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_8%,white)]"
                }`}
              >
                <p className={fieldLabelClassName}>Flow A</p>
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">Assign Role (New Profile)</p>
                  <HoverHelpTooltip
                    text="Select employee, choose role, auto-fill skills, then save levels."
                    className="shrink-0"
                  />
                </div>
              </div>
              <div
                className={`rounded-xl border p-3.5 ${
                  hasAssignedRole
                    ? "border-primary/30 bg-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_8%,white)]"
                    : "border-slate-200 bg-slate-50/70"
                }`}
              >
                <p className={fieldLabelClassName}>Flow B</p>
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">Update Assigned Role</p>
                  <HoverHelpTooltip
                    text="For existing profiles, click edit role, change role, then save updated levels."
                    className="shrink-0"
                  />
                </div>
              </div>
            </div>

            <div className={`${sectionSurfaceClassName} space-y-3`}>
              <div className="rounded-lg border border-slate-200 bg-white/80 p-3">
                <p className={fieldLabelClassName}>Assignment Status</p>
                {hasAssignedRole ? (
                  <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-700">
                      Current assigned role:{" "}
                      <span className="font-semibold text-slate-900">{selectedEmployeeAssignedRole}</span>
                    </p>
                    {!isRoleEditMode ? (
                      <Button
                        variant="outline"
                        className="h-9 px-3 text-sm"
                        onClick={() => setIsRoleEditMode(true)}
                      >
                        Edit Assigned Role
                      </Button>
                    ) : (
                      <Button variant="cancel" className="h-9 px-3 text-sm" onClick={cancelRoleEditMode}>
                        Cancel Role Edit
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-slate-700">
                    No role assigned yet. You are in new assignment flow.
                  </p>
                )}
                {hasAssignedRole && isRoleEditMode && (
                  <p className={`mt-2 text-xs font-medium ${themeSecondaryTextClass}`}>
                    Role edit mode is active. Saving will update this employee role assignment.
                  </p>
                )}

                {employeeId && (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                    <p className={fieldLabelClassName}>Active TNA Skill Training</p>
                    {selectedEmployeeRecommendationsQuery.isLoading ? (
                      <p className="mt-1 text-xs text-slate-500">Checking training status...</p>
                    ) : selectedEmployeeSkillTrainingSignals.length === 0 ? (
                      <p className="mt-1 text-xs text-slate-500">
                        No pending or in-progress skill-level training from latest TNA run.
                      </p>
                    ) : (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {selectedEmployeeSkillTrainingSignals.slice(0, 8).map((signal, index) => (
                          <span
                            key={`${signal.skillName}-${signal.title}-${index}`}
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                              signal.status === "in_progress"
                                ? themePrimarySoftBadgeClass
                                : themeSecondarySoftBadgeClass
                            }`}
                          >
                            {signal.skillName}{" "}
                            {signal.targetLevel ? `L${signal.targetLevel}` : ""} ·{" "}
                            {signal.status === "in_progress" ? "In Progress" : "Pending"}
                          </span>
                        ))}
                        {selectedEmployeeSkillTrainingSignals.length > 8 && (
                          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-600">
                            +{selectedEmployeeSkillTrainingSignals.length - 8} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className={fieldLabelClassName}>Select {employeeTerm}</label>
                  <div className="mt-1">
                    <SearchableSelect
                      options={employeeSelectOptions}
                      value={employeeId}
                      onChange={applyEmployeeSelection}
                      placeholder={`Select ${employeeTerm.toLowerCase()}`}
                      loading={studentsQuery.isLoading}
                      emptyMessage={`No ${employeeTermPlural.toLowerCase()} found.`}
                      className="w-full"
                    />
                  </div>
                </div>
                <div>
                  <label className={fieldLabelClassName}>Job Role</label>
                  <div className="mt-1">
                    <SearchableSelect
                      options={roleSelectOptions}
                      value={analyzeJobRole}
                      onChange={applyRoleSkillsToEmployee}
                      disabled={hasAssignedRole && !isRoleEditMode}
                      placeholder={
                        roleRequirementsQuery.isLoading
                          ? "Loading role standards..."
                          : roleOptions.length > 0
                          ? "Select job role"
                          : "No role standards yet"
                      }
                      loading={roleRequirementsQuery.isLoading}
                      emptyMessage="No role standards yet. Configure them in Skill and Role."
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
              <p className={fieldHintClassName}>
                Use the same scale from the Level Guide. Skills and role standards are managed in Configuration.
              </p>
              {!roleRequirementsQuery.isLoading && roleOptions.length === 0 && (
                <button
                  type="button"
                  className={`text-xs underline underline-offset-2 ${themeSecondaryTextClass}`}
                  onClick={() => navigate(`/${orgCode}/admin/tna/configuration`)}
                >
                  No role standards found. Open Skill and Role.
                </button>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
              <p className={fieldLabelClassName}>Current Skills And Levels</p>
              <div className="hidden md:grid grid-cols-12 gap-2 px-1">
                <p className={`col-span-8 ${fieldLabelClassName}`}>Skill</p>
                <p className={`col-span-2 ${fieldLabelClassName}`}>Level</p>
                <p className={`col-span-2 ${fieldLabelClassName}`}>Action</p>
              </div>
              {employeeSkills.map((item, index) => (
                <div key={`employee-skill-${index}`} className="grid grid-cols-12 gap-2">
                  <div className="col-span-12 md:col-span-8">
                    {(() => {
                      const selectedSkillName = normalizeRoleValue(skillNameById.get(item.skillId) || "");
                      const matchedSignals = selectedSkillName
                        ? skillTrainingProgressByName.get(selectedSkillName) || []
                        : [];
                      const topSignal = matchedSignals[0] || null;

                      return (
                        <>
                          <SearchableSelect
                            options={skillSelectOptions}
                            value={item.skillId}
                            onChange={(value) => {
                              const next = [...employeeSkills];
                              next[index] = { ...next[index], skillId: value };
                              setEmployeeSkills(next);
                            }}
                            placeholder="Select skill"
                            loading={skillsQuery.isLoading}
                            emptyMessage="No skills yet. Add skills in Skill and Role."
                            className="w-full"
                          />
                          {topSignal && (
                            <p
                              className={`mt-1 text-[11px] font-medium ${
                                topSignal.status === "in_progress"
                                  ? "text-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_80%,black)]"
                                  : themeSecondaryTextClass
                              }`}
                            >
                              Active training: {topSignal.title} (
                              {topSignal.status === "in_progress" ? "In Progress" : "Pending"})
                            </p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={5}
                    value={item.level}
                    onChange={(event) => {
                      const next = [...employeeSkills];
                      next[index] = { ...next[index], level: Number(event.target.value || 0) };
                      setEmployeeSkills(next);
                    }}
                    className={`col-span-7 md:col-span-2 ${inputClassName}`}
                  />
                  <button
                    type="button"
                    className="col-span-5 md:col-span-2 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50"
                    onClick={() => {
                      if (employeeSkills.length === 1) return;
                      setEmployeeSkills(employeeSkills.filter((_, rowIndex) => rowIndex !== index));
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <p className={fieldHintClassName}>
                Enter the employee&apos;s actual current level, not the target role level.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => setEmployeeSkills([...employeeSkills, { skillId: "", level: 1 }])}
              >
                Add Employee Skill
              </Button>
              <Button
                variant="primary"
                onClick={saveEmployeeSkills}
                isLoading={upsertEmployeeSkillMutation.isPending}
              >
                {hasAssignedRole
                  ? isRoleEditMode
                    ? "Update Employee Role And Skills"
                    : "Save Employee Skills"
                  : "Assign Role And Save Skills"}
              </Button>
            </div>
          </section>
          )}

          {activeStep === "analyze" && (
          <section
            id="analyze"
            className={`${panelClassName} space-y-4 ${activeStep === "analyze" ? "ring-2 ring-primary/20" : ""}`}
          >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className={fieldLabelClassName}>Step 2</p>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${analyzeStatus.className}`}
                  >
                    {analyzeStatus.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-slate-900">Run TNA Analysis</h2>
                  <HoverHelpTooltip
                    text="Combine role standards, skill gaps, and optional signals to generate recommendations."
                    
                    className="shrink-0"
                  />
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => goToStep("recommendations")}
                disabled={!stepEnabledByStep.recommendations}
                className="h-fit"
              >
                Next Step
              </Button>
            </div>

            <div className={`${sectionSurfaceClassName} space-y-3`}>
              <p className={fieldLabelClassName}>Core Inputs</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className={fieldLabelClassName}>{employeeTerm}</label>
                  <div className="mt-1">
                    <SearchableSelect
                      options={employeeSelectOptions}
                      value={analyzeEmployeeId}
                      onChange={applyEmployeeSelection}
                      placeholder={`Select ${employeeTerm.toLowerCase()}`}
                      loading={studentsQuery.isLoading}
                      emptyMessage={`No ${employeeTermPlural.toLowerCase()} found.`}
                      className="w-full"
                    />
                  </div>
                  <p className={fieldHintClassName}>Choose who you want to assess now.</p>
                </div>
                <div>
                  <label className={fieldLabelClassName}>Job Role</label>
                  <div className="mt-1">
                    <SearchableSelect
                      options={roleSelectOptions}
                      value={analyzeJobRole}
                      onChange={applyRoleSkillsToEmployee}
                      placeholder={
                        roleRequirementsQuery.isLoading
                          ? "Loading role standards..."
                          : roleOptions.length > 0
                          ? "Select job role"
                          : "No role standards yet"
                      }
                      loading={roleRequirementsQuery.isLoading}
                      emptyMessage="No role standards yet. Configure them in Skill and Role."
                      className="w-full"
                    />
                  </div>
                  {!roleRequirementsQuery.isLoading && roleOptions.length === 0 && (
                    <p className={`mt-1 text-xs ${themeSecondaryTextClass}`}>
                      Define role standards in Configuration before running analysis.
                    </p>
                  )}
                </div>
                <div>
                  <label className={fieldLabelClassName}>Pre-test Score (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={score}
                    onChange={(event) => setScore(event.target.value)}
                    className={`${inputClassName} mt-1`}
                    placeholder="Optional"
                  />
                  <p className={fieldHintClassName}>Leave empty if no pre-test was taken.</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">Role Standard Preview</p>
                    <HoverHelpTooltip
                      text="Select a job role to view required skills and levels."
                      className="shrink-0"
                    />
                  </div>
                </div>
                <span className="inline-flex h-fit items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
                  Pre-assessment threshold: {analyzeThreshold}%
                </span>
              </div>

              {!analyzeJobRole.trim() ? (
                <p className="text-sm text-slate-500 mt-3">
                  Choose a role from the dropdown above.
                </p>
              ) : !selectedAnalyzeRoleRequirement ? (
                <p className={`text-sm mt-3 ${themeSecondaryTextClass}`}>
                  No saved role standards found for this role yet. Configure it in Skill and Role first.
                </p>
              ) : selectedAnalyzeRoleSkills.length === 0 ? (
                <p className="text-sm text-slate-500 mt-3">
                  This role has no required skills configured yet.
                </p>
              ) : (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selectedAnalyzeRoleSkills.map((skillItem: any, index: number) => (
                    <div
                      key={`${skillItem.skill || skillItem.skillName || "skill"}-${index}`}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    >
                      <p className="font-medium text-slate-900">{skillItem.skillName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Required level: {Number(skillItem.requiredLevel) || 0}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Skill threshold: {Number(skillItem.passingThreshold) || 70}%
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className={fieldLabelClassName}>Optional Signals</p>
                <p className="text-xs text-slate-500">
                  Use comma or new line separation for each item.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className={fieldLabelClassName}>Performance Gaps</label>
                  <textarea
                    value={performanceGaps}
                    onChange={(event) => setPerformanceGaps(event.target.value)}
                    className={`min-h-[88px] ${textareaClassName} mt-1`}
                    placeholder="Comma or new line separated"
                  />
                  <p className={fieldHintClassName}>Examples: missed deadlines, low quality output.</p>
                </div>
                <div>
                  <label className={fieldLabelClassName}>Manager Recommendations</label>
                  <textarea
                    value={managerRecommendations}
                    onChange={(event) => setManagerRecommendations(event.target.value)}
                    className={`min-h-[88px] ${textareaClassName} mt-1`}
                    placeholder="Comma or new line separated"
                  />
                  <p className={fieldHintClassName}>Examples: mentor support, course focus areas.</p>
                </div>
                <div>
                  <label className={fieldLabelClassName}>Employee Requests</label>
                  <textarea
                    value={employeeRequests}
                    onChange={(event) => setEmployeeRequests(event.target.value)}
                    className={`min-h-[88px] ${textareaClassName} mt-1`}
                    placeholder="Comma or new line separated"
                  />
                  <p className={fieldHintClassName}>Examples: requested topics or certifications.</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-3 space-y-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">Compliance Signals</p>
                  <HoverHelpTooltip
                    text="Add mandatory or optional compliance training requirements."
                    className="shrink-0"
                  />
                </div>
              </div>
              {compliance.map((item, index) => (
                <div
                  key={`compliance-${index}`}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2"
                >
                  <input
                    value={item.title}
                    onChange={(event) => {
                      const next = [...compliance];
                      next[index] = { ...next[index], title: event.target.value };
                      setCompliance(next);
                    }}
                    className={`md:col-span-5 ${inputClassName}`}
                    placeholder="Compliance training title"
                  />
                  <div className="md:col-span-4">
                    <SearchableSelect
                      options={courseSelectOptions}
                      value={item.courseId}
                      onChange={(value) => {
                        const next = [...compliance];
                        next[index] = { ...next[index], courseId: value };
                        setCompliance(next);
                      }}
                      placeholder={coursesQuery.isLoading ? "Loading courses..." : "Optional course link"}
                      loading={coursesQuery.isLoading}
                      emptyMessage="No courses available"
                      className="w-full"
                    />
                  </div>
                  <label className="md:col-span-2 flex items-center gap-2 text-sm text-slate-700 rounded-lg border border-slate-200 px-3">
                    <input
                      type="checkbox"
                      checked={item.mandatory}
                      onChange={(event) => {
                        const next = [...compliance];
                        next[index] = { ...next[index], mandatory: event.target.checked };
                        setCompliance(next);
                      }}
                    />
                    Mandatory
                  </label>
                  <button
                    type="button"
                    className="md:col-span-1 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 py-2"
                    onClick={() => {
                      if (compliance.length === 1) return;
                      setCompliance(compliance.filter((_, rowIndex) => rowIndex !== index));
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => setCompliance([...compliance, { title: "", courseId: "", mandatory: true }])}
              >
                Add Compliance Requirement
              </Button>
            </div>

            <div className="flex justify-end">
              <Button variant="primary" onClick={runAnalysis} isLoading={analyzeTnaMutation.isPending}>
                Run TNA Analysis
              </Button>
            </div>
          </section>
          )}

          {activeStep === "recommendations" && (
          <section
            id="recommendations"
            className={`${panelClassName} space-y-4 ${
              activeStep === "recommendations" ? "ring-2 ring-primary/20" : ""
            }`}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className={fieldLabelClassName}>Step 3</p>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${recommendationsStatus.className}`}
                  >
                    {recommendationsStatus.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-slate-900">Track Recommendations</h2>
                  <HoverHelpTooltip
                    text="Review generated recommendations and move each one through assignment and completion."
                    
                    className="shrink-0"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:flex-wrap md:justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/${orgCode}/admin/tna/employees`)}
                  className="h-10 w-full sm:w-[200px] text-sm text-center leading-tight justify-center"
                >
                  View Employee TNA Details
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/${orgCode}/admin/tna/execution`)}
                  className="h-10 w-full sm:w-[200px] text-sm text-center leading-tight justify-center"
                >
                  Deploy to Program/Batch
                </Button>
              </div>
            </div>

            {recommendationsQuery.isLoading ? (
              <p className="text-sm text-slate-500">Loading recommendations...</p>
            ) : recommendations.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                No recommendations yet. Complete steps 1 and 2, then run analysis.
              </div>
            ) : (
              <GroupedDataTable
                groups={recommendationTableGroups}
                columns={recommendationTableColumns}
                rowKey={(row) => row._id}
                emptyFilteredText="No matching recommendations found."
                tableMinWidthClassName="min-w-[980px]"
                cardless
                showGroupHeader={false}
              />
            )}
          </section>
          )}
      </div>
    </div>
  );
}

