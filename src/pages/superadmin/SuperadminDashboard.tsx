import Button from "../../components/common/Button";
import StatCard from "../../components/common/StatCard";
import { FaAngleRight, FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "../../components/common/DashboardHeader";
import { IOrganization } from "../../types/interfaces";
import { useGetAllOrganization } from "../../hooks/useOrganization";
import AdminDashboardSkeleton from "../../components/skeleton/SuperadminDashboardSkeleton";
import { motion, AnimatePresence } from "framer-motion";
import { cardVariants } from "../../lib/animations";
import OrgCard from "../../components/common/OrganizationCard";

export default function SuperadminDashboard() {
  const navigate = useNavigate();
  const { data, isPending } = useGetAllOrganization({ limit: 4 });

  if (isPending) {
    return <AdminDashboardSkeleton />;
  }

  return (
    <div>
      <DashboardHeader
        subTitle={
          <Button
            onClick={() => navigate("/admin/organization/create")}
            className="bg-[#60B2F0] w-fit justify-center text-white hover:bg-white hover:text-[#60B2F0] transition-all duration-300 hidden md:flex mt-4"
          >
            <FaPlus /> Create New Organization
          </Button>
        }
        statCard={
          !isPending && (
            <div className="flex gap-4">
              <StatCard
                label="Universities"
                value={data?.pagination.totalItems}
                icon="courses"
              />
            </div>
          )
        }
      />

      {/* Organizations */}
      <div className="p-6">
        <div className="flex justify-end items-center">
          <Button
            onClick={() => navigate("/admin/organization/create")}
            className="bg-[#60B2F0] w-fit justify-center text-white hover:bg-white hover:text-[#60B2F0] transition-all duration-300 md:hidden"
          >
            <FaPlus /> Create New Organization
          </Button>
        </div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Recent Organizations</h3>
          <Button
            variant="link"
            className="flex items-center gap-2"
            onClick={() => {
              navigate("/admin/organization");
            }}
          >
            View All <FaAngleRight />
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {data.data.length > 0 ? (
            <AnimatePresence>
              {data.data.map((org: IOrganization, index: number) => (
                <motion.div
                  key={org._id}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  custom={index} // Pass index for staggered animation
                >
                  <OrgCard
                    name={org.name}
                    code={org.code}
                    type={org.type}
                    lastUpdated={org.updatedAt}
                    imageUrl={org.branding?.logo || ""}
                    onClick={() => navigate(`/admin/organization/${org.code}`)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="col-span-4 text-center text-gray-500">
              No organizations available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
