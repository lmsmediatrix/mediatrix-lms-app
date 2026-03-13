import Dialog from "./Dialog";
import { formatDateTimeFull } from "../../lib/dateUtils";
import {
  MdInfoOutline,
  MdPersonOutline,
  MdHttp,
  MdComputer,
  MdAccessTime,
  MdArchive,
  MdCode,
} from "react-icons/md";

interface ActivityLogDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: any | null;
}

const getArchiveStatus = (archive: any) => {
  if (!archive || archive.status === false) return "Not Archived";
  if (archive.status && archive.date)
    return `Archived at ${formatDateTimeFull(archive.date)}`;
  return "Archived";
};

export default function ActivityLogDetailsModal({
  isOpen,
  onClose,
  activity,
}: ActivityLogDetailsModalProps) {
  if (!activity) return null;
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      size="4xl"
      backdrop="blur"
      animation="pop"
    >
      <div className="">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-2">
          Activity Log Details
          <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500 font-medium">
            {activity.action}
          </span>
        </h2>
        {/* Basic Information */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-3">
            <MdInfoOutline className="text-primary" size={22} /> Basic
            Information
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div>
              <div className="text-gray-400">Activity ID</div>
              <div className="font-mono">{activity._id}</div>
            </div>
            <div>
              <div className="text-gray-400">Entity Type</div>
              <div>{activity.entityType}</div>
            </div>
            <div className="md:col-span-2">
              <div className="text-gray-400">Description</div>
              <div>{activity.description}</div>
            </div>
            <div>
              <div className="text-gray-400">Organization ID</div>
              <div className="font-mono">{activity.organizationId}</div>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 my-6" />
        {/* User Information */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-3">
            <MdPersonOutline className="text-primary" size={22} /> User
            Information
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div>
              <div className="text-gray-400">User ID</div>
              <div className="font-mono">{activity.userId?._id}</div>
            </div>
            <div>
              <div className="text-gray-400">Name</div>
              <div>
                {activity.userId?.firstName} {activity.userId?.lastName}
              </div>
            </div>
            <div className="md:col-span-2">
              <div className="text-gray-400">Email</div>
              <div>{activity.userId?.email}</div>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 my-6" />
        {/* Request Information */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-3">
            <MdHttp className="text-primary" size={22} /> Request Information
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div>
              <div className="text-gray-400">Method</div>
              <div>{activity.method}</div>
            </div>
            <div>
              <div className="text-gray-400">Path</div>
              <div>{activity.path}</div>
            </div>
            <div>
              <div className="text-gray-400">Page URL</div>
              <div>{activity.page?.url}</div>
            </div>
            <div>
              <div className="text-gray-400">Page Title</div>
              <div>{activity.page?.title}</div>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 my-6" />
        {/* Client Information */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-3">
            <MdComputer className="text-primary" size={22} /> Client Information
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div>
              <div className="text-gray-400">IP Address</div>
              <div>{activity.ip}</div>
            </div>
            <div>
              <div className="text-gray-400">User Agent</div>
              <div className="break-all">
                {activity.headers?.["user-agent"]}
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 my-6" />
        {/* Timestamp Information */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-3">
            <MdAccessTime className="text-primary" size={22} /> Timestamp
            Information
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div>
              <div className="text-gray-400">Created At</div>
              <div>{formatDateTimeFull(activity.createdAt)}</div>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 my-6" />
        {/* Archive Status */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-3">
            <MdArchive className="text-primary" size={22} /> Archive Status
          </div>
          <div className="text-sm">{getArchiveStatus(activity.archive)}</div>
        </div>
        <div className="border-t border-gray-200 my-6" />
        {/* All Headers */}
        <div className="mb-2">
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-3">
            <MdCode className="text-primary" size={22} /> All Headers
          </div>
          <pre className="bg-gray-100 rounded p-2 text-xs overflow-x-auto">
            {JSON.stringify(activity.headers, null, 2)}
          </pre>
        </div>
      </div>
    </Dialog>
  );
}
