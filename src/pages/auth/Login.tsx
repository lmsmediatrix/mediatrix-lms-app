import { useAuth } from "../../context/AuthContext";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "../../components/common/Button";
import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { motion } from "framer-motion";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

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
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-[420px]"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        <h2 className="mb-1 text-3xl font-bold text-gray-900">Welcome back</h2>
        <p className="mb-8 text-gray-500">Sign in to your ALMA account to continue</p>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        {errors.root && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="rounded-xl border border-red-200 bg-red-50 p-4"
          >
            <p className="text-sm font-medium text-red-600">{errors.root.message}</p>
          </motion.div>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-semibold text-gray-700">
            Email address
          </label>
          <div className="relative group">
            <input
              id="email"
              type="text"
              {...register("email")}
              disabled={isSubmitting}
              className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-all duration-200 hover:border-gray-300 focus:border-[#3E5B93] focus:ring-2 focus:ring-[#3E5B93]/20 disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="you@example.com"
            />
          </div>
          {errors.email && <p className="text-sm font-medium text-red-600">{errors.email.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-semibold text-gray-700">
            Password
          </label>
          <div className="relative group">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              {...register("password")}
              disabled={isSubmitting}
              className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-all duration-200 hover:border-gray-300 focus:border-[#3E5B93] focus:ring-2 focus:ring-[#3E5B93]/20 disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="Enter your password"
            />
            <button
              type="button"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
              onClick={() => setShowPassword((previous) => !previous)}
            >
              {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
            </button>
          </div>
          {errors.password && <p className="text-sm font-medium text-red-600">{errors.password.message}</p>}
        </div>

        <motion.div whileTap={{ scale: 0.985 }} className="pt-1">
          <Button
            type="submit"
            isLoading={isSubmitting}
            isLoadingText="Signing in..."
            className="w-full rounded-xl bg-[#3E5B93] py-3 font-semibold text-white shadow-lg shadow-[#3E5B93]/25 transition-all duration-300 hover:bg-[#344e80] hover:shadow-xl hover:shadow-[#3E5B93]/30"
          >
            Sign in
          </Button>
        </motion.div>
      </form>

      <p className="mt-10 text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} ALMA. All rights reserved.
      </p>
    </motion.div>
  );
};

export default Login;
