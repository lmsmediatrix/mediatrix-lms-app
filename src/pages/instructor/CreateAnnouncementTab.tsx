import { IoAdd } from "react-icons/io5";
import Accordion from "../../components/common/Accordion";
import Table from "../../components/common/Table";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { GrAnnounce } from "react-icons/gr";
import Button from "../../components/common/Button";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { useNavigate, useSearchParams } from "react-router-dom";
import { IAnnouncement } from "../../types/interfaces";
import {
  formatDateMMMDDYYY,
  isCurrentAnnouncement,
  isPastAnnouncement,
} from "../../lib/dateUtils";
import CreateAnnouncementModal from "../../components/instructor/CreateAnnouncementModal";
import { toast } from "react-toastify";
import Dialog from "../../components/common/Dialog";
import { useDeleteAnnouncement } from "../../hooks/useAnnouncement";
import { useSectionAnnouncement } from "../../hooks/useSection";
import AnnouncementTabSkeleton from "../../components/skeleton/AnnouncementTabSkeleton";

interface CreateAnnouncementTabProps {
  sectionName?: string;
  sectionCode: string;
}

export default function CreateAnnouncementTab({ sectionName, sectionCode }: CreateAnnouncementTabProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const modal = searchParams.get("modal");
  const navigate = useNavigate();
  const deleteAnnouncement = useDeleteAnnouncement();
  const { data, isPending } = useSectionAnnouncement(sectionCode);

  // Handle loading state
  if (isPending) {
    return <AnnouncementTabSkeleton />;
  }

  // Ensure data is defined and has announcements
  const announcements: IAnnouncement[] = data?.currentAnnouncement.concat(
    data?.futureAnnouncement || [],
    data?.pastAnnouncement || []
  ) || [];

  // Split announcements using dateUtils
  const currentAnnouncements = announcements.filter((announcement) =>
    isCurrentAnnouncement(announcement.publishDate)
  );
  const pastAnnouncements = announcements.filter((announcement) =>
    isPastAnnouncement(announcement.publishDate)
  );

  const tableColumns = [
    { key: "date", header: "Date", width: "15%" },
    { key: "title", header: "Title", width: "35%" },
    { key: "messageSummary", header: "Message Summary", width: "50%" },
  ];

  const renderTableRows = (announcements: IAnnouncement[]) => {
    if (announcements.length === 0) {
      return (
        <tr className="border-b border-gray-200 bg-white">
          <td colSpan={3} className="py-4 px-6 text-center text-gray-500">
            No announcement available
          </td>
        </tr>
      );
    }

    return announcements.map((announcement, index) => {
      // Extract plain text by removing HTML tags
      const plainText = announcement.textBody.replace(/<[^>]+>/g, "").trim();

      return (
        <tr key={index} className="border-b border-gray-200 bg-white">
          <td className="p-4">
            {formatDateMMMDDYYY(announcement.publishDate)}
          </td>
          <td className="p-4">
            <div className="flex items-center gap-2">
              <span>
                <GrAnnounce />
              </span>
              {announcement.title}
            </div>
          </td>
          <td className="p-4">
            <div className="flex items-center justify-between">
              <span className="line-clamp-1">{plainText}</span>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setSearchParams({
                      tab: "announcements",
                      modal: "edit-announcements",
                      announcementId: announcement._id,
                    })
                  }
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <FiEdit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    openDeleteModal(announcement._id);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </td>
        </tr>
      );
    });
  };

  const openDeleteModal = (announcementId: string) => {
    setSearchParams({
      tab: "announcements",
      modal: "delete-announcement",
      announcementId: announcementId,
    });
  };

  const handleDelete = (announcementId: string) => {
    toast.promise(
      deleteAnnouncement.mutateAsync(announcementId, {
        onSuccess: () => {
          handleCloseModal();
        },
      }),
      {
        pending: "Deleting announcement...",
        success: "Announcement deleted successfully",
        error: "Failed to delete announcement",
      }
    );
  };

  const handleCloseModal = () => {
    setSearchParams({ tab: "announcements" });
  };

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-lg md:shadow">
      <div className="flex justify-between border-b border-gray-200 p-4">
        <div className="flex gap-2 items-center">
          <div className="bg-green-600 w-1.5 md:w-2 h-8 md:h-12" />
          <h2 className="text-lg md:text-xl font-bold">Announcements</h2>
        </div>
        <button
          onClick={() =>
            setSearchParams({
              tab: "announcements",
              modal: "create-announcements",
            })
          }
          className="px-2 md:px-4 py-2 text-sm text-green-600 border border-green-600 rounded-lg hover:bg-green-100 font-medium flex items-center gap-2"
        >
          <IoAdd className="text-lg" />
          Announcement
        </button>
      </div>

      <div className="space-y-2 py-2 md:p-6">
        <Accordion
          title="Current Announcements"
          subtitle={`(${currentAnnouncements.length})`}
          defaultExpanded={true}
        >
          <div className="md:px-8 md:py-4">
            <Table columns={tableColumns}>
              {renderTableRows(currentAnnouncements)}
            </Table>
          </div>
        </Accordion>

        <Accordion
          title="Past Announcements"
          subtitle={`(${pastAnnouncements.length})`}
          defaultExpanded={true}
        >
          <div className="md:px-8 md:py-4">
            <Table columns={tableColumns}>
              {renderTableRows(pastAnnouncements)}
            </Table>
          </div>
        </Accordion>
      </div>

      <div className="border-t flex justify-between p-2 md:p-4">
        <Button onClick={() => navigate("?tab=modules")} variant="cancel">
          <FaArrowLeft />
          Back
        </Button>
        <Button onClick={() => navigate("?tab=assessments")} variant="outline">
          Next <FaArrowRight />
        </Button>
      </div>

      {(modal === "create-announcements" || modal === "edit-announcements") && (
        <CreateAnnouncementModal
          isOpen={true}
          onClose={() => setSearchParams({ tab: "announcements" })}
          sectionName={sectionName}
        />
      )}

      {modal === "delete-announcement" &&
        searchParams.get("announcementId") && (
          <Dialog
            isOpen={true}
            onClose={handleCloseModal}
            title="Delete Announcement"
            contentClassName="w-[50vw]"
            backdrop="blur"
          >
            <>
              <p>Are you sure you want to delete this announcement?</p>
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  onClick={handleCloseModal}
                  variant="cancel"
                  className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    handleDelete(searchParams.get("announcementId")!);
                  }}
                  variant="destructive"
                  isLoading={deleteAnnouncement.isPending}
                  isLoadingText="Deleting Announcement..."
                >
                  Delete
                </Button>
              </div>
            </>
          </Dialog>
        )}
    </div>
  );
}