import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-400 focus:outline-none ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";