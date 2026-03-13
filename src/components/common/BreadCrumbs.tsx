import { Link, useLocation } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";
import { useAuth } from "../../context/AuthContext";

interface BreadCrumb {
  name?: string;
  path?: string;
  nameIndex?: number;
  pathIndex?: number;
}

interface BreadCrumbsProps {
  items: BreadCrumb[];
}

export default function BreadCrumbs({ items }: BreadCrumbsProps) {
  const { currentUser } = useAuth();
  const code = currentUser?.user.organization.code;
  const location = useLocation();

  const pathSegments = location.pathname.split("/").filter(Boolean);

  const resolveBreadcrumb = (item: BreadCrumb): { name: string; path: string } => {
    const baseUrl = `${window.location.protocol}//${window.location.host}`;

    if (item.name && item.path) {
      return {
        name: item.name,
        path: item.path,
      };
    }

    const name = item.nameIndex !== undefined ? pathSegments[item.nameIndex] : item.name || "";
    let resolvedPath = "";
    if (item.pathIndex !== undefined) {
      resolvedPath = `/${pathSegments.slice(0, item.pathIndex + 1).join("/")}`; // No trailing "/"
    } else {
      resolvedPath = item.path || "";
    }

    return {
      name,
      path: resolvedPath ? `${baseUrl}${resolvedPath}` : resolvedPath,
    };
  };

  const breadcrumbItems = items.map(resolveBreadcrumb);

  return (
    <nav className="flex gap-4 mb-4">
      {breadcrumbItems.map((item, index) => (
        <Link
          key={index}
          to={item.path.replace("/:orgCode", `/${code}`)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors w-fit"
        >
          <IoArrowBack className="text-lg" />
          <span>{item.name}</span>
        </Link>
      ))}
    </nav>
  );
}