import { useState, useEffect } from "react";

interface AssessmentTimerProps {
  hasStarted: boolean;
  timeLimit?: number;
  onTimeUp: () => void;
  onAssessmentSubmitted?: () => void; // Callback when assessment is submitted
}

// Cookie utility functions
const setCookie = (name: string, value: string, minutes: number = 30) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + minutes * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
};

const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

const deleteCookie = (name: string) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

export default function AssessmentTimer({
  hasStarted,
  timeLimit,
  onTimeUp,
}: AssessmentTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // Function to clear assessment cookies
  const clearAssessmentCookies = () => {
    deleteCookie("assessment_time_remaining");
    deleteCookie("assessment_start_time");
  };

  // Function to start timer automatically when page loads
  const startTimerOnPageLoad = () => {
    if (hasStarted && timeLimit && timeRemaining === null) {
      // Check if there's a saved time in cookies
      const savedTime = getCookie("assessment_time_remaining");
      const savedStartTime = getCookie("assessment_start_time");

      if (savedTime && savedStartTime) {
        // Calculate elapsed time since start
        const startTime = parseInt(savedStartTime);
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        const remainingFromSaved = parseInt(savedTime) - elapsedSeconds;

        if (remainingFromSaved > 0) {
          setTimeRemaining(remainingFromSaved);
        } else {
          // Time has expired, clean up cookies and trigger onTimeUp
          clearAssessmentCookies();
          onTimeUp();
        }
      } else {
        // No saved time, start fresh
        const totalSeconds = timeLimit * 60;
        setTimeRemaining(totalSeconds);
        // Set cookies to expire exactly when timer reaches zero
        const expirationMinutes = timeLimit || 30;
        setCookie(
          "assessment_time_remaining",
          totalSeconds.toString(),
          expirationMinutes
        );
        setCookie(
          "assessment_start_time",
          Date.now().toString(),
          expirationMinutes
        );
      }
    }
  };

  // Start timer when page loads
  useEffect(() => {
    startTimerOnPageLoad();
  }, [hasStarted, timeLimit]);

  // Expose clear function for manual cookie cleanup
  useEffect(() => {
    (window as any).clearAssessmentTimer = () => {
      deleteCookie("assessment_time_remaining");
      deleteCookie("assessment_start_time");
      console.log("Assessment timer cookies cleared");
    };

    return () => {
      delete (window as any).clearAssessmentTimer;
    };
  }, []);

  // Check for cookie expiration on page load/focus
  useEffect(() => {
    const checkCookieExpiration = () => {
      if (hasStarted && timeLimit) {
        const savedTime = getCookie("assessment_time_remaining");
        const savedStartTime = getCookie("assessment_start_time");

        if (!savedTime || !savedStartTime) {
          // Cookies have expired, auto-submit
          clearAssessmentCookies();
          onTimeUp();
        }
      }
    };

    // Check on page load
    checkCookieExpiration();

    // Check when page regains focus (user returns to tab)
    window.addEventListener("focus", checkCookieExpiration);

    return () => {
      window.removeEventListener("focus", checkCookieExpiration);
    };
  }, [hasStarted, timeLimit, onTimeUp]);

  useEffect(() => {
    if (!hasStarted || timeRemaining === null || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev && prev > 1) {
          const newTime = prev - 1;
          // Update cookie with new remaining time and set expiration to match remaining time
          const remainingMinutes = newTime / 60;
          setCookie(
            "assessment_time_remaining",
            newTime.toString(),
            remainingMinutes
          );
          return newTime;
        } else {
          // Time is up, clean up cookies
          clearAssessmentCookies();
          onTimeUp();
          return 0;
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasStarted, timeRemaining, onTimeUp]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  if (!hasStarted || timeRemaining === null) return null;

  return (
    <div className="fixed top-4 right-4 bg-white rounded-lg shadow-md p-4 border-l-4 border-primary z-50">
      <span className="text-gray-800 font-semibold">
        Time Remaining: {formatTime(timeRemaining)}
      </span>
    </div>
  );
}
