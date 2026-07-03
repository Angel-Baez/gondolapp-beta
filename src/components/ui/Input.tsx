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
        <label className="block text-footnote font-semibold text-fg-secondary mb-1">
          {label}
        </label>
      )}
      <input
        className={`w-full h-12 px-4 rounded-field transition-all duration-200
          bg-surface-2 text-body text-fg
          placeholder:text-fg-tertiary
          ${error ? "ring-2 ring-alert-critico" : "focus:ring-2 focus:ring-accent/40"}
          focus:outline-none
          ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-caption text-alert-critico font-medium">{error}</p>
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
        <label className="block text-footnote font-semibold text-fg-secondary mb-1">
          {label}
        </label>
      )}
      <textarea
        className={`w-full px-4 py-2.5 rounded-field transition-all duration-200 resize-none
          bg-surface-2 text-body text-fg
          placeholder:text-fg-tertiary
          ${error ? "ring-2 ring-alert-critico" : "focus:ring-2 focus:ring-accent/40"}
          focus:outline-none
          ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-caption text-alert-critico font-medium">{error}</p>
      )}
    </div>
  );
}
