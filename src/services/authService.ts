"use strict";
import axios from "axios";
import { getToken } from "@/utils/tokenStorage";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const authService = {
  async auth(type: "login" | "signup", payload: Record<string, string>) {
    try {
      const response = await axios.post(`${API_URL}/auth/${type}`, payload);
      return response.data;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error.response) {
        return { error: error.response.data.message || "Invalid credentials" };
      } else if (error.request) {
        return { error: "Network error, please try again later." };
      } else {
        return {
          error: "An unexpected error occurred. Please try again later.",
        };
      }
    }
  },

  async google(token: string) {
    try {
      const response = await axios.post(`${API_URL}/auth/google`, { token });
      return response.data;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error.response) {
        return { error: error.response.data.message || "Invalid credentials" };
      } else if (error.request) {
        return { error: "Network error, please try again later." };
      } else {
        return {
          error: "An unexpected error occurred. Please try again later.",
        };
      }
    }
  },

  async getUser() {
    const token = getToken();
    if (!token) return null;

    const response = await axios.get(`${API_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data.data;
  },
};
