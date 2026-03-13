import React from "react";

const EmptyStudentsState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 bg-white rounded-lg">
      {/* Illustration */}
      <div className="mb-6">
        <svg
          width="200"
          height="160"
          viewBox="0 0 200 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background */}
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
          
          {/* Student 1 */}
          <circle cx="70" cy="60" r="15" fill="#60B2F0" fillOpacity="0.3" />
          <circle cx="70" cy="55" r="6" fill="#3E5B93" fillOpacity="0.3" />
          <rect
            x="62"
            y="62"
            width="16"
            height="12"
            rx="6"
            fill="#3E5B93"
            fillOpacity="0.3"
          />
          
          {/* Student 2 */}
          <circle cx="100" cy="60" r="15" fill="#60B2F0" fillOpacity="0.3" />
          <circle cx="100" cy="55" r="6" fill="#3E5B93" fillOpacity="0.3" />
          <rect
            x="92"
            y="62"
            width="16"
            height="12"
            rx="6"
            fill="#3E5B93"
            fillOpacity="0.3"
          />
          
          {/* Student 3 */}
          <circle cx="130" cy="60" r="15" fill="#60B2F0" fillOpacity="0.3" />
          <circle cx="130" cy="55" r="6" fill="#3E5B93" fillOpacity="0.3" />
          <rect
            x="122"
            y="62"
            width="16"
            height="12"
            rx="6"
            fill="#3E5B93"
            fillOpacity="0.3"
          />
          
          {/* Student list lines */}
          <rect
            x="60"
            y="90"
            width="80"
            height="5"
            rx="2"
            fill="#3E5B93"
            fillOpacity="0.2"
          />
          <rect
            x="60"
            y="100"
            width="80"
            height="5"
            rx="2"
            fill="#3E5B93"
            fillOpacity="0.2"
          />
          <rect
            x="60"
            y="110"
            width="80"
            height="5"
            rx="2"
            fill="#3E5B93"
            fillOpacity="0.2"
          />
        </svg>
      </div>

      {/* Title and Description */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">No Students Enrolled</h3>
        <p className="text-gray-600 max-w-lg mx-auto">
          There are no students enrolled in this section yet.
        </p>
      </div>
    </div>
  );
};

export default EmptyStudentsState;
