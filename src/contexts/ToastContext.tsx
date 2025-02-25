"use client";
import { createContext, useContext, ReactNode, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface ToastContextType {
  showToast: () => void;
  removeToast: () => void;
  setToast: (msg: string) => void;
  getToast: () => string | null;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = () => {
    toast.success(toastMessage, { autoClose: 2000 });
    removeToast();
  };

  const removeToast = () => {
    setToastMessage(null);
  };

  const setToast = (msg: string) => {
    setToastMessage(msg);
  };

  const getToast = () => {
    return toastMessage;
  };

  return (
    <ToastContext.Provider
      value={{ showToast, removeToast, setToast, getToast }}
    >
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};
