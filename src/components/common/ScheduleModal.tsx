import { FaRegClock } from "react-icons/fa";
import { convert24to12Format } from "../../lib/dateUtils";
import Dialog from "./Dialog";
import { ISchedule } from "../../types/interfaces";

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: ISchedule;
}

const ScheduleModal = ({ isOpen, onClose, schedule }: ScheduleModalProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString)
      .toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
      .toUpperCase();
  };

  const calculateDuration = (start: string, end: string) => {
    const startDate = new Date(`2000-01-01T${start}`);
    const endDate = new Date(`2000-01-01T${end}`);
    const diffMs = endDate.getTime() - startDate.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return hours > 0
      ? `${hours}h${minutes > 0 ? ` ${minutes}m` : ""}`
      : `${minutes}m`;
  };

  return (
    <Dialog
      title="Section Schedule"
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      backdrop="blur"
      animation="pop"
      showCloseButton={true}
    >
      <div className="flex flex-col">
        <div className="mb-6 bg-gray-100 p-4 rounded-lg">
          <p className="text-sm font-semibold text-gray-600 mb-2">Duration</p>
          <p className="text-base text-gray-700 font-medium">
            {formatDate(schedule.startDate)} - {formatDate(schedule.endDate)}
          </p>
        </div>

        <hr className="text-gray-600 mb-4" />

        <div className="mb-6">
          <p className="text-sm font-semibold text-gray-600 mb-3">
            Weekly Schedule
          </p>
          <div className="space-y-3">
            {schedule.breakdown
              .sort((a, b) => a.day.localeCompare(b.day))
              .map((daySchedule) => (
                <div
                  key={daySchedule._id}
                  className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-800 capitalize">
                      {daySchedule.day}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-gray-600">
                      <span className="text-sm">
                        <FaRegClock />
                      </span>
                      <span className="text-sm">
                        {convert24to12Format(daySchedule.time.start).replace(
                          " ",
                          ""
                        )}{" "}
                        -{" "}
                        {convert24to12Format(daySchedule.time.end).replace(
                          " ",
                          ""
                        )}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                      {calculateDuration(
                        daySchedule.time.start,
                        daySchedule.time.end
                      )}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default ScheduleModal;
