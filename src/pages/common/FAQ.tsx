import { useState } from "react";
import Accordion from "../../components/common/Accordion";
import {
  IoBookOutline,
  IoPeopleOutline,
  IoSchoolOutline,
  IoPersonOutline,
} from "react-icons/io5";
const faqData = {
  general: [
    {
      title: "What are the different user roles in the LMS?",
      content:
        "The LMS supports three main user roles: School Admin, Instructor, and Student. School Admins manage courses, sections, and user accounts. Instructors handle section content, assessments, and grades. Students access sections, complete assignments, and view grades.",
    },
    {
      title: "What types of assessments are supported in the LMS?",
      content:
        "The LMS supports five assessment types: Quiz, Assignment, Activity, Monthly Test, and Periodical Test. Assessments can include questions like Multiple Choice, True/False, Enumeration, Fill in the Blank, and Essay.",
    },
    {
      title: "What features are coming soon to the LMS?",
      content:
        "Upcoming features include a Calendar for tracking dates and deadlines, a Portfolio for organizing coursework files, and an Inbox for managing assignments and communication.",
    },
    {
      title: "How are sections organized in the LMS?",
      content:
        "Sections are class groups that include a course, schedule, assigned instructor, and enrolled students. School Admins create and manage sections, while Instructors manage content like modules, announcements, and assessments within their assigned sections.",
    },
    {
      title: "What grading methods are available in the LMS?",
      content:
        "The LMS offers two grading methods: Points-Based (numerical scale from 1 to 5) and Letter Grade (A, B, C, D, E, F). Instructors can configure grade distributions and scales for each section.",
    },
    {
      title: "What dashboard features are available in the LMS?",
      content:
        "The LMS dashboards provide role-specific insights: School Admins view student and instructor metrics, announcements, and events. Instructors see active sections, student metrics, and attendance overviews. Students track assignments, recent sections, and upcoming events.",
    },
    {
      title: "What types of analytics are available in the LMS?",
      content:
        "Analytics vary by role. School Admins access student (e.g., total, active) and instructor (e.g., part-time, full-time) metrics. Instructors view section analytics like enrollment and average grades. Students can see their grades and progress within sections.",
    },
  ],
  school_admin: [
    {
      title: "How do I manage user accounts?",
      content:
        "School Admins can create accounts for Instructors, Students, and Admins via the User Management section. They can also delete Instructor accounts and update Admin and Instructor details to keep user information accurate.",
    },
    {
      title: "How do I create and manage courses and sections?",
      content:
        'In the Dashboard, use the "Create Course" option to add new courses via a modal. For sections, use the "Create Section" form to organize students and instructors, and manage their assignments in the Sections tab.',
    },
    {
      title: "How do I handle bulk imports for instructors and students?",
      content:
        "In the Instructor and Student Database sections, use the Bulk Import feature in the respective tables to add multiple instructors or students at once, streamlining onboarding.",
    },
    {
      title: "How do I view summaries and metrics?",
      content:
        "The Dashboard provides summaries of student metrics (e.g., total students, active students), instructor metrics (e.g., part-time, full-time), announcements, and upcoming events to monitor engagement and plan activities.",
    },
    {
      title: "How do I manage the instructor and student databases?",
      content:
        "In the Instructor and Student Database sections, view overview metrics (e.g., part-time/full-time instructors, total/active students) and use tables to create, edit, or delete individual records or perform bulk imports.",
    },
    {
      title: "How do I delete accounts in the LMS?",
      content:
        "School Admins can delete Instructor accounts via the User Management section. Student and Admin account deletion is not currently supported, but you can update their details as needed.",
    },
    {
      title: "How do I manage events and announcements?",
      content:
        "In the Dashboard, view upcoming events to plan activities and monitor school-wide announcements to stay informed. You can also create or manage announcements for sections as needed.",
    },
  ],
  instructor: [
    {
      title: "How do I create and manage assessments?",
      content:
        "In the Sections tab, select a section and use the Assessments Tab to create assessments (Quiz, Assignment, Activity, Monthly Test, Periodical Test). You can add questions (Multiple Choice, True/False, etc.), set due dates, and view submission status and results.",
    },
    {
      title: "How do I manage grades and rubrics?",
      content:
        "In the Grades Tab of a section, configure grading methods (Points-Based or Letter Grade), set grade distributions, and define scales. You can record student grades per assessment type and manage rubrics.",
    },
    {
      title: "How do I view section analytics and attendance?",
      content:
        "The Analytics Tab shows metrics like total students enrolled and average grades. The Attendance Tab lists student attendance for the section, helping you monitor participation.",
    },
    {
      title: "How do I manage modules and announcements?",
      content:
        "In the Modules Tab, create, update, or delete lessons and modules. In the Announcements Tab, post and manage updates to keep students informed about section-specific information.",
    },
    {
      title: "How do I view and manage section details?",
      content:
        "In the Sections tab, select a section to view its details, including description, schedule, and assigned course. You can edit modules, announcements, assessments, and grades within the section.",
    },
    {
      title: "How do I access recently updated sections?",
      content:
        "The Dashboard displays the last updated or viewed section, allowing quick access to recent activity. You can also view a list of all your sections in the Sections tab.",
    },
    {
      title: "How do I create different types of assessment questions?",
      content:
        "In the Assessments Tab, create questions like Multiple Choice, True/False, Enumeration, Fill in the Blank, or Essay. Configure each question’s settings and include them in quizzes, assignments, or tests.",
    },
  ],
  student: [
    {
      title: "How do I submit assignments and complete assessments?",
      content:
        "In the Section Page View, go to the Assessment Tab to view and complete assessments (e.g., quizzes, assignments). Submit your work through the interface, and check due dates and submission status.",
    },
    {
      title: "How do I access lessons and course materials?",
      content:
        "In the My Sections tab, select a section and go to the Module Tab to choose a lesson. View lesson content and download attached files for offline access from the Lesson Page.",
    },
    {
      title: "How do I check my grades and stay updated?",
      content:
        "Use the Grades Tab in a section to view your assessment grades. Check the Announcement Tab for instructor updates and the Dashboard for upcoming events and critical assignments.",
    },
    {
      title: "How do I join a class session?",
      content:
        'In the Section Page View, click the "Attend Class" button to join an online or in-person class session, based on the section’s schedule.',
    },
    {
      title: "What can I track on my dashboard?",
      content:
        "The Student Dashboard shows total assignments, critical assignments, work in progress, recently accessed sections, upcoming events, and announcements to help you stay organized.",
    },
    {
      title: "How do I download course materials?",
      content:
        "In the Lesson Page, select a lesson and use the download option to save attached files for offline access, such as study guides or resources.",
    },
    {
      title: "How do I view upcoming events and critical assignments?",
      content:
        "The Dashboard displays upcoming events (e.g., deadlines, class sessions) and critical assignments requiring urgent attention, helping you prioritize tasks.",
    },
  ],
};

export default function FAQ() {
  const [activeTab, setActiveTab] = useState("general");
  const [searchTerm, setSearchTerm] = useState("");

  const tabs = [
    { id: "general", label: "General", icon: <IoBookOutline /> },
    { id: "school_admin", label: "School Admin", icon: <IoPeopleOutline /> },
    { id: "instructor", label: "Instructor", icon: <IoSchoolOutline /> },
    { id: "student", label: "Student", icon: <IoPersonOutline /> },
  ];

  // Filter FAQs based on search term
  const filteredFaqs = faqData[activeTab as keyof typeof faqData].filter(
    (faq) =>
      faq.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 bg-white">
      <h1 className="text-3xl font-bold text-center mb-2">
        Learning Management System FAQ
      </h1>
      <p className="text-gray-600 text-center mb-6">
        Find answers to common questions about our comprehensive Learning
        Management System
      </p>

      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <svg
            className="w-5 h-5 text-gray-400"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 20 20"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
            />
          </svg>
        </div>
        <input
          type="search"
          className="block w-full p-4 pl-10 text-gray-900 border border-gray-200 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Search for questions or keywords..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setSearchTerm(""); // Clear search term when switching tabs
            }}
            className={`flex items-center justify-center gap-2 flex-1 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
              activeTab === tab.id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <span className="hidden md:inline">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq, index) => (
            <Accordion key={index} title={faq.title} defaultExpanded={false}>
              <div className="py-4 px-10 text-gray-600 bg-white">
                {faq.content}
              </div>
            </Accordion>
          ))
        ) : (
          <p className="text-gray-600 text-center">
            No FAQs found matching your search.
          </p>
        )}
      </div>
    </div>
  );
}
