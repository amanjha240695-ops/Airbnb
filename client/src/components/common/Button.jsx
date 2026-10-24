import React from "react";

export const Button = ({
  children,
  type = "button",
  variant = "primary", // 'primary', 'secondary', 'outline', 'danger'
  size = "md", // 'sm', 'md', 'lg'
  disabled = false,
  loading = false,
  onClick,
  style = {},
  className = "",
  ...props
}) => {
  const getStyles = () => {
    let bg = "var(--primary)";
    let color = "#ffffff";
    let border = "none";

    if (variant === "secondary") {
      bg = "var(--text-main)";
      color = "#ffffff";
    } else if (variant === "outline") {
      bg = "transparent";
      color = "var(--text-main)";
      border = "1px solid var(--border-color)";
    } else if (variant === "danger") {
      bg = "#b81c1c";
      color = "#ffffff";
    }

    const padding =
      size === "sm"
        ? "8px 14px"
        : size === "lg"
        ? "14px 24px"
        : "11px 18px";

    const fontSize = size === "sm" ? "13px" : size === "lg" ? "16px" : "14px";

    return {
      backgroundColor: disabled || loading ? "#e0e0e0" : bg,
      color: disabled || loading ? "#8c8c8c" : color,
      border,
      padding,
      fontSize,
      fontWeight: "600",
      borderRadius: "8px",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      cursor: disabled || loading ? "not-allowed" : "pointer",
      transition: "all 0.15s ease",
      width: props.fullWidth ? "100%" : "auto",
      ...style,
    };
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      style={getStyles()}
      className={className}
      {...props}
    >
      {loading ? "Processing..." : children}
    </button>
  );
};

export default Button;