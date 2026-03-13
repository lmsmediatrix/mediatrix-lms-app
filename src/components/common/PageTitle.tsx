import React from "react";
import { useTitle } from "../../context/TitleContext";

interface PageTitleProps {
  className?: string;
  title?: string;
  showTitle?: boolean;
}

/**
 * Component to display the current page title
 * Can be used in any page to show a consistent title
 */
const PageTitle: React.FC<PageTitleProps> = ({
  className = "",
  title: customTitle,
  showTitle = true,
}) => {
  const { title: contextTitle, setTitle } = useTitle();

  // If a custom title is provided, update the document title
  React.useEffect(() => {
    if (customTitle) {
      setTitle(customTitle);
    }
  }, [customTitle, setTitle]);

  if (!showTitle) return null;

  return (
    <h1 className={`text-2xl md:text-3xl font-bold mb-6 ${className}`}>
      {customTitle || contextTitle}
    </h1>
  );
};

export default PageTitle;
