import { FaRegClock } from "react-icons/fa";
import { IoLocationOutline } from "react-icons/io5";

interface Participant {
  id: number;
  name: string;
  avatar: string;
}

interface CalendarEventProps {
  title: string;
  startTime: string;
  endTime: string;
  location: string;
  participants: Participant[];
  style: React.CSSProperties;
}

export default function CalendarEvent({
  title,
  startTime,
  endTime,
  location,
  participants,
  style,
}: CalendarEventProps) {
  return (
    <div
      className="absolute h-[160px] flex flex-col justify-between bg-[#eefafe] rounded-xl p-3"
      style={style}
    >
      <div>
        <h3 className="text-secondary text-lg font-medium">{title}</h3>
        <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
          <span className="flex items-center gap-2">
            <FaRegClock /> {startTime} - {endTime}
          </span>
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
          <IoLocationOutline className="text-lg -translate-x-0.5" />{" "}
          <span>{location}</span>
        </div>
      </div>
      <div>
        <div className="flex -space-x-2 mb-2">
          {participants.map((participant, i) => (
            <img
              key={i}
              src={participant.avatar}
              alt={participant.name}
              className="w-6 h-6 rounded-full border-2 border-white"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
