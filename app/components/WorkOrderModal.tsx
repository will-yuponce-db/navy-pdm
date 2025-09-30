import * as React from "react";
import { useState, useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import { addWorkOrderWithNotification } from "../redux/services/workOrderSlice";
import { useAppDispatch } from "../redux/hooks";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import type { WorkOrderModalProps, Priority } from "../types";
import { useErrorHandler } from "./ErrorHandling";
import PartsRequired from "./PartsRequired";

const modalStyle = {
  position: "absolute" as const,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "90vw", sm: "600px", md: "700px" },
  maxHeight: "90vh",
  overflow: "auto",
  bgcolor: "background.paper",
  borderRadius: 2,
  boxShadow: 24,
  p: 4,
};

export default function WorkOrderModal(props: WorkOrderModalProps) {
  const dispatch = useAppDispatch();
  const { showError } = useErrorHandler();
  const [ship, setShip] = useState("");
  const [homeport, setHomeport] = useState("");
  const [gte, setGte] = useState("");
  const [fm, setFm] = useState("");
  const [priority, setPriority] = useState<Priority>("Routine");
  const [eta, setEta] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [recommendedAction, setRecommendedAction] = useState("");
  const [partsRequired, setPartsRequired] = useState("");
  const [slaCategory, setSlaCategory] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    // Clear previous errors
    setErrors({});

    // Basic validation
    const newErrors: Record<string, string> = {};

    if (!ship.trim()) {
      newErrors.ship = "Ship is required";
    }
    if (!homeport.trim()) {
      newErrors.homeport = "Homeport is required";
    }
    if (!gte.trim()) {
      newErrors.gte = "GTE/System is required";
    }
    if (!fm.trim()) {
      newErrors.fm = "Failure Mode is required";
    }
    if (!eta.trim()) {
      newErrors.eta = "Target ETA is required";
    } else if (isNaN(parseInt(eta)) || parseInt(eta) < 0) {
      newErrors.eta = "ETA must be a valid positive number";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showError("Please fill in all required fields correctly", "warning");
      return;
    }

    // Dispatch the action and handle the promise
    dispatch(
      addWorkOrderWithNotification({
        ship: ship,
        homeport: homeport,
        fm: fm,
        gte: gte,
        priority: priority,
        status: "Submitted",
        eta: parseInt(eta) || 0,
        symptoms: symptoms,
        recommendedAction: recommendedAction,
        partsRequired: partsRequired,
        slaCategory: slaCategory,
      }),
    ).then(() => {
      // Reset form only on success
      setShip("");
      setHomeport("");
      setGte("");
      setFm("");
      setPriority("Routine");
      setEta("");
      setSymptoms("");
      setRecommendedAction("");
      setPartsRequired("");
      setSlaCategory("");
      setErrors({});
      props.handleModalClose();
      showError("Work order created successfully!", "success");
    }).catch(() => {
      showError("Failed to create work order. Please try again.", "error");
    });
  };

  // Focus management for modal
  useEffect(() => {
    if (props.modalOpen && firstInputRef.current) {
      // Small delay to ensure modal is fully rendered
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);
    }
  }, [props.modalOpen]);

  // Focus trap for modal
  useEffect(() => {
    if (!props.modalOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        props.handleModalClose();
        return;
      }

      if (event.key === "Tab") {
        const focusableElements = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );

        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[
          focusableElements.length - 1
        ] as HTMLElement;

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    if (typeof window !== "undefined" && window.document) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [props.modalOpen, props.handleModalClose]);

  return (
    <div>
      <Modal
        open={props.modalOpen}
        onClose={props.handleModalClose}
        aria-labelledby="work-order-modal-title"
        aria-describedby="work-order-modal-description"
        role="dialog"
        aria-modal="true"
      >
        <Box ref={modalRef} sx={modalStyle}>
          <Typography
            id="work-order-modal-title"
            variant="h5"
            component="h2"
            gutterBottom
          >
            Create Work Order
          </Typography>
          <Typography
            id="work-order-modal-description"
            variant="body2"
            sx={{ mb: 3, color: "text.secondary" }}
          >
            Fill out the form below to create a new work order. All fields
            marked with an asterisk (*) are required.
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Basic Information */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 3,
              }}
            >
              <Box sx={{ flex: 1 }}>
                <TextField
                  ref={firstInputRef}
                  fullWidth
                  value={ship}
                  onChange={(e) => {
                    setShip(e.target.value);
                    if (errors.ship) {
                      setErrors((prev) => ({ ...prev, ship: "" }));
                    }
                  }}
                  label="Ship"
                  variant="outlined"
                  required
                  error={!!errors.ship}
                  helperText={errors.ship}
                  aria-describedby={errors.ship ? "ship-error" : undefined}
                  inputProps={{
                    "aria-required": "true",
                    "aria-invalid": !!errors.ship,
                  }}
                />
                {errors.ship && (
                  <Typography
                    id="ship-error"
                    variant="caption"
                    color="error"
                    sx={{ mt: 0.5, display: "block" }}
                  >
                    {errors.ship}
                  </Typography>
                )}
              </Box>
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  value={homeport}
                  onChange={(e) => {
                    setHomeport(e.target.value);
                    if (errors.homeport) {
                      setErrors((prev) => ({ ...prev, homeport: "" }));
                    }
                  }}
                  label="Homeport"
                  variant="outlined"
                  required
                  error={!!errors.homeport}
                  helperText={errors.homeport}
                  aria-describedby={
                    errors.homeport ? "homeport-error" : undefined
                  }
                  inputProps={{
                    "aria-required": "true",
                    "aria-invalid": !!errors.homeport,
                  }}
                />
                {errors.homeport && (
                  <Typography
                    id="homeport-error"
                    variant="caption"
                    color="error"
                    sx={{ mt: 0.5, display: "block" }}
                  >
                    {errors.homeport}
                  </Typography>
                )}
              </Box>
            </Box>

            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 3,
              }}
            >
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  value={gte}
                  onChange={(e) => {
                    setGte(e.target.value);
                    if (errors.gte) {
                      setErrors((prev) => ({ ...prev, gte: "" }));
                    }
                  }}
                  label="GTE / System"
                  variant="outlined"
                  required
                  error={!!errors.gte}
                  helperText={errors.gte}
                  aria-describedby={errors.gte ? "gte-error" : undefined}
                  inputProps={{
                    "aria-required": "true",
                    "aria-invalid": !!errors.gte,
                  }}
                />
                {errors.gte && (
                  <Typography
                    id="gte-error"
                    variant="caption"
                    color="error"
                    sx={{ mt: 0.5, display: "block" }}
                  >
                    {errors.gte}
                  </Typography>
                )}
              </Box>
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  value={fm}
                  onChange={(e) => {
                    setFm(e.target.value);
                    if (errors.fm) {
                      setErrors((prev) => ({ ...prev, fm: "" }));
                    }
                  }}
                  label="Failure Mode"
                  variant="outlined"
                  required
                  error={!!errors.fm}
                  helperText={errors.fm}
                  aria-describedby={errors.fm ? "fm-error" : undefined}
                  inputProps={{
                    "aria-required": "true",
                    "aria-invalid": !!errors.fm,
                  }}
                />
                {errors.fm && (
                  <Typography
                    id="fm-error"
                    variant="caption"
                    color="error"
                    sx={{ mt: 0.5, display: "block" }}
                  >
                    {errors.fm}
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Priority and Timeline */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Priority & Timeline
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 3,
              }}
            >
              <Box sx={{ flex: 1 }}>
                <FormControl fullWidth>
                  <InputLabel id="priority-label">Priority</InputLabel>
                  <Select
                    labelId="priority-label"
                    value={priority}
                    label="Priority"
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    aria-describedby="priority-description"
                  >
                    <MenuItem value="Routine">Routine</MenuItem>
                    <MenuItem value="Priority">Priority</MenuItem>
                    <MenuItem value="CASREP">CASREP</MenuItem>
                  </Select>
                  <Typography
                    id="priority-description"
                    variant="caption"
                    sx={{ mt: 0.5, display: "block", color: "text.secondary" }}
                  >
                    Select the priority level for this work order
                  </Typography>
                </FormControl>
              </Box>
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  value={eta}
                  onChange={(e) => {
                    setEta(e.target.value);
                    if (errors.eta) {
                      setErrors((prev) => ({ ...prev, eta: "" }));
                    }
                  }}
                  label="Target ETA (days)"
                  variant="outlined"
                  type="number"
                  required
                  error={!!errors.eta}
                  helperText={errors.eta}
                  aria-describedby={
                    errors.eta ? "eta-error" : "eta-description"
                  }
                  inputProps={{
                    "aria-required": "true",
                    "aria-invalid": !!errors.eta,
                    min: 0,
                  }}
                />
                {errors.eta && (
                  <Typography
                    id="eta-error"
                    variant="caption"
                    color="error"
                    sx={{ mt: 0.5, display: "block" }}
                  >
                    {errors.eta}
                  </Typography>
                )}
                {!errors.eta && (
                  <Typography
                    id="eta-description"
                    variant="caption"
                    sx={{ mt: 0.5, display: "block", color: "text.secondary" }}
                  >
                    Enter the estimated time to completion in days
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Details */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Details
              </Typography>
            </Box>

            <Box>
              <TextField
                fullWidth
                multiline
                rows={3}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                label="Observed Symptoms"
                variant="outlined"
                aria-describedby="symptoms-description"
                inputProps={{
                  "aria-label": "Observed symptoms description",
                }}
              />
              <Typography
                id="symptoms-description"
                variant="caption"
                sx={{ mt: 0.5, display: "block", color: "text.secondary" }}
              >
                Describe the symptoms or issues observed with the equipment
              </Typography>
            </Box>
            <Box>
              <TextField
                fullWidth
                multiline
                rows={3}
                value={recommendedAction}
                onChange={(e) => setRecommendedAction(e.target.value)}
                label="Recommended Action"
                variant="outlined"
                aria-describedby="action-description"
                inputProps={{
                  "aria-label": "Recommended action description",
                }}
              />
              <Typography
                id="action-description"
                variant="caption"
                sx={{ mt: 0.5, display: "block", color: "text.secondary" }}
              >
                Describe the recommended action or repair procedure
              </Typography>
            </Box>

            {/* Resources */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Resources
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 3,
              }}
            >
              <Box sx={{ flex: 1 }}>
                <PartsRequired
                  partsRequired={partsRequired}
                  onPartsChange={setPartsRequired}
                  editable={true}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  value={slaCategory}
                  onChange={(e) => setSlaCategory(e.target.value)}
                  label="SLA Category"
                  variant="outlined"
                  aria-describedby="sla-description"
                  inputProps={{
                    "aria-label": "Service Level Agreement category",
                  }}
                />
                <Typography
                  id="sla-description"
                  variant="caption"
                  sx={{ mt: 0.5, display: "block", color: "text.secondary" }}
                >
                  Specify the Service Level Agreement category for this work
                  order
                </Typography>
              </Box>
            </Box>

            {/* Actions */}
            <Box>
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "flex-end",
                  mt: 2,
                }}
              >
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={props.handleModalClose}
                  size="large"
                  aria-label="Cancel and close work order form"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  variant="contained"
                  color="primary"
                  size="large"
                  aria-label="Submit work order form"
                >
                  Submit Work Order
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      </Modal>
    </div>
  );
}
