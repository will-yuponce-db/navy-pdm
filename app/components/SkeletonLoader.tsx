import React from "react";
import {
  Box,
  Skeleton,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";

interface SkeletonLoaderProps {
  variant?: "table" | "card" | "list" | "dashboard";
  rows?: number;
  columns?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = "table",
  rows = 5,
  columns = 6,
}) => {
  const renderTableSkeleton = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            {Array.from({ length: columns }).map((_, index) => (
              <TableCell key={index}>
                <Skeleton variant="text" width="80%" height={24} />
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <TableCell key={colIndex}>
                  <Skeleton variant="text" width="90%" height={20} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderCardSkeleton = () => (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
      {Array.from({ length: rows }).map((_, index) => (
        <Card key={index} sx={{ minWidth: 300, flex: "1 1 300px" }}>
          <CardContent>
            <Skeleton variant="text" width="60%" height={32} sx={{ mb: 2 }} />
            <Skeleton variant="text" width="100%" height={20} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="80%" height={20} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="90%" height={20} />
          </CardContent>
        </Card>
      ))}
    </Box>
  );

  const renderListSkeleton = () => (
    <Box>
      {Array.from({ length: rows }).map((_, index) => (
        <Box
          key={index}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            p: 2,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Skeleton variant="circular" width={40} height={40} />
          <Box sx={{ flexGrow: 1 }}>
            <Skeleton variant="text" width="40%" height={24} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="70%" height={20} />
          </Box>
          <Skeleton variant="rectangular" width={80} height={32} />
        </Box>
      ))}
    </Box>
  );

  const renderDashboardSkeleton = () => (
    <Box>
      {/* Header skeleton */}
      <Box sx={{ mb: 3 }}>
        <Skeleton variant="text" width="30%" height={40} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="50%" height={24} />
      </Box>

      {/* Metrics cards skeleton */}
      <Box sx={{ display: "flex", gap: 2, mb: 4, flexWrap: "wrap" }}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} sx={{ flex: "1 1 200px", minWidth: 200 }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Skeleton variant="circular" width={40} height={40} />
                <Box>
                  <Skeleton variant="text" width={60} height={32} />
                  <Skeleton variant="text" width={80} height={20} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Main content skeleton */}
      <Skeleton variant="rectangular" width="100%" height={400} />
    </Box>
  );

  switch (variant) {
    case "table":
      return renderTableSkeleton();
    case "card":
      return renderCardSkeleton();
    case "list":
      return renderListSkeleton();
    case "dashboard":
      return renderDashboardSkeleton();
    default:
      return renderTableSkeleton();
  }
};

export default SkeletonLoader;
