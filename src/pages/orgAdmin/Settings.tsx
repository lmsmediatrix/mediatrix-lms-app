import { FaBuilding } from "react-icons/fa";
import { useSearchParams } from "react-router-dom";
import OrganizationTab from "../../components/orgAdmin/OrganizationTab";

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTab = searchParams.get("tab") || "organization"; // Default to 'organization' if no tab is specified

  const tabs = [
    { id: "organization", label: "Organization Settings", icon: FaBuilding },
  ];

  const handleTabClick = (tabId: string) => {
    setSearchParams({ tab: tabId });
  };

  const renderTabContent = (tabId: string) => {
    if (tabId === "organization") {
      return <OrganizationTab />;
    }

    return null;
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="w-64 p-4 bg-white shadow">
        <h2 className="text-2xl font-semibold mb-4 px-2">Settings</h2>
        <nav className="space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`w-full text-left px-4 py-2 rounded-md flex items-center text-gray-700 ${
                selectedTab === tab.id
                  ? "bg-blue-100 text-blue-700 font-semibold"
                  : "hover:bg-gray-100"
              }`}
            >
              <tab.icon className="mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="flex-1 p-8 bg-white rounded shadow">
        {renderTabContent(selectedTab)}
      </div>
    </div>
  );
}
