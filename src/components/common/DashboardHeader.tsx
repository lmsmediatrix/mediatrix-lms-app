import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";

interface DashboardHeaderProps {
  subTitle?: React.ReactNode;
  statCard?: React.ReactNode;
  children?: React.ReactNode;
  coverPhoto?: string;
  noGreetings?: boolean;
  dateFilter?: React.ReactNode;
}

export default function DashboardHeader({
  subTitle,
  statCard,
  children,
  coverPhoto,
  noGreetings = false,
  dateFilter,
}: DashboardHeaderProps) {
  const { currentUser } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update currentTime every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Memoize the formatted date
  const currentDate = useMemo(
    () =>
      currentTime.toLocaleString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    [currentTime],
  );

  // Extract user name
  const userFirstName = currentUser?.user.firstname;
  const userLastName = currentUser?.user.lastname;
  const fullName =
    userFirstName && userLastName ? `${userFirstName} ${userLastName}` : "User";
  const isCorporateOrg = currentUser?.user?.organization?.type === "corporate";
  const shouldUseGlassOverlay = Boolean(coverPhoto && isCorporateOrg);
  const organizationPrimaryColor =
    currentUser?.user?.organization?.branding?.colors?.primary ||
    "var(--color-primary, #3e5b93)";
  const organizationSecondaryColor =
    currentUser?.user?.organization?.branding?.colors?.secondary ||
    "var(--color-secondary, #228ab9)";

  // Define background styles
  const backgroundStyles = coverPhoto
    ? {
        backgroundImage: `linear-gradient(to top, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.4)), url(${coverPhoto})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {};

  // Get greeting based on time of day
  const greeting = useMemo(() => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, [currentTime]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative px-4 md:px-6 lg:px-10 overflow-hidden text-white"
      style={backgroundStyles}
    >
      {!coverPhoto && (
        <>
          {/* Solid primary base */}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "var(--color-primary, #1e3a8a)" }}
          />

          {/* Left pulse orb — white opacity glow */}
          <motion.div
            className="absolute -left-16 top-1/2 -translate-y-1/2 h-56 w-56 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(255,255,255,0.35) 0%, transparent 70%)" }}
            animate={{ scale: [1, 1.25, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Right pulse orb — white opacity glow, opposite phase */}
          <motion.div
            className="absolute -right-16 top-1/2 -translate-y-1/2 h-56 w-56 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(255,255,255,0.35) 0%, transparent 70%)" }}
            animate={{ scale: [1.2, 1, 1.2], opacity: [1, 0.5, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Center large slow pulse — subtler white glow */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-96 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 65%)" }}
            animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0.85, 0.4] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />

          {/* Subtle mesh pattern overlay */}
          <div className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.4)_1px,transparent_0)] [background-size:24px_24px]" />

          {/* Top shimmer line */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            transition={{ duration: 2, delay: 0.5, ease: "easeInOut" }}
            className="absolute top-0 left-0 h-[1px] w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent"
          />
        </>
      )}
      {shouldUseGlassOverlay && (
        <>
          {/* Corporate cover photo glass overlay for better text/card readability */}
          <div
            className="absolute inset-0 backdrop-blur-[2px]"
            style={{
              background:
                "linear-gradient(115deg, " +
                `color-mix(in srgb, ${organizationPrimaryColor} 48%, transparent) 0%, ` +
                `color-mix(in srgb, ${organizationPrimaryColor} 30%, transparent) 35%, ` +
                `color-mix(in srgb, ${organizationSecondaryColor} 38%, transparent) 100%)`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/35" />
          <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(115deg,rgba(255,255,255,0.4)_0%,transparent_35%,transparent_65%,rgba(255,255,255,0.35)_100%)]" />
        </>
      )}

      <div className="max-w-7xl mx-auto py-9 relative z-10">
        {/* Date / date filter - top right of banner */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="absolute right-0 top-0 hidden md:flex items-center pt-4"
        >
          {dateFilter ?? (
            <p className="text-white/80 text-sm font-light tracking-wide">
              {currentDate}
            </p>
          )}
        </motion.div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
          <div className="flex flex-col justify-center mb-4 lg:mb-0">
            {!noGreetings && (
              <>
                {/* Greeting label */}
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="text-xs md:text-sm font-medium text-white/60 uppercase tracking-widest mb-1"
                >
                  {greeting}
                </motion.span>

                {/* Main welcome heading */}
                <motion.h1
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-white tracking-tight"
                >
                  Welcome back,{" "}
                  <span className="bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">
                    {fullName}
                  </span>
                  !
                </motion.h1>
              </>
            )}
            {subTitle && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.35 }}
              >
                {subTitle}
              </motion.div>
            )}
          </div>

          {/* Stat cards - animated stagger from right */}
          {statCard && (
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
            >
              {statCard}
            </motion.div>
          )}
        </div>

        {/* Children with fade-in */}
        {children && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            {children}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
