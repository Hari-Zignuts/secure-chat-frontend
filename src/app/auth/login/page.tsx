"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./LoginPage.module.css";
import { authService } from "@/services/authService";
import { setToken } from "@/utils/tokenStorage";
import "react-toastify/dist/ReactToastify.css";
import { useToast } from "@/contexts/ToastContext";
import { GoogleLogin } from "@react-oauth/google";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);  
  const router = useRouter();

  const { setToast, showToast, getToast } = useToast();

  useEffect(() => {
    if (getToast() !== null) {
      showToast();
    }
  }, [showToast, getToast]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await authService.auth("login", { email, password });
      if (response?.statusCode === 200) {
        setToken(response.data.token);
        setToast("Login successful.");
        router.replace("/");
      } else {
        setError(response.error);
      }
    } catch (error) {
      setError("An error occurred. Please try again later.");
      console.error("Error during login", error);
    } finally {
      setLoading(false);
    }
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleGoogleLogin = async (response: any) => {
    setLoading(true);
    try {
      const data = await authService.google(response.credential);
      if (data?.statusCode === 200) {
      setToken(data.data.token);
      setToast("Login successful.");
      router.replace("/");
      } else {
      setError(data.error);
      }
    } catch (error) {
      setError("An error occurred. Please try again later.");
      console.error("Error during Google login", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const { name, value } = e.target;
    if (name === "email") {
      setEmail(value);
    } else {
      setPassword(value);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <h1 className={styles.title}>Login</h1>
        {error && <div className={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label>Email:</label>
            <input
              type="email"
              value={email}
              name="email"
              onChange={handleInputChange}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Password:</label>
            <input
              type="password"
              name="password"
              value={password}
              onChange={handleInputChange}
              required
            />
          </div>
          <button type="submit" className={styles.button}>
            {loading ? "Loading..." : "Login"}
          </button>
          <div className={styles.googleButton}>
            <GoogleLogin
              onSuccess={handleGoogleLogin}
              onError={() => console.log("Login Failed")}
            />
          </div>
        </form>
        <div className={styles.signup}>
          <p>Don&apos;t have an account?</p>
          <button
            onClick={() => router.push("/auth/signup")}
            className={styles.button}
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
