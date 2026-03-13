const SplashScreen = () => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-100/80 backdrop-blur-sm z-50">
      {/* Logo */}
      <img
        src="https://res.cloudinary.com/dyal0wstg/image/upload/v1751936802/alma_new_circle_idxrmk.png"
        alt="Logo"
        className="h-32 w-auto animate-pulse rounded-full"
      />
      {/* Initializing Text */}
      <span className="text-gray-600 font-semibold animate-pulse pt-2">
        Initializing...
      </span>
    </div>
  );
};

export default SplashScreen;
