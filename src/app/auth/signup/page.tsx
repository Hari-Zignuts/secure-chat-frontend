"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./SignupPage.module.css";
import { authService } from "@/services/authService";
import { useToast } from "@/contexts/ToastContext";

const SignupPage = () => {
  const [name, setName] = useState("");
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
      const response = await authService.auth("signup", {
        name,
        email,
        password,
      });
      if (response?.statusCode === 201) {
        setToast("Signup successful. Please login to continue.");
        router.push("/auth/login");
      } else {
        setError(response.error);
      }
    } catch (error) {
      setError("An error occurred. Please try again later.");
      console.error("Error during signup", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const { name, value } = e.target;
    if (name === "name") {
      setName(value);
    } else if (name === "email") {
      setEmail(value);
    } else {
      setPassword(value);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <h1 className={styles.title}>Sign Up</h1>
        {error && <div className={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label>Name:</label>
            <input
              type="text"
              value={name}
              name="name"
              onChange={handleInputChange}
              required
            />
          </div>
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
            {loading ? "Loading..." : "Sign Up"}
          </button>
        </form>
        <div className={styles.login}>
          <p>Already have an account?</p>
          <button
            onClick={() => router.push("/auth/login")}
            className={styles.button}
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
