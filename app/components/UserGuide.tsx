import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Typography,
  Card,
  CardContent,
  IconButton,
  Chip,
  Divider,
} from "@mui/material";
import {
  Close,
  Help,
  Keyboard,
  Mouse,
  TouchApp,
  Speed,
  Security,
  Analytics,
} from "@mui/icons-material";

interface UserGuideProps {
  open?: boolean;
  onClose?: () => void;
}

const guideSteps = [
  {
    label: "Welcome to Navy PdM",
    icon: <Help />,
    content: (
      <Box>
        <Typography variant="h6" gutterBottom>
          Welcome to the Navy Predictive Maintenance System
        </Typography>
        <Typography variant="body1" paragraph>
          This system helps you manage fleet maintenance, work orders, and asset tracking
          efficiently. Let&apos;s take a quick tour of the key features.
        </Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 2 }}>
          <Chip icon={<Analytics />} label="Real-time Analytics" color="primary" />
          <Chip icon={<Security />} label="Secure Access" color="secondary" />
          <Chip icon={<Speed />} label="Fast Performance" color="success" />
        </Box>
      </Box>
    ),
  },
  {
    label: "Navigation & Shortcuts",
    icon: <Keyboard />,
    content: (
      <Box>
        <Typography variant="h6" gutterBottom>
          Quick Navigation
        </Typography>
        <Typography variant="body1" paragraph>
          Use keyboard shortcuts to navigate quickly:
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mt: 2 }}>
          <Card variant="outlined">
            <CardContent sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Main Navigation
              </Typography>
              <Typography variant="body2">Ctrl+1: Work Orders</Typography>
              <Typography variant="body2">Ctrl+2: Assets</Typography>
              <Typography variant="body2">Ctrl+3: Parts</Typography>
              <Typography variant="body2">Ctrl+4: Readiness</Typography>
            </CardContent>
          </Card>
          <Card variant="outlined">
            <CardContent sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Quick Actions
              </Typography>
              <Typography variant="body2">Ctrl+N: New Work Order</Typography>
              <Typography variant="body2">Ctrl+R: Refresh Data</Typography>
              <Typography variant="body2">Ctrl+H: Home Dashboard</Typography>
              <Typography variant="body2">Ctrl+C: Critical Alerts</Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>
    ),
  },
  {
    label: "Work Order Management",
    icon: <Mouse />,
    content: (
      <Box>
        <Typography variant="h6" gutterBottom>
          Managing Work Orders
        </Typography>
        <Typography variant="body1" paragraph>
          The work order system is the heart of maintenance management:
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Key Features:
          </Typography>
          <Box component="ul" sx={{ pl: 2 }}>
            <Typography component="li" variant="body2">
              <strong>Double-click</strong> any work order to open sensor analysis
            </Typography>
            <Typography component="li" variant="body2">
              <strong>Click status chips</strong> to quickly update work order status
            </Typography>
            <Typography component="li" variant="body2">
              Use <strong>search and filters</strong> to find specific work orders
            </Typography>
            <Typography component="li" variant="body2">
              <strong>Select multiple items</strong> for bulk operations
            </Typography>
          </Box>
        </Box>
      </Box>
    ),
  },
  {
    label: "Mobile & Touch",
    icon: <TouchApp />,
    content: (
      <Box>
        <Typography variant="h6" gutterBottom>
          Mobile-Friendly Design
        </Typography>
        <Typography variant="body1" paragraph>
          The system is fully responsive and works great on tablets and mobile devices:
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Touch Gestures:
          </Typography>
          <Box component="ul" sx={{ pl: 2 }}>
            <Typography component="li" variant="body2">
              <strong>Swipe</strong> to navigate between sections
            </Typography>
            <Typography component="li" variant="body2">
              <strong>Pinch to zoom</strong> on charts and detailed views
            </Typography>
            <Typography component="li" variant="body2">
              <strong>Long press</strong> for context menus
            </Typography>
            <Typography component="li" variant="body2">
              <strong>Pull to refresh</strong> to update data
            </Typography>
          </Box>
        </Box>
      </Box>
    ),
  },
  {
    label: "Getting Started",
    icon: <Speed />,
    content: (
      <Box>
        <Typography variant="h6" gutterBottom>
          Ready to Get Started?
        </Typography>
        <Typography variant="body1" paragraph>
          You&apos;re all set! Here are some recommended next steps:
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Recommended Actions:
          </Typography>
          <Box component="ol" sx={{ pl: 2 }}>
            <Typography component="li" variant="body2">
              Check your <strong>Quick Actions</strong> for critical alerts
            </Typography>
            <Typography component="li" variant="body2">
              Review <strong>Work Orders</strong> that need attention
            </Typography>
            <Typography component="li" variant="body2">
              Explore <strong>Asset Management</strong> for fleet overview
            </Typography>
            <Typography component="li" variant="body2">
              Set up <strong>notifications</strong> for important updates
            </Typography>
          </Box>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Typography variant="body2" color="text.secondary">
          💡 <strong>Tip:</strong> You can always access this guide by clicking the help icon
          in the navigation or pressing Ctrl+? (Cmd+? on Mac).
        </Typography>
      </Box>
    ),
  },
];

export const UserGuide: React.FC<UserGuideProps> = ({ open = false, onClose }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [isOpen, setIsOpen] = useState(open);

  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  const handleStepClick = (step: number) => {
    setActiveStep(step);
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: "70vh",
          maxHeight: "90vh",
        },
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Help color="primary" />
          <Typography variant="h6">User Guide</Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ maxWidth: "100%", p: 3 }}>
          <Stepper activeStep={activeStep} orientation="vertical">
            {guideSteps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel
                  onClick={() => handleStepClick(index)}
                  sx={{ cursor: "pointer" }}
                  StepIconComponent={() => (
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: activeStep >= index ? "primary.main" : "action.disabled",
                        color: activeStep >= index ? "primary.contrastText" : "action.disabled",
                      }}
                    >
                      {step.icon}
                    </Box>
                  )}
                >
                  <Typography variant="h6">{step.label}</Typography>
                </StepLabel>
                <StepContent>
                  <Box sx={{ mb: 2 }}>{step.content}</Box>
                  <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                    <Button
                      disabled={activeStep === 0}
                      onClick={handleBack}
                      variant="outlined"
                      size="small"
                    >
                      Back
                    </Button>
                    <Button
                      variant="contained"
                      onClick={activeStep === guideSteps.length - 1 ? handleReset : handleNext}
                      size="small"
                    >
                      {activeStep === guideSteps.length - 1 ? "Restart" : "Next"}
                    </Button>
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
        <Button onClick={handleClose} variant="outlined">
          Close Guide
        </Button>
        <Button onClick={handleReset} variant="text" disabled={activeStep === 0}>
          Start Over
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Hook to manage user guide state
export const useUserGuide = () => {
  const [isOpen, setIsOpen] = useState(false);

  const openGuide = () => setIsOpen(true);
  const closeGuide = () => setIsOpen(false);

  // Check if user has seen the guide before
  useEffect(() => {
    const hasSeenGuide = localStorage.getItem("navy-pdm-user-guide-seen");
    if (!hasSeenGuide) {
      // Auto-open guide for new users after a short delay
      const timer = setTimeout(() => {
        setIsOpen(true);
        localStorage.setItem("navy-pdm-user-guide-seen", "true");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  return {
    isOpen,
    openGuide,
    closeGuide,
  };
};

export default UserGuide;
