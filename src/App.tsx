import { useRoutes } from "react-router-dom";
import { appRoutes } from "./config/route";
import { AuthProvider } from "./context/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { TitleProvider } from "./context/TitleContext";
import ScrollToTop from "./pages/common/ScrollToTop";

const Routes = () => {
  return useRoutes(appRoutes);
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
    mutations: {},
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TitleProvider>
          <ScrollToTop />
          <Routes />
          <ToastContainer pauseOnHover={false} stacked />
        </TitleProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
