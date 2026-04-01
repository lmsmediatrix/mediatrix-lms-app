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

const mediatrixTheme = {
  logoLight:
    "https://mediatrixmed.com.ph/wp-content/uploads/2023/08/MMMC_White-Header-2022-1024x165.png",
  wave: "https://mediatrixmed.com.ph/wp-content/uploads/2023/09/MMMC-Wave.png",
};

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
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden text-white">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #011A5D 0%, #01268F 48%, #1C7FC9 100%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-35"
          style={{
            background:
              "radial-gradient(circle at 18% 15%, rgba(1,78,255,0.4) 0%, transparent 43%), radial-gradient(circle at 85% 10%, rgba(234,246,255,0.22) 0%, transparent 32%), radial-gradient(circle at 50% 100%, rgba(255,255,255,0.16) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-56 bg-bottom bg-contain bg-no-repeat opacity-70"
          style={{ backgroundImage: `url(${mediatrixTheme.wave})` }}
        />

        <div
          className="relative z-10 flex h-full flex-col justify-between px-12 py-12 xl:px-16"
          style={{ fontFamily: '"Proxima Nova", "Roboto", "Inter", sans-serif' }}
        >
          <motion.div
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="space-y-6"
          >
            <img
              src={mediatrixTheme.logoLight}
              alt="Mary Mediatrix Medical Center"
              className="h-auto w-[280px] max-w-full"
            />
            <div className="inline-flex items-center rounded-full border border-white/35 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em]">
              Center of Excellence
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.55, ease: "easeOut" }}
            className="max-w-xl"
          >
            <h1 className="text-4xl font-bold leading-tight xl:text-5xl">
              Patient-centered care is at the heart of everything we do.
            </h1>
            <p className="mt-6 max-w-lg text-base text-[#EAF6FF] xl:text-lg">
              Providing Better And Quality Healthcare For All through expert
              care, advanced technology, and efficient processes.
            </p>
          </motion.div>

          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.55, ease: "easeOut" }}
            className="space-y-4"
          >
            <div className="flex flex-wrap gap-2.5 text-sm font-medium">
              <span className="rounded-full bg-[#014EFF]/35 px-3 py-1.5">
                Heart Institute
              </span>
              <span className="rounded-full bg-[#014EFF]/35 px-3 py-1.5">
                Cancer Institute
              </span>
              <span className="rounded-full bg-[#014EFF]/35 px-3 py-1.5">
                Renal & Transplant
              </span>
            </div>
            <p className="text-sm text-[#EAF6FF]/90">
              J.P Laurel Highway, Lipa City, Batangas
            </p>
          </motion.div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
        <nav className="flex lg:hidden items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="https://res.cloudinary.com/dyal0wstg/image/upload/v1751945580/alma_nav_2_yobcpv.png"
              alt="Logo"
              className="h-9 w-auto rounded-full"
            />
          </Link>
        </nav>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-[420px]"
          >
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
