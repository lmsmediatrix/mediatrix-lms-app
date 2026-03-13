import React from "react";
import { IoClose } from "react-icons/io5";

export interface FlatModalProps {
  children: React.ReactNode;
  onClose: () => void;
}

export default function FlatModal({ children, onClose }: FlatModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="w-[35vw] min-w-[500px] bg-white rounded-xl shadow-xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-full hover:bg-cyan-50 text-cyan-500 hover:text-cyan-600 transition-colors"
        >
          <IoClose size={20} />
        </button>
        {children}
      </div>
    </div>
  );
}
