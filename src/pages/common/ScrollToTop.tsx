import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    const mainContent = document.getElementById("admin-main-content");
    if (mainContent) {
      mainContent.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }

    const nestedScrollableContent = document.querySelector(
      ".admin-content-compact",
    ) as HTMLElement | null;
    if (nestedScrollableContent) {
      nestedScrollableContent.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [pathname]);

  return null;
}

export default ScrollToTop;