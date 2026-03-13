import {
  useMarkAsRead,
  useSearchNotifications,
} from "../../hooks/useNotification";
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { formatDateMMMDDYYY } from "../../lib/dateUtils";
import { useAuth } from "../../context/AuthContext";

interface INotification {
  _id: string;
  title: string;
  description: string;
  category: string;
  recipients: {
    read: Array<{
      user: string;
      date: string;
      _id: string;
    }>;
    unread: Array<{
      user: string;
      date?: string;
      _id?: string;
    }>;
  };
  metadata: {
    path: string;
    assessment?: {
      title: string;
      score?: number;
    };
    module?: {
      title: string;
      id: string;
    };
    lesson?: {
      title: string;
      id: string;
    };
    section?: {
      name: string;
      code: string;
    };
    updatedFields?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

const Notifications = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<"Read" | "Unread">(
    (searchParams.get("status") as "Read" | "Unread") || "Unread"
  );
  const navigate = useNavigate();
  const { orgCode } = useParams();
  const { currentUser } = useAuth();
  const currentUserId = currentUser?.user?.id;

  // Set default status parameter to Unread if not present
  useEffect(() => {
    if (!searchParams.get("status")) {
      setSearchParams((prev) => {
        prev.set("status", "Unread");
        return prev;
      });
    }
  }, [searchParams, setSearchParams]);
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const [skipLimit, setSkipLimit] = useState({
    skip: Number(searchParams.get("page") || "1") - 1,
    limit: 10,
  });

  const { mutate: markAsRead } = useMarkAsRead();

  const { data, isPending } = useSearchNotifications({
    skip: skipLimit.skip,
    limit: skipLimit.limit,
    searchTerm,
    status: activeTab.toLowerCase() as "read" | "unread",
  });

  const notifications = data?.notifications || [];
  const pagination = data?.pagination || {
    totalItems: 0,
    currentPage: 1,
    totalPages: 1,
    pageSize: 10,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  // Filter notifications based on whether current user is in the correct recipients array
  const filteredNotifications = notifications.filter((notification: INotification) => {
    if (!currentUserId) return false;

    if (activeTab === "Read") {
      // Show only notifications where current user is in recipients.read array
      return notification.recipients?.read?.some(
        (recipient) => recipient.user === currentUserId
      );
    } else {
      // Show only notifications where current user is in recipients.unread array
      return notification.recipients?.unread?.some(
        (recipient) => recipient.user === currentUserId
      );
    }
  });

  const handleTabChange = (tab: "Read" | "Unread") => {
    setActiveTab(tab);
    setSearchParams((prev) => {
      prev.set("status", tab);
      return prev;
    });
  };

  const handleSearchChange = (search: string) => {
    setSearchTerm(search);
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      if (search) {
        newParams.set("search", search);
      } else {
        newParams.delete("search");
      }
      return newParams;
    });
  };

  const handlePageChange = (newSkip: number) => {
    setSkipLimit((prev) => ({
      ...prev,
      skip: newSkip,
    }));
    setSearchParams((prev) => {
      prev.set("page", String(newSkip + 1));
      return prev;
    });
  };

  const handleMarkAsRead = (id: string) => {
    markAsRead({ id });
  };

  const handleNotificationClick = (notification: INotification) => {
    // Mark as read if it's currently unread
    const isUnread = notification.recipients?.unread?.some(
      (recipient) => recipient.user === currentUserId
    );

    if (isUnread) {
      markAsRead({ id: notification._id });
    }

    // Navigate to the path in metadata if available
    if (notification.metadata?.path) {
      navigate(`/${orgCode}${notification.metadata.path}`);
    }
  };

  // const handleMarkAllAsRead = () => {
  //   // This would need to be implemented in the backend
  //   // For now, we'll just mark each visible notification as read
  //   if (!currentUser) return;

  //   filteredNotifications.forEach((notification: any) => {
  //     if (notification.status === "Unread") {
  //       markAsRead({ id: notification._id });
  //     }
  //   });
  // };

  // Update how you determine if a notification is read/unread
  // You might need to add a utility function or modify your API to include this information
  // For now, let's assume we're using the updatedAt vs createdAt timestamps to determine this

  const isNotificationUnread = () => {
    return activeTab === "Unread";
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Notifications</h1>
          {/* <button
            className="text-sm text-[#3E5B93] hover:underline"
            onClick={handleMarkAllAsRead}
          >
            Mark all as read
          </button> */}
        </div>

        {/* Tabs and Search in one row */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4">
            {["Unread", "Read"].map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab as "Read" | "Unread")}
                className={`px-4 py-2 rounded-md text-sm ${
                  activeTab === tab
                    ? "bg-[#3E5B93] text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search Section - Right aligned */}
          <div className="w-full max-w-xs">
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#3E5B93]"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          {isPending ? (
            <div className="p-6 text-center text-gray-500">Loading...</div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No notifications
            </div>
          ) : (
            filteredNotifications.map((notification: INotification) => (
              <div
                key={notification._id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-6 border-b border-gray-100 last:border-b-0 ${
                  isNotificationUnread() ? "bg-blue-50/50" : ""
                } ${
                  notification.metadata?.path
                    ? "cursor-pointer hover:bg-gray-50"
                    : ""
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-900">
                    {notification.title}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {formatDateMMMDDYYY(notification.createdAt)}
                    </span>
                    {isNotificationUnread() && (
                      <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                        New
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {notification.description}
                </p>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-500">From: System</p>
                  {isNotificationUnread() && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering the parent div's onClick
                        handleMarkAsRead(notification._id);
                      }}
                      className="text-xs text-[#3E5B93] hover:underline"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {filteredNotifications.length > 0 && (
          <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
            <span>
              {filteredNotifications.length} result
              {filteredNotifications.length !== 1 ? "s" : ""}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(skipLimit.skip - 1)}
                disabled={!pagination.hasPreviousPage}
                className={`px-4 py-2 rounded-md border border-[#3E5B93] transition-all duration-300 ${
                  !pagination.hasPreviousPage
                    ? "opacity-50 cursor-not-allowed border-gray-300 text-gray-400"
                    : "text-[#3E5B93] hover:bg-[#3E5B93] hover:text-white"
                }`}
              >
                Previous
              </button>

              <span className="px-4 py-2 bg-gray-100 rounded-md font-medium">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>

              <button
                onClick={() => handlePageChange(skipLimit.skip + 1)}
                disabled={!pagination.hasNextPage}
                className={`px-4 py-2 rounded-md border border-[#3E5B93] transition-all duration-300 ${
                  !pagination.hasNextPage
                    ? "opacity-50 cursor-not-allowed border-gray-300 text-gray-400"
                    : "text-[#3E5B93] hover:bg-[#3E5B93] hover:text-white"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
