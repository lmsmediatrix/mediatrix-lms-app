import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";

interface DashboardHeaderProps {
  subTitle?: React.ReactNode;
  statCard?: React.ReactNode;
  children?: React.ReactNode;
  coverPhoto?: string;
  noGreetings?: boolean;
}

export default function DashboardHeader({
  subTitle,
  statCard,
  children,
  coverPhoto,
  noGreetings = false,
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
      className={`relative px-4 md:px-6 lg:px-10 overflow-hidden ${
        coverPhoto ? "" : "text-white"
      }`}
      style={backgroundStyles}
    >
      {!coverPhoto && (
        <>
          {/* Main gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-800 via-indigo-700 to-violet-700" />

          {/* Animated floating orbs */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-400/10 blur-3xl"
          />
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
            className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-gradient-to-tr from-violet-400/20 to-fuchsia-400/10 blur-3xl"
          />
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.4, delay: 0.4, ease: "easeOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-40 w-80 rounded-full bg-white/5 blur-3xl"
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

      <div className="max-w-7xl mx-auto py-9 relative z-10">
        {/* Date - animated slide in from right */}
        <motion.p
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-end text-white/80 mb-4 absolute right-0 top-0 hidden md:block pt-4 text-sm font-light tracking-wide"
        >
          {currentDate}
        </motion.p>

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
