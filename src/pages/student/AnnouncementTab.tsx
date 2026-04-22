import Accordion from "../../components/common/Accordion";
import Table from "../../components/common/Table";
import { GrAnnounce } from "react-icons/gr";
import { formatDateMMMDDYYY } from "../../lib/dateUtils";
import { IAnnouncement } from "../../types/interfaces";
import { useSearchParams } from "react-router-dom";
import AnnouncementModal from "../../components/student/AnnouncementModal";
import InstructorTableEmptyState from "../../components/instructor/InstructorTableEmptyState";
import { useAuth } from "../../context/AuthContext";
import { useSectionAnnouncement } from "../../hooks/useSection";
import AnnouncementTabSkeleton from "../../components/skeleton/AnnouncementTabSkeleton";

interface AnnouncementTabProps {
  sectionCode: string;
}

export default function AnnouncementTab({ sectionCode }: AnnouncementTabProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const announcementId = searchParams.get("id");
  const { currentUser } = useAuth();
  const { data, isPending } = useSectionAnnouncement(sectionCode);

  // Handle loading state
  if (isPending) {
    return <AnnouncementTabSkeleton />;
  }

  // Ensure data is defined and has announcements
  const currentAnnouncements: IAnnouncement[] = data?.currentAnnouncement || [];
  const futureAnnouncements: IAnnouncement[] = data?.futureAnnouncement || [];
  const pastAnnouncements: IAnnouncement[] = data?.pastAnnouncement || [];

  const columns = [
    { key: "date", header: "Date", width: "15%" },
    { key: "title", header: "Title", width: "35%" },
    { key: "messageSummary", header: "Message Summary", width: "50%" },
  ];

  const renderTableRows = (announcements: IAnnouncement[]) => {
    return announcements.map((announcement, index) => {
      // Extract plain text by removing HTML tags
      const plainText = announcement.textBody.replace(/<[^>]+>/g, "").trim();

      return (
        <tr
          key={index}
          className="border-b border-gray-200 bg-white hover:bg-gray-50 cursor-pointer"
          onClick={() =>
            setSearchParams({ tab: "announcements", id: announcement._id })
          }
        >
          <td className="py-4 px-4">
            {formatDateMMMDDYYY(announcement.publishDate)}
          </td>
          <td className="py-4 px-4">
            <div className="flex items-center gap-2 text-left w-full">
              <GrAnnounce />
              {announcement.title}
            </div>
          </td>
          <td className="py-4 px-4">
            <p className="line-clamp-1">{plainText}</p>
          </td>
        </tr>
      );
    });
  };

  const renderAccordionContent = (
    announcements: IAnnouncement[],
    type: string
  ) => {
    if (announcements.length === 0) {
      if (
        type === "current" &&
        currentUser.user.role === "instructor" &&
        pastAnnouncements.length === 0 &&
        futureAnnouncements.length === 0
      ) {
        return (
          <div className="md:px-8 py-4">
            <InstructorTableEmptyState
              title="Create Your First Announcement"
              description="Start by creating an announcement to communicate important information to your students."
              type="announcement"
            />
          </div>
        );
      }
      return (
        <div className="md:px-8 py-4 text-center text-gray-500">
          No {type} announcements available
        </div>
      );
    }
    return (
      <div className="p-2">
        <Table columns={columns}>{renderTableRows(announcements)}</Table>
      </div>
    );
  };

  return (
    <div className="relative">
      <div className="space-y-2 md:space-y-4">
        <Accordion
          title="Current Announcements"
          subtitle={`(${currentAnnouncements.length})`}
          defaultExpanded={true}
        >
          {renderAccordionContent(currentAnnouncements, "current")}
        </Accordion>

        <Accordion
          title="Future Announcements"
          subtitle={`(${futureAnnouncements.length})`}
        >
          {renderAccordionContent(futureAnnouncements, "future")}
        </Accordion>

        <Accordion
          title="Past Announcements"
          subtitle={`(${pastAnnouncements.length})`}
        >
          {renderAccordionContent(pastAnnouncements, "past")}
        </Accordion>
      </div>
      {announcementId && <AnnouncementModal />}
    </div>
  );
}
