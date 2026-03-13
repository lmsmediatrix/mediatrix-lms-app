import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  firstname: z.string().min(2, "First name must be at least 2 characters"),
  lastname: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

const Register = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [success, setSuccess] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    let timer: any; // TODO: fix this dont use any
    if (success) {
      timer = setTimeout(() => {
        navigate("/login");
      }, 5000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [success, navigate]);

  const onSubmit = async (data: RegisterFormData) => {
    if (isRegistering) return;

    try {
      setIsRegistering(true);
      await registerUser(data);
      // If we get here, registration was successful
      setSuccess(true);
    } catch (err: any) {
      setError("root", {
        message:
          err.response?.data?.message ||
          "Registration failed. Please try again.",
      });
      setSuccess(false); // Ensure success is false on error
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="fixed inset-0 min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        {success ? (
          <div className="text-center">
            <svg
              className="mx-auto h-16 w-16 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h1 className="mt-4 text-2xl font-bold text-gray-900">
              Account Created Successfully!
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Redirecting to login page...
            </p>
          </div>
        ) : (
          <>
            <div className="mb-10">
              <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
                Create your account
              </h2>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-6"
            >
              {errors.root && (
                <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600 font-medium">
                    {errors.root.message}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="username"
                  className="text-sm font-medium text-gray-700"
                >
                  Username
                </label>
                <div className="relative">
                  <input
                    id="username"
                    type="text"
                    {...register("username")}
                    disabled={isSubmitting}
                    className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900 text-sm transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="johndoe"
                  />
                  {errors.username && (
                    <p className="mt-1.5 text-sm text-red-600 font-medium">
                      {errors.username.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="firstname"
                    className="text-sm font-medium text-gray-700"
                  >
                    First name
                  </label>
                  <div className="relative">
                    <input
                      id="firstname"
                      type="text"
                      {...register("firstname")}
                      disabled={isSubmitting}
                      className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900 text-sm transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="John"
                    />
                    {errors.firstname && (
                      <p className="mt-1.5 text-sm text-red-600 font-medium">
                        {errors.firstname.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="lastname"
                    className="text-sm font-medium text-gray-700"
                  >
                    Last name
                  </label>
                  <div className="relative">
                    <input
                      id="lastname"
                      type="text"
                      {...register("lastname")}
                      disabled={isSubmitting}
                      className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900 text-sm transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="Doe"
                    />
                    {errors.lastname && (
                      <p className="mt-1.5 text-sm text-red-600 font-medium">
                        {errors.lastname.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700"
                >
                  Email address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="text"
                    {...register("email")}
                    disabled={isSubmitting}
                    className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900 text-sm transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="you@example.com"
                  />
                  {errors.email && (
                    <p className="mt-1.5 text-sm text-red-600 font-medium">
                      {errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type="password"
                    {...register("password")}
                    disabled={isSubmitting}
                    className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900 text-sm transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="••••••••"
                  />
                  {errors.password && (
                    <p className="mt-1.5 text-sm text-red-600 font-medium">
                      {errors.password.message}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 w-full flex justify-center py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Creating account...
                  </span>
                ) : (
                  "Create account"
                )}
              </button>

              <p className="mt-4 text-center text-sm text-gray-600">
                Already have an account?{" "}
                <a
                  href="/login"
                  className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                >
                  Sign in
                </a>
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Register;
