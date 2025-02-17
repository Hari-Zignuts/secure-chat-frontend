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

  return (
    <div>
      <h1>Home Page</h1>
      <p>This is the home page</p>
      <button onClick={handleLogout}>logout</button>
    </div>
  );
};

export default Home;
