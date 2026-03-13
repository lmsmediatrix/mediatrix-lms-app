import { useAuth } from "../context/AuthContext";

export default function Footer() {
  const { currentUser } = useAuth();
  const isSideNav =
    currentUser.user.role === "admin" || currentUser.user.role === "superadmin";
  return (
    <footer
      className={`bg-gray-200 ${
        isSideNav ? "lg:pl-[300px]" : ""
      } *:font-medium w-full px-10 md:py-1 flex items-center justify-center md:justify-between text-[8px] md:text-xs text-[color-mix(in_srgb,var(--color-secondary)_60%,transparent_30%)] `}
    >
      <div>
        Powered By{" "}
        <span className="font-bold ">
          Uzaro Solutions Tech Inc.
        </span>
      </div>
      <div className="gap-4 hidden md:flex">
        <a
          href="/FAQ"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          FAQs
        </a>
        <a
          href="/termsandconditions"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          Terms & Condition
        </a>
        <a
          href="/privacypolicy"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          Privacy Policy
        </a>
      </div>
    </footer>
  );
}
