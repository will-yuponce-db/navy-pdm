import { Box, CircularProgress, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

interface LoadingSpinnerProps {
  /**
   * Whether the spinner should be visible
   */
  loading?: boolean;
  /**
   * Optional message to display below the spinner
   */
  message?: string;
  /**
   * Size of the spinner
   */
  size?: number | string;
  /**
   * Color of the spinner
   */
  color?:
    | "primary"
    | "secondary"
    | "error"
    | "info"
    | "success"
    | "warning"
    | "inherit";
  /**
   * Whether to show the spinner as an overlay
   */
  overlay?: boolean;
  /**
   * Custom styles for the container
   */
  sx?: SxProps<Theme>;
  /**
   * Whether to center the spinner
   */
  centered?: boolean;
  /**
   * Minimum height for the container
   */
  minHeight?: number | string;
}

/**
 * A reusable loading spinner component with various display options
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  loading = true,
  message,
  size = 40,
  color = "primary",
  overlay = false,
  sx = {},
  centered = true,
  minHeight = 200,
}) => {
  if (!loading) {
    return null;
  }

  const containerStyles: SxProps<Theme> = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: minHeight,
    ...(overlay && {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(255, 255, 255, 0.8)",
      zIndex: 1000,
      backdropFilter: "blur(2px)",
    }),
    ...(centered && {
      position: "relative",
    }),
    ...sx,
  };

  return (
    <Box sx={containerStyles} role="status" aria-label="Loading">
      <CircularProgress
        size={size}
        color={color}
        sx={{
          mb: message ? 2 : 0,
        }}
      />
      {message && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            textAlign: "center",
            maxWidth: 300,
          }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
};

export default LoadingSpinner;
