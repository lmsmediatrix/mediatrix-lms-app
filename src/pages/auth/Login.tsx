import { useAuth } from "../../context/AuthContext";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import Button from "../../components/common/Button";
import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { motion } from "framer-motion";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

/* ── Animated SVG illustrations ────────────────────────────── */

const FloatingBook = ({
  delay = 0,
  x = 0,
  y = 0,
}: {
  delay?: number;
  x?: number;
  y?: number;
}) => (
  <motion.svg
    viewBox="0 0 80 80"
    className="absolute w-16 h-16 md:w-20 md:h-20"
    style={{ left: `${x}%`, top: `${y}%` }}
    animate={{ y: [0, -12, 0], rotate: [0, 3, -3, 0] }}
    transition={{ duration: 4, repeat: Infinity, delay, ease: "easeInOut" }}
  >
    <rect
      x="15"
      y="18"
      width="50"
      height="44"
      rx="3"
      fill="white"
      fillOpacity="0.15"
    />
    <rect
      x="18"
      y="22"
      width="44"
      height="36"
      rx="2"
      fill="white"
      fillOpacity="0.1"
    />
    <line
      x1="40"
      y1="22"
      x2="40"
      y2="58"
      stroke="white"
      strokeOpacity="0.3"
      strokeWidth="1"
    />
    <path
      d="M18 28 Q29 24 40 28"
      fill="none"
      stroke="white"
      strokeOpacity="0.4"
      strokeWidth="1.5"
    />
    <path
      d="M40 28 Q51 24 62 28"
      fill="none"
      stroke="white"
      strokeOpacity="0.4"
      strokeWidth="1.5"
    />
  </motion.svg>
);

const FloatingGrad = ({
  delay = 0,
  x = 0,
  y = 0,
}: {
  delay?: number;
  x?: number;
  y?: number;
}) => (
  <motion.svg
    viewBox="0 0 80 80"
    className="absolute w-14 h-14 md:w-16 md:h-16"
    style={{ left: `${x}%`, top: `${y}%` }}
    animate={{ y: [0, -10, 0], rotate: [0, -5, 5, 0] }}
    transition={{ duration: 5, repeat: Infinity, delay, ease: "easeInOut" }}
  >
    <polygon points="40,10 18,30 62,30" fill="white" fillOpacity="0.2" />
    <rect
      x="22"
      y="30"
      width="36"
      height="4"
      rx="1"
      fill="white"
      fillOpacity="0.15"
    />
    <line
      x1="40"
      y1="34"
      x2="40"
      y2="50"
      stroke="white"
      strokeOpacity="0.25"
      strokeWidth="2"
    />
    <circle cx="40" cy="53" r="4" fill="white" fillOpacity="0.2" />
  </motion.svg>
);

const FloatingAtom = ({
  delay = 0,
  x = 0,
  y = 0,
}: {
  delay?: number;
  x?: number;
  y?: number;
}) => (
  <motion.svg
    viewBox="0 0 80 80"
    className="absolute w-12 h-12 md:w-16 md:h-16"
    style={{ left: `${x}%`, top: `${y}%` }}
    animate={{ y: [0, -8, 0], scale: [1, 1.05, 1] }}
    transition={{ duration: 3.5, repeat: Infinity, delay, ease: "easeInOut" }}
  >
    <circle cx="40" cy="40" r="4" fill="white" fillOpacity="0.35" />
    <ellipse
      cx="40"
      cy="40"
      rx="22"
      ry="8"
      fill="none"
      stroke="white"
      strokeOpacity="0.2"
      strokeWidth="1.2"
    />
    <ellipse
      cx="40"
      cy="40"
      rx="22"
      ry="8"
      fill="none"
      stroke="white"
      strokeOpacity="0.2"
      strokeWidth="1.2"
      transform="rotate(60 40 40)"
    />
    <ellipse
      cx="40"
      cy="40"
      rx="22"
      ry="8"
      fill="none"
      stroke="white"
      strokeOpacity="0.2"
      strokeWidth="1.2"
      transform="rotate(120 40 40)"
    />
  </motion.svg>
);

const FloatingLaptop = ({
  delay = 0,
  x = 0,
  y = 0,
}: {
  delay?: number;
  x?: number;
  y?: number;
}) => (
  <motion.svg
    viewBox="0 0 90 70"
    className="absolute w-20 h-16 md:w-24 md:h-20"
    style={{ left: `${x}%`, top: `${y}%` }}
    animate={{ y: [0, -10, 0], rotate: [-2, 2, -2] }}
    transition={{ duration: 4.5, repeat: Infinity, delay, ease: "easeInOut" }}
  >
    <rect
      x="18"
      y="10"
      width="54"
      height="36"
      rx="3"
      fill="white"
      fillOpacity="0.12"
      stroke="white"
      strokeOpacity="0.25"
      strokeWidth="1.5"
    />
    <rect
      x="22"
      y="14"
      width="46"
      height="28"
      rx="1"
      fill="white"
      fillOpacity="0.08"
    />
    <line
      x1="30"
      y1="22"
      x2="50"
      y2="22"
      stroke="white"
      strokeOpacity="0.3"
      strokeWidth="1.5"
    />
    <line
      x1="30"
      y1="28"
      x2="58"
      y2="28"
      stroke="white"
      strokeOpacity="0.2"
      strokeWidth="1.5"
    />
    <line
      x1="30"
      y1="34"
      x2="44"
      y2="34"
      stroke="white"
      strokeOpacity="0.2"
      strokeWidth="1.5"
    />
    <path d="M12 50 L78 50 L82 56 L8 56 Z" fill="white" fillOpacity="0.15" />
  </motion.svg>
);

const FloatingPencil = ({
  delay = 0,
  x = 0,
  y = 0,
}: {
  delay?: number;
  x?: number;
  y?: number;
}) => (
  <motion.svg
    viewBox="0 0 60 60"
    className="absolute w-10 h-10 md:w-14 md:h-14"
    style={{ left: `${x}%`, top: `${y}%` }}
    animate={{ y: [0, -6, 0], rotate: [15, 25, 15] }}
    transition={{ duration: 3, repeat: Infinity, delay, ease: "easeInOut" }}
  >
    <rect
      x="24"
      y="8"
      width="10"
      height="38"
      rx="1"
      fill="white"
      fillOpacity="0.2"
      transform="rotate(15 29 27)"
    />
    <polygon
      points="24,46 29,54 34,46"
      fill="white"
      fillOpacity="0.3"
      transform="rotate(15 29 50)"
    />
  </motion.svg>
);

/* ── Orbiting particles ──────────────────────────────────── */

const OrbitRing = ({
  size,
  duration,
  opacity,
}: {
  size: number;
  duration: number;
  opacity: number;
}) => (
  <motion.div
    className="absolute rounded-full border"
    style={{
      width: size,
      height: size,
      left: "50%",
      top: "50%",
      marginLeft: -size / 2,
      marginTop: -size / 2,
      borderColor: `rgba(255,255,255,${opacity})`,
    }}
    animate={{ rotate: 360 }}
    transition={{ duration, repeat: Infinity, ease: "linear" }}
  >
    <div
      className="absolute w-2 h-2 md:w-3 md:h-3 rounded-full bg-white"
      style={{ opacity: opacity * 3, top: -4, left: "50%", marginLeft: -4 }}
    />
  </motion.div>
);

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const { login } = useAuth();

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
    } catch (err: any) {
      setError("root", {
        message:
          err.data.error.message ||
          err.message ||
          "Login failed. Please check your credentials.",
      });
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row">
      {/* ── Left Panel: Animated Illustration ───────────────── */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-gradient-to-br from-[#2d4373] via-[#3E5B93] to-[#5a7bbf]">
        {/* Gradient mesh overlay */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(circle at 20% 80%, rgba(99,149,255,0.4) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(139,92,246,0.3) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(59,130,246,0.2) 0%, transparent 70%)",
          }}
        />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Orbit rings */}
        <OrbitRing size={300} duration={20} opacity={0.06} />
        <OrbitRing size={450} duration={30} opacity={0.04} />
        <OrbitRing size={600} duration={40} opacity={0.03} />

        {/* Floating SVG elements */}
        <FloatingBook delay={0} x={15} y={18} />
        <FloatingGrad delay={0.5} x={65} y={12} />
        <FloatingAtom delay={1} x={70} y={60} />
        <FloatingLaptop delay={1.5} x={12} y={55} />
        <FloatingPencil delay={0.8} x={50} y={75} />
        <FloatingBook delay={2} x={42} y={8} />
        <FloatingAtom delay={1.2} x={25} y={78} />
        <FloatingGrad delay={0.3} x={80} y={40} />

        {/* Floating orbs */}
        {[
          { w: 64, x: 10, y: 30, dur: 6, del: 0 },
          { w: 40, x: 75, y: 75, dur: 5, del: 1 },
          { w: 48, x: 55, y: 25, dur: 7, del: 2 },
          { w: 32, x: 30, y: 60, dur: 4, del: 0.5 },
          { w: 24, x: 85, y: 15, dur: 5.5, del: 1.5 },
        ].map((orb, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: orb.w,
              height: orb.w,
              left: `${orb.x}%`,
              top: `${orb.y}%`,
              background:
                "radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)",
            }}
            animate={{
              y: [0, -20, 0],
              x: [0, 10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: orb.dur,
              repeat: Infinity,
              delay: orb.del,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Center content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "backOut" }}
            className="mb-8"
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-white/10 blur-xl scale-150" />
              <img
                src="https://res.cloudinary.com/dyal0wstg/image/upload/v1751936802/alma_new_circle_idxrmk.png"
                alt="ALMA"
                className="relative h-28 w-28 rounded-full shadow-2xl ring-4 ring-white/20"
              />
            </div>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-4xl xl:text-5xl font-bold text-white mb-4 text-center leading-tight"
          >
            Alternative Learning
            <br />
            <span className="text-blue-200">Management System</span>
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-blue-100/80 text-center max-w-md text-lg mb-10"
          >
            Empowering education through technology — manage courses, track
            progress, and achieve more.
          </motion.p>

          {/* Feature pills */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="flex flex-wrap justify-center gap-3"
          >
            {[
              "Interactive Courses",
              "Real-time Analytics",
              "Smart Assessments",
            ].map((feat, i) => (
              <motion.span
                key={feat}
                className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white/90 text-sm font-medium border border-white/10"
                whileHover={{
                  scale: 1.05,
                  backgroundColor: "rgba(255,255,255,0.18)",
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + i * 0.15 }}
              >
                {feat}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Right Panel: Login Form ─────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
        {/* Top bar — mobile only */}
        <nav className="flex lg:hidden items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="https://res.cloudinary.com/dyal0wstg/image/upload/v1751945580/alma_nav_2_yobcpv.png"
              alt="Logo"
              className="h-9 w-auto rounded-full"
            />
          </Link>
        </nav>

        {/* Form container */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-[420px]"
          >
            {/* Mobile-only logo */}
            <div className="flex lg:hidden justify-center mb-8">
              <img
                src="https://res.cloudinary.com/dyal0wstg/image/upload/v1751936802/alma_new_circle_idxrmk.png"
                alt="ALMA"
                className="h-20 w-20 rounded-full shadow-lg"
              />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-1">
                Welcome back
              </h2>
              <p className="text-gray-500 mb-8">
                Sign in to your ALMA account to continue
              </p>
            </motion.div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-5"
            >
              {errors.root && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="p-4 rounded-xl bg-red-50 border border-red-200"
                >
                  <p className="text-sm text-red-600 font-medium">
                    {errors.root.message}
                  </p>
                </motion.div>
              )}

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="email"
                  className="text-sm font-semibold text-gray-700"
                >
                  Email address
                </label>
                <div className="relative group">
                  <input
                    id="email"
                    type="text"
                    {...register("email")}
                    disabled={isSubmitting}
                    className="block w-full px-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-[#3E5B93]/20 focus:border-[#3E5B93] text-gray-900 text-sm transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500 hover:border-gray-300"
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600 font-medium">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="password"
                  className="text-sm font-semibold text-gray-700"
                >
                  Password
                </label>
                <div className="relative group">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    disabled={isSubmitting}
                    className="block w-full px-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-[#3E5B93]/20 focus:border-[#3E5B93] text-gray-900 text-sm transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500 hover:border-gray-300"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <FaEyeSlash size={18} />
                    ) : (
                      <FaEye size={18} />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600 font-medium">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <motion.div whileTap={{ scale: 0.985 }} className="pt-1">
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  isLoadingText="Signing in..."
                  className="w-full py-3 bg-[#3E5B93] text-white font-semibold rounded-xl shadow-lg shadow-[#3E5B93]/25 hover:shadow-xl hover:shadow-[#3E5B93]/30 hover:bg-[#344e80] transition-all duration-300"
                >
                  Sign in
                </Button>
              </motion.div>
            </form>

            {/* Footer */}
            <p className="text-center text-xs text-gray-400 mt-10">
              &copy; {new Date().getFullYear()} ALMA. All rights reserved.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;
