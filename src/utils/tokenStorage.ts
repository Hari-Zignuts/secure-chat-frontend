import Cookies from "js-cookie";

export const setToken = (token: string) => {
  Cookies.set("auth_token", token, { expires: 7, path: "/" });
};

export const getToken = () => {
  if (typeof window !== "undefined") {
    const token = Cookies.get("auth_token");
    return token || null;
  }
  return null;
};

export const removeToken = () => {
  Cookies.remove("auth_token");
};

export const getUserIdFromToken = (token: string | null) => {
  if (!token) return null;
  const [, payload] = token.split(".");
  const data = JSON.parse(atob(payload));
  return data.sub as string;
};
