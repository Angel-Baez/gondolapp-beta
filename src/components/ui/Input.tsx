"use client";

import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = "", ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-2.5 border-2 rounded-xl transition-all duration-200 
          ${
            error
              ? "border-alert-critico"
              : "border-gray-300 focus:border-accent-primary"
          }
          focus:outline-none focus:ring-2 focus:ring-accent-primary/20
          ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-alert-critico font-medium">{error}</p>
      )}
    </div>
  );
}

interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function TextArea({
  label,
  error,
  className = "",
  ...props
}: TextAreaProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          {label}
        </label>
      )}
      <textarea
        className={`w-full px-4 py-2.5 border-2 rounded-xl transition-all duration-200 resize-none
          ${
            error
              ? "border-alert-critico"
              : "border-gray-300 focus:border-accent-primary"
          }
          focus:outline-none focus:ring-2 focus:ring-accent-primary/20
          ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-alert-critico font-medium">{error}</p>
      )}
    </div>
  );
}
