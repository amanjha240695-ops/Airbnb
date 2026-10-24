import React from "react";

export const Input = ({
  label,
  id,
  type = "text",
  value,
  onChange,
  placeholder = "",
  error = "",
  required = false,
  style = {},
  ...props
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            fontSize: "13px",
            fontWeight: "600",
            color: "var(--text-main)",
          }}
        >
          {label} {required && <span style={{ color: "var(--primary)" }}>*</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        style={{
          padding: "12px 14px",
          borderRadius: "8px",
          border: error ? "1.5px solid #b81c1c" : "1px solid var(--border-color)",
          fontSize: "14px",
          color: "var(--text-main)",
          backgroundColor: "#ffffff",
          transition: "border-color 0.2s ease",
          ...style,
        }}
        {...props}
      />
      {error && (
        <span style={{ fontSize: "12px", color: "#b81c1c", marginTop: "2px" }}>
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;