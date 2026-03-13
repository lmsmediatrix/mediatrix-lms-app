import Dialog from "../common/Dialog";
import { useSearchParams } from "react-router-dom";
import { formatDateMMMDDYYY } from "../../lib/dateUtils";
import Button from "../common/Button";
import { useGetAnnouncementById } from "../../hooks/useAnnouncement";

export default function AnnouncementModal() {
  const [searchParams, setSearchParams] = useSearchParams();
  const announcementId = searchParams.get("id");

  const { data: announcement, isPending } = useGetAnnouncementById(
    announcementId ? announcementId : ""
  );

  const handleClose = () => {
    searchParams.get("tab") === "announcements"
      ? setSearchParams({ tab: "announcements" })
      : setSearchParams({});
  };

  return (
    <Dialog
      title={isPending ? "Loading..." : announcement?.title || "Announcement"}
      subTitle={
        isPending
          ? ""
          : announcement
          ? formatDateMMMDDYYY(announcement.publishDate, true)
          : ""
      }
      backdrop="dark"
      animation="pop"
      isOpen={!!announcementId}
      onClose={handleClose}
      size="full"
      contentClassName="w-full md:w-[45vw] md:min-w-[500px]"
    >
      {isPending ? (
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      ) : announcement ? (
        <div
          className="prose prose-sm max-w-none text-gray-800"
          dangerouslySetInnerHTML={{ __html: announcement.textBody }}
        />
      ) : (
        <p className="text-gray-800">No announcement found.</p>
      )}

      <div className="flex justify-end mt-10">
        <Button onClick={handleClose} variant="cancel">
          Close
        </Button>
      </div>
    </Dialog>
  );
}
