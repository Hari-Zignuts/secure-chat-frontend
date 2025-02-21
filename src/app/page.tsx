"use client";
import { useToast } from "@/contexts/ToastContext";
import { removeToken } from "@/utils/tokenStorage";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const Home = () => {
  const router = useRouter();
  const { setToast, showToast, getToast } = useToast();
  useEffect(() => {
    if (getToast() !== null) {
      showToast();
    }
  }, [showToast, getToast]);

  const handleLogout = () => {
    router.replace("/auth/login");
    setToast("Logout successful.");
    removeToken();
  };

  const handleChat = () => {
    router.push("/chat");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Home Page</h1>
        <p className="text-gray-600 mb-6 text-center">This is the home page</p>
        <div className="flex flex-col space-y-4">
          <button
            onClick={handleChat}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300"
          >
            Go to Chat
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-300"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
