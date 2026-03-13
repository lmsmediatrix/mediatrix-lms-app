import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AvatarDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null); // Create a ref to track the dropdown element
  const navigate = useNavigate();
  const { logout, currentUser } = useAuth();
  const { email, firstname, lastname, avatar, organization, role } =
    currentUser.user;

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Effect to handle clicks outside the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !(dropdownRef.current as Node).contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    // Add event listener when dropdown is open
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Cleanup event listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]); // Run effect when isOpen changes

  return (
    <div ref={dropdownRef}>
      {" "}
      {/* Add ref to the container */}
      {avatar ? (
        <img
          src={avatar}
          alt="Profile"
          className="w-8 aspect-square rounded-full cursor-pointer hover:shadow-md object-cover"
          onClick={() => setIsOpen(!isOpen)}
        />
      ) : (
        <div
          className="h-8 aspect-square rounded-full bg-gray-300 flex items-center justify-center cursor-pointer hover:shadow-md"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="text-sm font-medium text-gray-600">
            {`${firstname?.[0]?.toUpperCase()}${lastname?.[0]?.toUpperCase()}`}
          </span>
        </div>
      )}
      {isOpen && (
        <div className="absolute top-12 right-12 bg-white shadow-lg rounded-lg z-10">
          <div className="border-b p-4">
            <h3 className="text-lg font-medium mb-2">
              {firstname} {lastname}
            </h3>
            <p className="text-sm text-gray-600">{email}</p>
          </div>
          <div className="flex flex-col min-w-[200px]">
            {role !== "superadmin" && (
              <button
                onClick={() => {
                  navigate(`/${organization.code}/${role}/profile`);
                  setIsOpen(false); // Optional: close dropdown after navigation
                }}
                className="text-left hover:bg-gray-100 py-2 px-4"
              >
                <p>Profile</p>
              </button>
            )}
            {/* <button
              className="text-left hover:bg-gray-100 py-2 px-4"
              onClick={() => setIsOpen(false)} // Optional: close on click
            >
              <p>Settings</p>
            </button> */}
            <button
              onClick={handleLogout}
              className="text-left hover:bg-gray-100 py-2 px-4"
            >
              <p className="text-red-700">Logout</p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
