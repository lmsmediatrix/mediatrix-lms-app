import { useState, useRef, useEffect } from "react";
import { useMarkAsRead, useNotification } from "../../hooks/useNotification";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getRouteRoleSegment } from "../../lib/utils";

interface INotification {
  _id: string;
  title: string;
  description: string;
  category: string;
  recipients: {
    read: Array<{
      user: {
        _id: string;
        firstName: string;
        lastName: string;
      };
      date: string | null;
      _id: string;
    }>;
    unread: Array<{
      user: {
        _id: string;
        firstName: string;
        lastName: string;
      };
      date: string | null;
      _id: string;
    }>;
  };
  source: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  metadata: {
    path: string;
    section?: {
      name: string;
      code: string;
    };
  };
}

interface NotificationMenuProps {
  isOpen: boolean;
  onClose: () => void;
  notificationButtonRef: React.RefObject<HTMLButtonElement>; // Add new prop
}

export default function NotificationMenu({
  isOpen,
  onClose,
  notificationButtonRef,
}: NotificationMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"unread" | "read">("unread");
  const { orgCode } = useParams();
  const navigate = useNavigate();

  const { currentUser } = useAuth();
  const routeRole = getRouteRoleSegment(currentUser.user.role);

  const { data, isPending } = useNotification({
    skip: 0,
    limit: 2,
    sort: "-createdAt",
    status: activeTab,
    document: true,
  });

  const { mutate: markAsRead } = useMarkAsRead();

  const notifications = data?.data || [];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        notificationButtonRef.current &&
        !notificationButtonRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  const handleNotificationClick = (notification: INotification) => {
    // Mark notification as read when clicked
    markAsRead({ id: notification._id });
    navigate(`/${orgCode}${notification.metadata.path}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute top-12 -right-16 w-[calc(100vw-16px)] md:w-[380px] bg-white rounded-lg shadow-lg border border-gray-200 z-50 mx-4 md:mx-0"
    >
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Notifications</h3>
          {/* <button
            onClick={() => {
              // Mark all unread notifications as read
              notifications.forEach((notification: INotification) => {
                markAsRead({ id: notification._id });
              });
            }}
            className="text-sm text-[#3E5B93] hover:underline"
          >
            Mark all as read
          </button> */}
        </div>

        <div className="flex gap-2">
          {["unread", "read"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as "unread" | "read")}
              className={`px-3 py-1 rounded-full text-sm ${
                activeTab === tab
                  ? "bg-[#3E5B93] text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {isPending ? (
          <div className="p-4 text-center text-gray-500">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No notifications</div>
        ) : (
          notifications.map((notification: INotification) => {
            // Determine if notification is unread based on the recipients array

            return (
              <div
                key={notification._id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${activeTab === "unread" && "bg-blue-50"}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-medium text-gray-900">
                    {notification.title}
                  </h4>
               
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {notification.description}
                </p>
                <p className="text-xs text-gray-500">
                  From: {notification.source.firstName}{" "}
                  {notification.source.lastName}
                </p>
              </div>
            );
          })
        )}
      </div>

      <div className="p-3 border-t border-gray-200 text-center">
        <button
          className="text-sm text-[#3E5B93] hover:underline"
          onClick={() => {
            navigate(`/${orgCode}/${routeRole}/notifications`);
          }}
        >
          View all notifications
        </button>
      </div>
    </div>
  );
}
