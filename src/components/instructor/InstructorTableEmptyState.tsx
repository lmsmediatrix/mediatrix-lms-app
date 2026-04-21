import React from "react";
import { FaPlus } from "react-icons/fa";
import Button from "../common/Button";

interface InstructorTableEmptyStateProps {
  title: string;
  description: string;
  colSpan?: number;
  type: "module" | "announcement" | "assessment";
}

const InstructorTableEmptyState: React.FC<InstructorTableEmptyStateProps> = ({
  title,
  description,
  type,
}) => {
  // Render the appropriate illustration based on type
  const renderIllustration = () => {
    switch (type) {
      case "module":
        return (
          <svg
            width="200"
            height="160"
            viewBox="0 0 200 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="40"
              y="30"
              width="120"
              height="100"
              rx="8"
              fill="#F2F9FD"
              stroke="#60B2F0"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            {/* Module header */}
            <rect
              x="50"
              y="40"
              width="100"
              height="10"
              rx="2"
              fill="#3E5B93"
              fillOpacity="0.2"
            />
            {/* Lesson 1 */}
            <rect
              x="60"
              y="60"
              width="80"
              height="15"
              rx="2"
              fill="#60B2F0"
              fillOpacity="0.3"
            />
            {/* Lesson 2 */}
            <rect
              x="60"
              y="85"
              width="80"
              height="15"
              rx="2"
              fill="#60B2F0"
              fillOpacity="0.3"
            />
            {/* Lesson 3 */}
            <rect
              x="60"
              y="110"
              width="80"
              height="15"
              rx="2"
              fill="#60B2F0"
              fillOpacity="0.3"
            />
            {/* Module icon */}
            <path d="M100 20L110 35H90L100 20Z" fill="#C0DB70" />
          </svg>
        );
      case "announcement":
        return (
          <svg
            width="200"
            height="160"
            viewBox="0 0 200 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="50"
              y="40"
              width="100"
              height="80"
              rx="8"
              fill="#F2F9FD"
              stroke="#60B2F0"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            {/* Announcement icon */}
            <path
              d="M85 60C85 57.2386 87.2386 55 90 55H110C112.761 55 115 57.2386 115 60V70C115 72.7614 112.761 75 110 75H90C87.2386 75 85 72.7614 85 70V60Z"
              fill="#8FB02C"
              fillOpacity="0.3"
            />
            {/* Announcement lines */}
            <rect
              x="70"
              y="85"
              width="60"
              height="5"
              rx="2"
              fill="#3E5B93"
              fillOpacity="0.2"
            />
            <rect
              x="70"
              y="95"
              width="60"
              height="5"
              rx="2"
              fill="#3E5B93"
              fillOpacity="0.2"
            />
            <rect
              x="70"
              y="105"
              width="40"
              height="5"
              rx="2"
              fill="#3E5B93"
              fillOpacity="0.2"
            />
            {/* Megaphone */}
            <path
              d="M130 50L140 45V75L130 70V50Z"
              fill="#8FB02C"
              fillOpacity="0.5"
            />
            <path
              d="M120 55C125.523 55 130 59.4772 130 65C130 70.5228 125.523 75 120 75V55Z"
              fill="#8FB02C"
              fillOpacity="0.3"
            />
          </svg>
        );
      case "assessment":
        return (
          <svg
            width="200"
            height="160"
            viewBox="0 0 200 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="50"
              y="40"
              width="100"
              height="80"
              rx="8"
              fill="#F2F9FD"
              stroke="#60B2F0"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            {/* Assessment paper */}
            <rect
              x="65"
              y="50"
              width="70"
              height="60"
              rx="2"
              fill="white"
              stroke="#3E5B93"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            {/* Question 1 */}
            <rect
              x="70"
              y="60"
              width="60"
              height="5"
              rx="2"
              fill="#3E5B93"
              fillOpacity="0.2"
            />
            {/* Options */}
            <circle cx="75" cy="75" r="3" fill="#8FB02C" fillOpacity="0.5" />
            <rect
              x="80"
              y="73"
              width="40"
              height="4"
              rx="2"
              fill="#3E5B93"
              fillOpacity="0.1"
            />
            
            <circle cx="75" cy="85" r="3" fill="#8FB02C" fillOpacity="0.5" />
            <rect
              x="80"
              y="83"
              width="40"
              height="4"
              rx="2"
              fill="#3E5B93"
              fillOpacity="0.1"
            />
            
            <circle cx="75" cy="95" r="3" fill="#8FB02C" fillOpacity="0.5" />
            <rect
              x="80"
              y="93"
              width="40"
              height="4"
              rx="2"
              fill="#3E5B93"
              fillOpacity="0.1"
            />
            
            {/* Checkmark */}
            <path
              d="M130 40L140 50L125 65"
              stroke="#8FB02C"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center pb-10 px-4 bg-white rounded-lg">
      {/* Illustration */}
      <div>{renderIllustration()}</div>

      {/* Title and Description */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-600 max-w-lg mx-auto">{description}</p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="primary"
          className="flex items-center justify-center gap-2"
        >
          <FaPlus /> 
        </Button>
      </div>
    </div>
  );
};

export default InstructorTableEmptyState;
