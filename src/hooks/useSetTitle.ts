import { useEffect } from "react";
import { useTitle } from "../context/TitleContext";

/**
 * A simple hook to set the page title from any component
 * @param title The title to set
 */
export const useSetTitle = (title: string) => {
  const { setTitle } = useTitle();

  useEffect(() => {
    if (title) {
      setTitle(title);
    }
  }, [title, setTitle]);
};
