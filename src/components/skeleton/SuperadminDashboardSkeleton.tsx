import { FaPlus } from "react-icons/fa";
import Button from "../common/Button";
import DashboardHeader from "../common/DashboardHeader";
import StatCard from "../common/StatCard";
import CardSkeleton from "./CardSkeleton";

export default function SuperadminDashboardSkeleton() {

  return (
    <div>
      <DashboardHeader
        subTitle={
          <Button
            className="bg-[#60B2F0] w-fit justify-center text-white hover:bg-white hover:text-[#60B2F0] transition-all duration-300 hidden md:flex mt-4"
          >
            <FaPlus /> Create New Organization
          </Button>
        }
        statCard={
          <div className="flex gap-4">
            <StatCard label="" value={0} icon="courses" loading={true} />
          </div>
        }
      />

      {/* Organizations */}
      <div className=" py-14 px-6">
        <div className="flex justify-between items-center mb-4">
          <div className="h-7 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
