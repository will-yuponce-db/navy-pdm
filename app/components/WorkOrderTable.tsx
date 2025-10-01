import * as React from "react";
import { useState, useMemo, useCallback, memo, useEffect } from "react";
import { alpha } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import AddIcon from "@mui/icons-material/Add";
import TableSortLabel from "@mui/material/TableSortLabel";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Checkbox from "@mui/material/Checkbox";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import DeleteIcon from "@mui/icons-material/Delete";
import { visuallyHidden } from "@mui/utils";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../redux/hooks";
import Chip from "@mui/material/Chip";
import {
  deleteWorkOrderWithNotification,
  updateWorkOrderWithNotification,
  fetchWorkOrders,
  selectAllWorkOrders,
  selectWorkOrdersLoading,
} from "../redux/services/workOrderSlice";
import type {
  WorkOrderTableProps,
  EnhancedTableToolbarProps,
  EnhancedTableHeadProps,
  WorkOrderStatus,
} from "../types";
import {
  Menu,
  MenuItem as MenuItemComponent,
  ListItemIcon,
  ListItemText,
  TextField,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import {
  PlayArrow,
  Pause,
  CheckCircle,
  Cancel,
  Search,
  Analytics,
} from "@mui/icons-material";
import { useErrorHandler } from "./ErrorHandling";
import { tableStyles } from "../utils/tableStyles";
import SkeletonLoader from "./SkeletonLoader";
import { useNavigate } from "react-router";

const headCells = [
  {
    id: "wo",
    numeric: false,
    disablePadding: true,
    label: "Work Order Number",
  },
  {
    id: "ship",
    numeric: true,
    disablePadding: false,
    label: "Ship",
  },
  {
    id: "homeport",
    numeric: true,
    disablePadding: false,
    label: "Homeport",
  },
  {
    id: "gteSystem",
    numeric: true,
    disablePadding: false,
    label: "GTE System",
  },
  {
    id: "fm",
    numeric: true,
    disablePadding: false,
    label: "Failure Mode",
  },
  {
    id: "priority",
    numeric: true,
    disablePadding: false,
    label: "Priority",
  },
  {
    id: "status",
    numeric: true,
    disablePadding: false,
    label: "Status",
  },
  {
    id: "creationSource",
    numeric: true,
    disablePadding: false,
    label: "Source",
  },
  {
    id: "eta",
    numeric: true,
    disablePadding: false,
    label: "ETA",
  },
  {
    id: "partsRequired",
    numeric: false,
    disablePadding: false,
    label: "Parts Required",
  },
  {
    id: "actions",
    numeric: false,
    disablePadding: false,
    label: "Actions",
  },
];

function EnhancedTableHead(props: EnhancedTableHeadProps) {
  const {
    onSelectAllClick,
    order,
    orderBy,
    numSelected,
    rowCount,
    onRequestSort,
  } = props;
  const createSortHandler =
    (property: string) => (event: React.MouseEvent<unknown>) => {
      onRequestSort(event, property);
    };

  return (
    <TableHead>
      <TableRow>
        <TableCell padding="checkbox">
          <Checkbox
            color="primary"
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={rowCount > 0 && numSelected === rowCount}
            onChange={onSelectAllClick}
            inputProps={{
              "aria-label": "Select all work orders",
            }}
          />
        </TableCell>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align="left"
            padding={headCell.disablePadding ? "none" : "normal"}
            sortDirection={orderBy === headCell.id ? order : false}
            scope="col"
            aria-sort={
              orderBy === headCell.id
                ? order === "asc"
                  ? "ascending"
                  : "descending"
                : "none"
            }
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : "asc"}
              onClick={createSortHandler(headCell.id)}
              aria-label={`Sort by ${headCell.label}`}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <Box component="span" sx={visuallyHidden}>
                  {order === "desc" ? "sorted descending" : "sorted ascending"}
                </Box>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

function EnhancedTableToolbar(props: EnhancedTableToolbarProps) {
  const dispatch = useAppDispatch();
  const { numSelected = 0 } = props;
  const safeNumSelected = numSelected || 0;
  return (
    <Toolbar
      sx={[
        {
          pl: { sm: 2 },
          pr: { xs: 1, sm: 1 },
        },
        safeNumSelected > 0 && {
          bgcolor: (theme) =>
            alpha(
              theme.palette.primary.main,
              theme.palette.action.activatedOpacity,
            ),
        },
      ]}
    >
      {safeNumSelected > 0 ? (
        <Typography
          sx={{ flex: "1 1 100%" }}
          color="inherit"
          variant="subtitle1"
          component="div"
        >
          {safeNumSelected} selected
        </Typography>
      ) : (
        <Typography
          sx={{ flex: "1 1 100%" }}
          variant="h6"
          id="tableTitle"
          component="div"
        >
          Open Work Orders
        </Typography>
      )}
      {safeNumSelected > 0 ? (
        <Tooltip title="Delete">
          <IconButton
            onClick={() => {
              if (props.selected) {
                dispatch(deleteWorkOrderWithNotification(props.selected));
              }
              if (props.handleDeselect) {
                props.handleDeselect();
              }
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip title="Add Work Order">
          <IconButton
            onClick={() => {
              if (props.openWorkOrderModal) {
                props.openWorkOrderModal();
              } else {
                console.log("Add Work Order clicked - no handler provided");
              }
            }}
            size="small"
            aria-label="Add new work order"
          >
            <AddIcon />
          </IconButton>
        </Tooltip>
      )}
    </Toolbar>
  );
}
const WorkOrderTable = memo((props: WorkOrderTableProps) => {
  const workOrders = useSelector(selectAllWorkOrders);
  const loading = useSelector(selectWorkOrdersLoading);
  const dispatch = useAppDispatch();
  const { showError } = useErrorHandler();
  const navigate = useNavigate();
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [orderBy, setOrderBy] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [statusMenuAnchor, setStatusMenuAnchor] = useState<null | HTMLElement>(
    null,
  );
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<string | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [priorityFilter, setPriorityFilter] = useState<string>(
    props.initialFilter || "All",
  );
  const [sourceFilter, setSourceFilter] = useState<string>("All");

  // Fetch work orders on component mount
  useEffect(() => {
    dispatch(fetchWorkOrders());
  }, [dispatch]);

  const handleRequestSort = useCallback(
    (
      event: React.MouseEvent<unknown>,
      property: React.SetStateAction<string>,
    ) => {
      const isAsc = orderBy === property && order === "asc";
      setOrder(isAsc ? "desc" : "asc");
      setOrderBy(property);
    },
    [orderBy, order],
  );

  const handleDeselect = useCallback(() => {
    setSelected([]);
  }, []);
  const handleSelectAllClick = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.checked) {
        if (!workOrders || !Array.isArray(workOrders)) {
          setSelected([]);
          return;
        }
        const newSelected = workOrders?.map((n: { wo: string }) => n.wo) || [];
        setSelected(newSelected);
        return;
      }
      setSelected([]);
    },
    [workOrders],
  );

  const handleClick = (event: React.MouseEvent<unknown>, id: string) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected: string[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }
    setSelected(newSelected);
  };

  const handleRowDoubleClick = (workOrderId: string, creationSource: string) => {
    // Only navigate to sensor analyzer for AI work orders
    if (creationSource === 'ai') {
      navigate(`/sensor-analyzer?workOrderId=${workOrderId}`);
    }
  };

  const handleSensorAnalyzerClick = (event: React.MouseEvent, workOrderId: string) => {
    event.stopPropagation();
    navigate(`/sensor-analyzer?workOrderId=${workOrderId}`);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleStatusClick = (
    event: React.MouseEvent<HTMLElement>,
    workOrderId: string,
  ) => {
    event.stopPropagation();
    setStatusMenuAnchor(event.currentTarget);
    setSelectedWorkOrder(workOrderId);
  };

  const handleStatusClose = () => {
    setStatusMenuAnchor(null);
    setSelectedWorkOrder(null);
  };

  const handleStatusUpdate = (newStatus: WorkOrderStatus) => {
    if (selectedWorkOrder) {
      try {
        dispatch(
          updateWorkOrderWithNotification({
            wo: selectedWorkOrder,
            updates: { status: newStatus },
          }),
        );
        showError(`Work order status updated to ${newStatus}`, "success");
      } catch {
        showError("Failed to update work order status", "error");
      }
    }
    handleStatusClose();
  };

  const getStatusColor = (status: WorkOrderStatus) => {
    switch (status) {
      case "Submitted":
        return "default";
      case "Pending approval":
        return "warning";
      case "In Progress":
        return "primary";
      case "Completed":
        return "success";
      case "Cancelled":
        return "error";
      case "On Hold":
        return "warning";
      default:
        return "default";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CASREP":
        return "error";
      case "Urgent":
        return "warning";
      case "Routine":
        return "default";
      default:
        return "default";
    }
  };

  // Filter work orders based on search and filter criteria
  const filteredWorkOrders = useMemo(() => {
    if (!workOrders || !Array.isArray(workOrders)) {
      return [];
    }
    return workOrders.filter((workOrder) => {
      const matchesSearch =
        searchTerm === "" ||
        Object.values(workOrder).some((value) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase()),
        );

      const matchesStatus =
        statusFilter === "All" || workOrder.status === statusFilter;
      const matchesPriority =
        priorityFilter === "All" || workOrder.priority === priorityFilter;
      const matchesSource =
        sourceFilter === "All" || workOrder.creationSource === sourceFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesSource;
    });
  }, [workOrders, searchTerm, statusFilter, priorityFilter, sourceFilter]);

  // Removed emptyRows calculation to eliminate extra spacing

  const paginatedData = filteredWorkOrders.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  return (
    <Box
      sx={{ width: "100%", maxWidth: "100%" }}
      data-testid="work-order-table"
    >
      <Paper
        sx={{
          width: "100%",
          mb: 2,
          backgroundColor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          boxShadow: 2,
        }}
      >
        {/* Search and Filter Section */}
        <Box
          sx={{
            p: 3,
            borderBottom: 1,
            borderColor: "divider",
            backgroundColor: "background.default",
          }}
        >
          <Typography
            variant="h5"
            gutterBottom
            sx={{
              fontWeight: 700,
              color: "primary.main",
            }}
          >
            Search & Filters
          </Typography>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <TextField
              size="small"
              placeholder="Search work orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <Search sx={{ mr: 1, color: "text.secondary" }} />
                ),
              }}
              aria-label="Search work orders"
              sx={{
                minWidth: 250,
              }}
            />

            <FormControl
              size="small"
              sx={{
                minWidth: 120,
              }}
            >
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItemComponent value="All">All</MenuItemComponent>
                <MenuItemComponent value="Submitted">
                  Submitted
                </MenuItemComponent>
                <MenuItemComponent value="Pending approval">
                  Pending approval
                </MenuItemComponent>
                <MenuItemComponent value="In Progress">
                  In Progress
                </MenuItemComponent>
                <MenuItemComponent value="Completed">
                  Completed
                </MenuItemComponent>
                <MenuItemComponent value="On Hold">On Hold</MenuItemComponent>
                <MenuItemComponent value="Cancelled">
                  Cancelled
                </MenuItemComponent>
              </Select>
            </FormControl>

            <FormControl
              size="small"
              sx={{
                minWidth: 120,
              }}
            >
              <InputLabel>Priority</InputLabel>
              <Select
                value={priorityFilter}
                label="Priority"
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <MenuItemComponent value="All">All</MenuItemComponent>
                <MenuItemComponent value="Routine">Routine</MenuItemComponent>
                <MenuItemComponent value="Urgent">Urgent</MenuItemComponent>
                <MenuItemComponent value="CASREP">CASREP</MenuItemComponent>
              </Select>
            </FormControl>

            <FormControl
              size="small"
              sx={{
                minWidth: 120,
              }}
            >
              <InputLabel>Source</InputLabel>
              <Select
                value={sourceFilter}
                label="Source"
                onChange={(e) => setSourceFilter(e.target.value)}
              >
                <MenuItemComponent value="All">All</MenuItemComponent>
                <MenuItemComponent value="manual">Manual</MenuItemComponent>
                <MenuItemComponent value="ai">AI</MenuItemComponent>
              </Select>
            </FormControl>

            <Typography
              variant="body1"
              sx={{
                color: "text.secondary",
                fontWeight: 600,
                backgroundColor: "background.default",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                px: 2,
                py: 1,
                fontSize: "0.9rem",
                minWidth: "fit-content",
              }}
            >
              Showing {filteredWorkOrders.length} of {workOrders?.length || 0}{" "}
              work orders
            </Typography>
          </Box>
        </Box>

        <Box sx={{ position: "relative", zIndex: 1 }}>
          <EnhancedTableToolbar
            numSelected={selected.length}
            selected={selected}
            handleDeselect={handleDeselect}
            {...props}
          />
          <Typography
            id="table-description"
            variant="body2"
            sx={{ px: 2, pb: 1, color: "text.secondary", fontStyle: "italic" }}
          >
            Displaying {filteredWorkOrders.length} work order
            {filteredWorkOrders.length !== 1 ? "s" : ""}. Use the search and
            filter controls above to refine results.
          </Typography>
        </Box>
        <TableContainer sx={tableStyles.containerWithLoading}>
          {loading ? (
            <SkeletonLoader variant="table" rows={5} columns={10} />
          ) : (
            <Table
            sx={tableStyles.patterns.responsiveTable}
            aria-labelledby="tableTitle"
            aria-describedby="table-description"
            size="medium"
            role="table"
          >
            <EnhancedTableHead
              numSelected={selected.length}
              order={order}
              orderBy={orderBy}
              onSelectAllClick={handleSelectAllClick}
              onRequestSort={handleRequestSort}
              rowCount={filteredWorkOrders.length}
            />
            <TableBody>
              {paginatedData.map((row, index) => {
                const isItemSelected = selected.includes(row.wo.toString());
                const labelId = `enhanced-table-checkbox-${index}`;

                return (
                  <TableRow
                    key={row.wo}
                    hover
                    onClick={(event) => handleClick(event, row.wo.toString())}
                    onDoubleClick={() => handleRowDoubleClick(row.wo.toString(), row.creationSource)}
                    role="checkbox"
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    selected={isItemSelected}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        checked={isItemSelected}
                        inputProps={{
                          "aria-label": `Select work order ${row.wo}`,
                        }}
                      />
                    </TableCell>
                    <TableCell
                      component="th"
                      id={labelId}
                      scope="row"
                      padding="none"
                    >
                      {row.wo}
                    </TableCell>
                    <TableCell>{row.ship?.name || 'N/A'}</TableCell>
                    <TableCell>{row.ship?.homeport || 'N/A'}</TableCell>
                    <TableCell>{row.gteSystem?.model || 'N/A'}</TableCell>
                    <TableCell>{row.fm}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.priority}
                        color={getPriorityColor(row.priority)}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.status}
                        color={getStatusColor(row.status)}
                        onClick={(e) => handleStatusClick(e, row.wo)}
                        clickable
                        sx={{ cursor: "pointer" }}
                        aria-label={`Change status of work order ${row.wo} from ${row.status}`}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            // Create a synthetic mouse event for keyboard navigation
                            const syntheticEvent = {
                              ...e,
                              button: 0,
                              buttons: 1,
                              clientX: 0,
                              clientY: 0,
                              screenX: 0,
                              screenY: 0,
                              pageX: 0,
                              pageY: 0,
                              relatedTarget: null,
                              movementX: 0,
                              movementY: 0,
                              altKey: e.altKey,
                              ctrlKey: e.ctrlKey,
                              metaKey: e.metaKey,
                              shiftKey: e.shiftKey,
                              getModifierState: e.getModifierState,
                              nativeEvent: e.nativeEvent,
                              currentTarget: e.currentTarget,
                              target: e.target,
                              bubbles: true,
                              cancelable: true,
                              defaultPrevented: false,
                              eventPhase: 2,
                              isTrusted: false,
                              preventDefault: () => {},
                              stopPropagation: () => {},
                              stopImmediatePropagation: () => {},
                              timeStamp: Date.now(),
                              type: "click",
                            } as unknown as React.MouseEvent<HTMLElement>;
                            handleStatusClick(syntheticEvent, row.wo);
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.creationSource === 'ai' ? 'AI' : 'Manual'}
                        color={row.creationSource === 'ai' ? 'warning' : 'default'}
                        variant="outlined"
                        size="small"
                        sx={{
                          fontWeight: 'bold',
                          textTransform: 'uppercase'
                        }}
                      />
                    </TableCell>
                    <TableCell>{row.eta} days</TableCell>
                    <TableCell>
                      {row.partsRequired ? (
                        <Typography
                          variant="body2"
                          sx={{
                            maxWidth: 200,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {row.partsRequired}
                        </Typography>
                      ) : (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontStyle: "italic" }}
                        >
                          No parts required
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.creationSource === 'ai' && (
                        <Tooltip title="Open Sensor Analyzer">
                          <IconButton
                            size="small"
                            onClick={(event) => handleSensorAnalyzerClick(event, row.wo.toString())}
                            color="primary"
                            aria-label={`Open sensor analyzer for work order ${row.wo}`}
                          >
                            <Analytics />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          )}
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredWorkOrders.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={tableStyles.pagination}
        />
      </Paper>

      {/* Status Update Menu */}
      <Menu
        anchorEl={statusMenuAnchor}
        open={Boolean(statusMenuAnchor)}
        onClose={handleStatusClose}
        role="menu"
        aria-label="Status update menu"
      >
        <MenuItemComponent onClick={() => handleStatusUpdate("In Progress")}>
          <ListItemIcon>
            <PlayArrow fontSize="small" />
          </ListItemIcon>
          <ListItemText>Start Work</ListItemText>
        </MenuItemComponent>
        <MenuItemComponent onClick={() => handleStatusUpdate("On Hold")}>
          <ListItemIcon>
            <Pause fontSize="small" />
          </ListItemIcon>
          <ListItemText>Put On Hold</ListItemText>
        </MenuItemComponent>
        <MenuItemComponent onClick={() => handleStatusUpdate("Completed")}>
          <ListItemIcon>
            <CheckCircle fontSize="small" />
          </ListItemIcon>
          <ListItemText>Mark Complete</ListItemText>
        </MenuItemComponent>
        <MenuItemComponent onClick={() => handleStatusUpdate("Cancelled")}>
          <ListItemIcon>
            <Cancel fontSize="small" />
          </ListItemIcon>
          <ListItemText>Cancel Work Order</ListItemText>
        </MenuItemComponent>
      </Menu>
    </Box>
  );
});

WorkOrderTable.displayName = "WorkOrderTable";

export default WorkOrderTable;
