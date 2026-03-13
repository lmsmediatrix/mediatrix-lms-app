import Dialog from "./Dialog";
import { formatDateTimeFull } from "../../lib/dateUtils";
import {
  MdInfoOutline,
  MdPersonOutline,
  MdHttp,
  MdAccessTime,
  MdCompareArrows,
} from "react-icons/md";

interface AuditLogDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  audit: any | null;
}

export default function AuditLogDetailsModal({
  isOpen,
  onClose,
  audit,
}: AuditLogDetailsModalProps) {
  if (!audit) return null;
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
          Audit Log Details
        </h2>
        {/* Basic Information */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-3">
            <MdInfoOutline className="text-primary" size={22} /> Basic
            Information
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div>
              <div className="text-gray-400 mb-1">Type</div>
              <div className="text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-500 font-medium w-fit">
                {audit.type}
              </div>
            </div>
            <div>
              <div className="text-gray-400 mb-1">Severity</div>
              <div
                className={`text-xs px-3 py-1 rounded-full w-fit font-medium ${
                  audit.severity === "HIGH"
                    ? "bg-red-100 text-red-800"
                    : audit.severity === "MEDIUM"
                    ? "bg-yellow-100 text-yellow-800"
                    : audit.severity === "INFO"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {audit.severity}
              </div>
            </div>
            <div>
              <div className="text-gray-400">Audit ID</div>
              <div className="font-mono">{audit._id}</div>
            </div>
            <div>
              <div className="text-gray-400">Entity</div>
              <div>
                {audit.entity?.type}{" "}
                <span className="font-mono">{audit.entity?.id}</span>
              </div>
            </div>
            <div className="md:col-span-2">
              <div className="text-gray-400">Description</div>
              <div>{audit.description}</div>
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
              <div className="font-mono">{audit.user?._id}</div>
            </div>
            <div>
              <div className="text-gray-400">Name</div>
              <div>
                {audit.user?.firstName} {audit.user?.lastName}
              </div>
            </div>
            <div className="md:col-span-2">
              <div className="text-gray-400">Email</div>
              <div>{audit.user?.email}</div>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 my-6" />
        {/* Request/Metadata Information */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-3">
            <MdHttp className="text-primary" size={22} /> Request Metadata
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div>
              <div className="text-gray-400">Method</div>
              <div>{audit.metadata?.method}</div>
            </div>
            <div>
              <div className="text-gray-400">Path</div>
              <div>{audit.metadata?.path}</div>
            </div>
            <div>
              <div className="text-gray-400">User Agent</div>
              <div className="break-all">{audit.metadata?.userAgent}</div>
            </div>
            <div>
              <div className="text-gray-400">IP Address</div>
              <div>{audit.metadata?.ip}</div>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 my-6" />
        {/* Changes (Before/After) */}
        {audit.changes && (
          <div className="mb-6">
            <div className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-3">
              <MdCompareArrows className="text-primary" size={22} /> Changes
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm items-stretch min-h-[100px]">
              <div className="h-full flex flex-col">
                <div className="text-gray-400">Before</div>
                <pre className="bg-gray-100 rounded p-2 text-xs overflow-x-auto h-full min-h-[100px] flex-1">
                  {audit.changes.before
                    ? JSON.stringify(audit.changes.before, null, 2)
                    : ""}
                </pre>
              </div>
              <div className="h-full flex flex-col">
                <div className="text-gray-400">After</div>
                <pre className="bg-gray-100 rounded p-2 text-xs overflow-x-auto h-full min-h-[100px] flex-1">
                  {audit.changes.after
                    ? JSON.stringify(audit.changes.after, null, 2)
                    : ""}
                </pre>
              </div>
            </div>
          </div>
        )}
        <div className="border-t border-gray-200 my-6" />
        {/* Timestamp Information */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-3">
            <MdAccessTime className="text-primary" size={22} /> Timestamp
          </div>
          <div className="text-sm">{formatDateTimeFull(audit.timestamp)}</div>
        </div>
        <div className="border-t border-gray-200 my-6" />
      </div>
    </Dialog>
  );
}