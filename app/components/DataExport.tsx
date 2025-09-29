import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Download,
  FileDownload,
  TableChart,
  Assessment,
  GetApp,
} from "@mui/icons-material";
import { useState } from "react";
import type { WorkOrder } from "../types";

interface ExportDataProps {
  data: WorkOrder[];
  dataType: "workOrders" | "analytics" | "maintenance";
  fileName?: string;
}

export const ExportData = ({ data, dataType, fileName }: ExportDataProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const exportToCSV = () => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header as keyof WorkOrder];
            // Handle dates and special characters
            if (value instanceof Date) {
              return `"${value.toISOString()}"`;
            }
            if (typeof value === "string" && value.includes(",")) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return `"${value}"`;
          })
          .join(","),
      ),
    ].join("\n");

    downloadFile(csvContent, "text/csv", `${fileName || dataType}.csv`);
    handleClose();
  };

  const exportToJSON = () => {
    const jsonContent = JSON.stringify(data, null, 2);
    downloadFile(
      jsonContent,
      "application/json",
      `${fileName || dataType}.json`,
    );
    handleClose();
  };

  const exportToExcel = () => {
    // For Excel export, we'll create a CSV that Excel can open
    exportToCSV();
  };

  const generateReport = () => {
    const reportData = generateReportData(data, dataType);
    const reportContent = generateHTMLReport(reportData);
    downloadFile(
      reportContent,
      "text/html",
      `${fileName || dataType}_report.html`,
    );
    handleClose();
  };

  const downloadFile = (
    content: string,
    mimeType: string,
    filename: string,
  ) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateReportData = (data: WorkOrder[], type: string) => {
    const now = new Date();
    const summary = {
      totalItems: data.length,
      generatedAt: now.toLocaleString(),
      type: type,
      statusBreakdown: data.reduce(
        (acc, item) => {
          acc[item.status] = (acc[item.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
      priorityBreakdown: data.reduce(
        (acc, item) => {
          acc[item.priority] = (acc[item.priority] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };

    return { data, summary };
  };

  const generateHTMLReport = (reportData: { data: unknown; summary: unknown }) => {
    const { data, summary } = reportData;

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Navy PDM Report - ${summary.type}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { border-bottom: 2px solid #FF3621; padding-bottom: 10px; margin-bottom: 20px; }
        .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #FF3621; color: white; }
        .status-submitted { background-color: #e3f2fd; }
        .status-in-progress { background-color: #fff3e0; }
        .status-completed { background-color: #e8f5e8; }
        .status-cancelled { background-color: #ffebee; }
        .priority-routine { background-color: #f5f5f5; }
        .priority-priority { background-color: #fff3e0; }
        .priority-casrep { background-color: #ffebee; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚢 Navy PDM Report</h1>
        <h2>${summary.type.charAt(0).toUpperCase() + summary.type.slice(1)} Report</h2>
        <p>Generated: ${summary.generatedAt}</p>
    </div>
    
    <div class="summary">
        <h3>Summary</h3>
        <p><strong>Total Items:</strong> ${summary.totalItems}</p>
        <p><strong>Status Breakdown:</strong></p>
        <ul>
            ${Object.entries(summary.statusBreakdown)
              .map(([status, count]) => `<li>${status}: ${count}</li>`)
              .join("")}
        </ul>
        <p><strong>Priority Breakdown:</strong></p>
        <ul>
            ${Object.entries(summary.priorityBreakdown)
              .map(([priority, count]) => `<li>${priority}: ${count}</li>`)
              .join("")}
        </ul>
    </div>
    
    <h3>Detailed Data</h3>
    <table>
        <thead>
            <tr>
                <th>Work Order</th>
                <th>Ship</th>
                <th>Homeport</th>
                <th>GTE</th>
                <th>Failure Mode</th>
                <th>Priority</th>
                <th>Status</th>
                <th>ETA (days)</th>
                <th>Created</th>
            </tr>
        </thead>
        <tbody>
            ${data
              .map(
                (item: WorkOrder) => `
                <tr>
                    <td>${item.wo}</td>
                    <td>${item.ship}</td>
                    <td>${item.homeport}</td>
                    <td>${item.gte}</td>
                    <td>${item.fm}</td>
                    <td class="priority-${item.priority.toLowerCase()}">${item.priority}</td>
                    <td class="status-${item.status.toLowerCase().replace(" ", "-")}">${item.status}</td>
                    <td>${item.eta}</td>
                    <td>${item.createdAt instanceof Date ? item.createdAt.toLocaleDateString() : item.createdAt}</td>
                </tr>
            `,
              )
              .join("")}
        </tbody>
    </table>
</body>
</html>`;
  };

  return (
    <>
      <Tooltip title="Export Data">
        <IconButton onClick={handleClick} size="small">
          <Download />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
      >
        <MenuItem onClick={exportToCSV}>
          <ListItemIcon>
            <TableChart fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export to CSV</ListItemText>
        </MenuItem>

        <MenuItem onClick={exportToJSON}>
          <ListItemIcon>
            <FileDownload fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export to JSON</ListItemText>
        </MenuItem>

        <MenuItem onClick={exportToExcel}>
          <ListItemIcon>
            <Assessment fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export to Excel</ListItemText>
        </MenuItem>

        <MenuItem onClick={generateReport}>
          <ListItemIcon>
            <GetApp fontSize="small" />
          </ListItemIcon>
          <ListItemText>Generate Report</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

// Bulk export component for multiple data types
export const BulkExport = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const exportAllData = () => {
    // This would typically fetch all data from Redux store
    const allData = {
      workOrders: [],
      maintenanceData: [],
      analyticsData: [],
      timestamp: new Date().toISOString(),
    };

    const content = JSON.stringify(allData, null, 2);
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `navy_pdm_full_export_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    handleClose();
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<Download />}
        onClick={handleClick}
        size="small"
      >
        Export All
      </Button>

      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem onClick={exportAllData}>
          <ListItemIcon>
            <GetApp fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export All Data</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};
