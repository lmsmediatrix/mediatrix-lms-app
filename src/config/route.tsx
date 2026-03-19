import { ProtectedRoutes } from "../routes/ProtectedRoutes";
import MainLayout from "../layouts/MainLayout";
import AuthLayout from "../layouts/AuthLayout";
import Login from "../pages/auth/Login";
import SuperadminDashboard from "../pages/superadmin/SuperadminDashboard";
import OrgAdminDashboard from "../pages/orgAdmin/OrgAdminDashboard";
import Register from "../pages/Register";
import NotFound from "../pages/NotFound";
import Organizations from "../pages/superadmin/Organizations";
import OrganizationPage from "../pages/superadmin/OrganizationPage";
import CreateOrganization from "../pages/superadmin/CreateOrganization";
import StudentDashboard from "../pages/student/StudentDashboard";
import InstructorDashboard from "../pages/instructor/InstructorDashboard";
import StudentSectionPage from "../pages/student/SectionPage";
import InstructorSectionPage from "../pages/instructor/SectionPage";
import LessonsPage from "../pages/student/LessonsPage";
import CalendarPage from "../pages/student/CalendarPage";
import { Navigate } from "react-router-dom";
import ManageSection from "../pages/instructor/ManageSection";
import CoursePage from "../pages/orgAdmin/CoursePage";
import AssessmentPage from "../pages/student/AssessmentPage";
import InstructorDatabase from "../pages/orgAdmin/InstructorDatabase";
import StudentDatabase from "../pages/orgAdmin/StudentDatabase";
import InstructorDetailsPage from "../pages/orgAdmin/InstructorDetailsPage";
import AssessmentResult from "../pages/instructor/AssessmentResult";
import InstructorAssessmentPage from "../pages/instructor/InstructorAssessmentPage";
import EditSectionPage from "../pages/orgAdmin/EditSectionPage";
import NewSectionPage from "../pages/orgAdmin/NewSectionPage";
import OrgAdminSections from "../pages/orgAdmin/SectionPage";
import Notifications from "../pages/common/Notifications";
import StudentProfilePage from "../pages/student/StudentProfilePage";
import AdminProfilePage from "../pages/orgAdmin/AdminProfilePage";
import InstructorProfilePage from "../pages/instructor/InstructorProfilePage";
import InstructorSectionsPage from "../pages/instructor/SectionsPage";
import StudentSectionsPage from "../pages/student/SectionsPage";
import Activities from "../pages/superadmin/Activities";
import Vouchers from "../pages/orgAdmin/Vouchers";
import AssessmentSubmittedPage from "../pages/student/AssessmentSubmittedPage";
import StudentDetailsPage from "../pages/orgAdmin/StudentDetailsPage";
import PreviewAssessmentPage from "../components/instructor/PreviewAssessmentPage";
import CategoryPage from "../pages/orgAdmin/CategoryPage";
import AuditLogs from "../pages/superadmin/AuditLogs";
import FacultyPage from "../pages/orgAdmin/FacultyPage";
import ProgramPage from "../pages/orgAdmin/ProgramPage";
import FAQ from "../pages/common/FAQ";
import TermsAndCondition from "../pages/common/TermsAndCondition";
import PrivacyPolicy from "../pages/common/PrivacyPolicy";
import PerformanceSystemRedirect from "../pages/common/PerformanceSystemRedirect";
import Settings from "../pages/orgAdmin/Settings";
import AdminPerformancePage from "../pages/orgAdmin/AdminPerformancePage";
import AdminStudentPerformanceDetails from "../pages/orgAdmin/AdminStudentPerformanceDetails";
import WeeklySchedule from "../pages/instructor/WeeklySchedule";
import InstructorStudentPerformanceDetails from "../pages/instructor/InstructorStudentPerformanceDetails";
import InstructorCompletionPage from "../pages/instructor/InstructorCompletionPage";
import InstructorGradingPage from "../pages/instructor/InstructorGradingPage";
import InstructorLateMissingPage from "../pages/instructor/InstructorLateMissingPage";
import InstructorEnrollmentsPage from "../pages/instructor/InstructorEnrollmentsPage";

export const appRoutes = [
  //Superadmin routes
  {
    element: (
      <ProtectedRoutes element={<MainLayout />} allowedRoles={["superadmin"]} />
    ),
    children: [
      {
        path: "/admin/dashboard",
        element: <SuperadminDashboard />,
      },
      {
        path: "/admin/organization",
        element: <Organizations />,
      },
      {
        path: "/admin/activities",
        element: <Activities />,
      },
      {
        path: "/admin/audit",
        element: <AuditLogs />,
      },
      {
        path: "/admin/organization/:orgId",
        element: <OrganizationPage />,
      },
      {
        path: "/admin/organization/create",
        element: <CreateOrganization />,
      },
      {
        path: "/admin/organization/:id/edit",
        element: <CreateOrganization />,
      },
    ],
  },

  //Organization routes
  {
    element: (
      <ProtectedRoutes element={<MainLayout />} allowedRoles={["admin"]} />
    ),
    children: [
      {
        path: "/:orgCode/admin/dashboard",
        element: <OrgAdminDashboard />,
      },
      {
        path: "/:orgCode/admin/instructor",
        element: <InstructorDatabase />,
      },
      {
        path: "/:orgCode/admin/instructor/:id",
        element: <InstructorDetailsPage />,
      },
      {
        path: "/:orgCode/admin/student",
        element: <StudentDatabase />,
      },
      {
        path: "/:orgCode/admin/student/:id",
        element: <StudentDetailsPage />,
      },
      {
        path: "/:orgCode/admin/section",
        element: <OrgAdminSections />,
      },
      {
        path: "/:orgCode/admin/section/new",
        element: <NewSectionPage />,
      },
      {
        path: "/:orgCode/admin/section/:sectionCode",
        element: <EditSectionPage />,
      },
      {
        path: "/:orgCode/admin/course",
        element: <CoursePage />,
      },
      {
        path: "/:orgCode/admin/category",
        element: <CategoryPage />,
      },
      {
        path: "/:orgCode/admin/faculty",
        element: <FacultyPage />,
      },
      {
        path: "/:orgCode/admin/program",
        element: <ProgramPage />,
      },
      {
        path: "/:orgCode/admin/voucher",
        element: <Vouchers />,
      },
      {
        path: "/:orgCode/admin/profile",
        element: <AdminProfilePage />,
      },
      {
        path: "/:orgCode/admin/notifications",
        element: <Notifications />,
      },
      {
        path: "/:orgCode/admin/settings",
        element: <Settings />,
      },
      {
        path: "/:orgCode/admin/performance",
        element: <AdminPerformancePage />,
      },
      {
        path: "/:orgCode/admin/compliance",
        element: <AdminPerformancePage />,
      },
      {
        path: "/:orgCode/admin/performance/:studentId",
        element: <AdminStudentPerformanceDetails />,
      },
      {
        path: "/:orgCode/admin/compliance/:studentId",
        element: <AdminStudentPerformanceDetails />,
      },
      {
        path: "/:orgCode/admin/performance-system",
        element: <PerformanceSystemRedirect />,
      },
    ],
  },

  //Instructor routes
  {
    element: (
      <ProtectedRoutes element={<MainLayout />} allowedRoles={["instructor"]} />
    ),
    children: [
      {
        path: "/:orgCode/instructor/dashboard",
        element: <InstructorDashboard />,
      },
      {
        path: "/:orgCode/instructor/schedule",
        element: <WeeklySchedule />,
      },
      {
        path: "/:orgCode/instructor/sections",
        element: <InstructorSectionsPage />,
      },
      {
        path: "/:orgCode/instructor/sections/:sectionCode",
        element: <InstructorSectionPage />,
      },
      {
        path: "/:orgCode/instructor/sections/:sectionCode/assessment/:assessmentId",
        element: <InstructorAssessmentPage />,
      },
      {
        path: "/:orgCode/instructor/sections/:sectionCode/assessment/:assessmentId/preview",
        element: <PreviewAssessmentPage />,
      },
      {
        path: "/:orgCode/instructor/sections/:sectionCode/manage",
        element: <ManageSection />,
      },
      {
        path: "/:orgCode/instructor/profile",
        element: <InstructorProfilePage />,
      },
      {
        path: "/:orgCode/instructor/sections/:sectionCode/assessment/:assessmentId/student/:studentId",
        element: <AssessmentResult />,
      },
      {
        path: "/:orgCode/instructor/sections/:courseCode/lessons/:lessonId",
        element: <LessonsPage />,
      },
      {
        path: "/:orgCode/instructor/notifications",
        element: <Notifications />,
      },
      {
        path: "/:orgCode/instructor/performance",
        element: <PerformanceSystemRedirect />,
      },
      {
        path: "/:orgCode/instructor/completion",
        element: <InstructorCompletionPage />,
      },
      {
        path: "/:orgCode/instructor/performance-system",
        element: <PerformanceSystemRedirect />,
      },
      {
        path: "/:orgCode/instructor/performance/:studentId",
        element: <InstructorStudentPerformanceDetails />,
      },
      {
        path: "/:orgCode/instructor/completion/:studentId",
        element: <InstructorStudentPerformanceDetails />,
      },
      {
        path: "/:orgCode/instructor/grading",
        element: <InstructorGradingPage />,
      },
      {
        path: "/:orgCode/instructor/late-missing",
        element: <InstructorLateMissingPage />,
      },
      {
        path: "/:orgCode/instructor/enrollments",
        element: <InstructorEnrollmentsPage />,
      },
    ],
  },

  //Student routes
  {
    element: (
      <ProtectedRoutes element={<MainLayout />} allowedRoles={["student"]} />
    ),
    children: [
      {
        path: "/:orgCode/student/dashboard",
        element: <StudentDashboard />,
      },
      {
        path: "/:orgCode/student/sections",
        element: <StudentSectionsPage />,
      },
      {
        path: "/:orgCode/student/sections/:sectionCode",
        element: <StudentSectionPage />,
      },
      {
        path: "/:orgCode/student/sections/:sectionCode/lessons/:lessonId",
        element: <LessonsPage />,
      },
      {
        path: "/:orgCode/student/calendar",
        element: <CalendarPage />,
      },
      {
        path: "/:orgCode/student/portfolio",
        element: <StudentDashboard />,
      },
      {
        path: "/:orgCode/student/inbox",
        element: <StudentDashboard />,
      },
      {
        path: "/:orgCode/student/sections/:sectionCode/assessment/:assessmentId",
        element: <AssessmentPage />,
      },
      {
        path: "/:orgCode/student/sections/:sectionCode/assessment/:assessmentId/submitted",
        element: <AssessmentSubmittedPage />,
      },
      {
        path: "/:orgCode/student/:assessmentType/:assessmentId/result",
        element: <AssessmentResult />,
      },
      {
        path: "/:orgCode/student/profile",
        element: <StudentProfilePage />,
      },
      {
        path: "/:orgCode/student/notifications",
        element: <Notifications />,
      },
    ],
  },

  // common routes
  {
    element: (
      <ProtectedRoutes
        element={<MainLayout />}
        allowedRoles={["superadmin", "admin", "instructor", "student"]}
      />
    ),
    children: [
      {
        path: "/FAQ",
        element: <FAQ />,
      },
      {
        path: "/termsandconditions",
        element: <TermsAndCondition />,
      },
      {
        path: "/privacypolicy",
        element: <PrivacyPolicy />,
      },
    ],
  },

  //Auth routes
  {
    element: <AuthLayout />,
    children: [
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/register",
        element: <Register />,
      },
      {
        path: "/",
        element: <Navigate to="/login" />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
];
