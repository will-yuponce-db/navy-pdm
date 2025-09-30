import type { SxProps, Theme } from "@mui/material/styles";

/**
 * Standardized table styling for consistent formatting across the application
 */
export const standardTableStyles: SxProps<Theme> = {
  "& .MuiTableCell-root": {
    borderBottom: "1px solid",
    borderBottomColor: "divider",
    padding: "12px 16px",
  },
  "& .MuiTableHead-root .MuiTableCell-root": {
    backgroundColor: "grey.50",
    fontWeight: 600,
    fontSize: "0.875rem",
    color: "text.primary",
    borderBottom: "2px solid",
    borderBottomColor: "primary.main",
  },
  "& .MuiTableRow-root:hover": {
    backgroundColor: "action.hover",
  },
};

/**
 * Standardized table container styling
 */
export const standardTableContainerStyles: SxProps<Theme> = {
  backgroundColor: "background.paper",
  borderRadius: 2,
  border: "1px solid",
  borderColor: "divider",
  boxShadow: 1,
  overflow: "auto",
};

/**
 * Table cell alignment utilities
 */
export const tableCellAlignments = {
  left: "left" as const,
  center: "center" as const,
  right: "right" as const,
};

/**
 * Standard table size configurations
 */
export const tableSizes = {
  small: "small" as const,
  medium: "medium" as const,
};

/**
 * Common table styling patterns
 */
export const tablePatterns = {
  // For tables with many columns that need horizontal scrolling
  wideTable: {
    minWidth: 1200,
    ...standardTableStyles,
  },
  
  // For compact tables with fewer columns
  compactTable: {
    minWidth: 600,
    ...standardTableStyles,
  },
  
  // For tables that need to be responsive
  responsiveTable: {
    minWidth: 750,
    "& .MuiTableCell-root": {
      ...standardTableStyles["& .MuiTableCell-root"],
      padding: { xs: "8px 12px", sm: "12px 16px" },
    },
    ...standardTableStyles,
  },
};

/**
 * Table header styling for different contexts
 */
export const tableHeaderStyles = {
  // Primary headers (main data tables)
  primary: {
    backgroundColor: "grey.50",
    fontWeight: 600,
    fontSize: "0.875rem",
    color: "text.primary",
    borderBottom: "2px solid",
    borderBottomColor: "primary.main",
  },
  
  // Secondary headers (sub-tables or nested tables)
  secondary: {
    backgroundColor: "grey.100",
    fontWeight: 500,
    fontSize: "0.8rem",
    color: "text.secondary",
    borderBottom: "1px solid",
    borderBottomColor: "divider",
  },
  
  // Accent headers (for special sections)
  accent: {
    backgroundColor: "primary.light",
    fontWeight: 600,
    fontSize: "0.875rem",
    color: "primary.contrastText",
    borderBottom: "2px solid",
    borderBottomColor: "primary.main",
  },
};

/**
 * Table row styling patterns
 */
export const tableRowStyles = {
  // Standard hover effect
  hover: {
    "&:hover": {
      backgroundColor: "action.hover",
    },
  },
  
  // Selected row styling
  selected: {
    backgroundColor: "primary.light",
    "&:hover": {
      backgroundColor: "primary.main",
    },
  },
  
  // Alternating row colors
  striped: {
    "&:nth-of-type(even)": {
      backgroundColor: "grey.50",
    },
    "&:hover": {
      backgroundColor: "action.hover",
    },
  },
  
  // Critical/urgent row styling
  critical: {
    backgroundColor: "error.light",
    "&:hover": {
      backgroundColor: "error.main",
    },
  },
};

/**
 * Table cell content styling
 */
export const tableCellContentStyles = {
  // For cells with multiple lines of text
  multiline: {
    lineHeight: 1.4,
    whiteSpace: "pre-line" as const,
  },
  
  // For cells with long text that should truncate
  truncate: {
    maxWidth: 200,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  
  // For cells with centered content
  centered: {
    textAlign: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  
  // For cells with action buttons
  actions: {
    display: "flex",
    gap: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
};

/**
 * Table pagination styling
 */
export const tablePaginationStyles: SxProps<Theme> = {
  borderTop: "1px solid",
  borderTopColor: "divider",
  backgroundColor: "background.paper",
  "& .MuiTablePagination-toolbar": {
    paddingLeft: 2,
    paddingRight: 2,
  },
  "& .MuiTablePagination-selectLabel": {
    fontSize: "0.875rem",
  },
  "& .MuiTablePagination-displayedRows": {
    fontSize: "0.875rem",
  },
};

/**
 * Table loading state styling
 */
export const tableLoadingStyles: SxProps<Theme> = {
  position: "relative",
  "&::after": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    backdropFilter: "blur(2px)",
  },
};

/**
 * Table container with loading overlay support
 */
export const tableContainerWithLoadingStyles: SxProps<Theme> = {
  ...standardTableContainerStyles,
  position: "relative",
  overflow: "hidden",
};

/**
 * Table empty state styling
 */
export const tableEmptyStateStyles: SxProps<Theme> = {
  textAlign: "center",
  padding: 4,
  color: "text.secondary",
  fontStyle: "italic",
};

/**
 * Mobile-responsive table styling
 */
export const mobileTableStyles: SxProps<Theme> = {
  "& .MuiTableCell-root": {
    padding: { xs: "8px 12px", sm: "12px 16px" },
    fontSize: { xs: "0.75rem", sm: "0.875rem" },
  },
  "& .MuiTableHead-root .MuiTableCell-root": {
    fontSize: { xs: "0.75rem", sm: "0.875rem" },
  },
};

/**
 * Export all table styling utilities
 */
export const tableStyles = {
  standard: standardTableStyles,
  container: standardTableContainerStyles,
  containerWithLoading: tableContainerWithLoadingStyles,
  alignments: tableCellAlignments,
  sizes: tableSizes,
  patterns: tablePatterns,
  headers: tableHeaderStyles,
  rows: tableRowStyles,
  cellContent: tableCellContentStyles,
  pagination: tablePaginationStyles,
  loading: tableLoadingStyles,
  emptyState: tableEmptyStateStyles,
  mobile: mobileTableStyles,
};
