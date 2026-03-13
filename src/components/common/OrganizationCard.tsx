import { FaClock } from "react-icons/fa";
import { SiGoogleclassroom } from "react-icons/si";
import { MdImage } from "react-icons/md";
import { OrgCardProps } from "../../types/interfaces";
import { formatDate } from "../../lib/dateUtils";
import { GoOrganization } from "react-icons/go";


export default function OrgCard({ name, code, type, lastUpdated, imageUrl, onClick }: OrgCardProps) {
  const hasContent = !!lastUpdated;

  return (
    <div
      className={`flex flex-col w-full bg-white rounded-lg border-2 ${
        hasContent ? "shadow-md hover:shadow-lg" : "border-dashed border-gray-300"
      } cursor-pointer`}
      onClick={onClick}
    >
      {hasContent ? (
        <>
          {/* Image section */}
          <div className="h-[200px] w-full overflow-hidden rounded-t-lg">
            {imageUrl ? (
              <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <MdImage className="text-gray-400 w-16 h-16" />
              </div>
            )}
          </div>

          {/* Content section */}
          <div className="flex flex-col p-4 min-h-[150px]">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 line-clamp-2" title={name}>
              {name}
            </h3>
            <div>
              <div className="flex items-center gap-2 mb-2 text-sm">
                <SiGoogleclassroom className="text-primary" />
                <span className="text-gray-500">Code: </span>
                <span className="text-gray-700 font-bold">{code}</span>
              </div>
              <div className="flex items-center gap-2 mb-2 text-sm">
                <GoOrganization className="text-secondary" />
                <span className="text-gray-500">Type: </span>
                <span className="text-gray-700 font-bold capitalize">{type}</span>
              </div>
              {lastUpdated && (
                <div className="flex items-center gap-2 text-sm">
                  <FaClock className="text-accent" />
                  <span className="text-gray-500">Last Updated: </span>
                  <span className="text-gray-700 font-bold">{formatDate(lastUpdated)}</span>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col h-[200px] items-center justify-center text-gray-500">
          <SiGoogleclassroom className="text-3xl mb-2 text-gray-400" />
          <p className="text-center">No section to show</p>
        </div>
      )}
    </div>
  );
}