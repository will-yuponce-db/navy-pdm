import React, { useState, useCallback } from "react";
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Paper,
  Card,
  CardContent,
  Divider,
  Alert,
  LinearProgress,
} from "@mui/material";
import {
  ArrowBack,
  ArrowForward,
  Check,
} from "@mui/icons-material";

interface FormStep {
  id: string;
  title: string;
  description?: string;
  component: React.ComponentType<FormStepProps>;
  validation?: (data: Record<string, unknown>) => { isValid: boolean; errors: string[] };
  optional?: boolean;
}

interface FormStepProps {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  errors: string[];
  onNext?: () => void;
  onPrevious?: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

interface FormWizardProps {
  steps: FormStep[];
  initialData?: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => Promise<void> | void;
  onCancel?: () => void;
  title?: string;
  submitText?: string;
  cancelText?: string;
  showProgress?: boolean;
}

export const FormWizard: React.FC<FormWizardProps> = ({
  steps,
  initialData = {},
  onSubmit,
  onCancel,
  title = "Form Wizard",
  submitText = "Submit",
  cancelText = "Cancel",
  showProgress = true,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, unknown>>(initialData);
  const [stepErrors, setStepErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const currentStep = steps[activeStep];
  const isFirstStep = activeStep === 0;
  const isLastStep = activeStep === steps.length - 1;

  const updateFormData = useCallback((newData: Record<string, unknown>) => {
    setFormData((prev) => ({ ...prev, ...newData }));
  }, []);

  const validateCurrentStep = useCallback(() => {
    if (!currentStep.validation) return true;

    const validation = currentStep.validation(formData);
    if (!validation.isValid) {
      setStepErrors((prev) => ({
        ...prev,
        [currentStep.id]: validation.errors,
      }));
      return false;
    }

    // Clear errors for this step
    setStepErrors((prev: Record<string, string[]>) => {
      const newErrors = { ...prev };
      delete newErrors[currentStep.id];
      return newErrors;
    });

    return true;
  }, [currentStep, formData]);

  const handleNext = useCallback(() => {
    if (validateCurrentStep()) {
      setActiveStep((prev) => prev + 1);
      setSubmitError(null);
    }
  }, [validateCurrentStep]);

  const handleBack = useCallback(() => {
    setActiveStep((prev) => prev - 1);
    setSubmitError(null);
  }, []);

  const handleStepClick = useCallback((stepIndex: number) => {
    // Allow navigation to previous steps or current step
    if (stepIndex <= activeStep) {
      setActiveStep(stepIndex);
      setSubmitError(null);
    }
  }, [activeStep]);

  const handleSubmit = useCallback(async () => {
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onSubmit(formData);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "An error occurred during submission"
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, onSubmit, validateCurrentStep]);

  // const getStepStatus = (stepIndex: number) => {
  //   if (stepIndex < activeStep) return "completed";
  //   if (stepIndex === activeStep) return "active";
  //   return "pending";
  // };

  const progress = ((activeStep + 1) / steps.length) * 100;

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", p: 2 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {title}
          </Typography>
          {showProgress && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
                  Step {activeStep + 1} of {steps.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {Math.round(progress)}% Complete
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          )}
        </Box>

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((step, index) => (
            <Step
              key={step.id}
              completed={index < activeStep}
              sx={{
                cursor: index <= activeStep ? "pointer" : "default",
              }}
              onClick={() => handleStepClick(index)}
            >
              <StepLabel
                optional={
                  step.optional ? (
                    <Typography variant="caption">Optional</Typography>
                  ) : undefined
                }
                error={stepErrors[step.id] && stepErrors[step.id].length > 0}
                StepIconProps={{
                  completed: index < activeStep,
                  error: stepErrors[step.id] && stepErrors[step.id].length > 0
                }}
              >
                <Typography variant="subtitle2">{step.title}</Typography>
                {step.description && (
                  <Typography variant="caption" color="text.secondary">
                    {step.description}
                  </Typography>
                )}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        <Divider sx={{ mb: 3 }} />

        {/* Current Step Content */}
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {currentStep.title}
            </Typography>
            {currentStep.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {currentStep.description}
              </Typography>
            )}

            {/* Step Errors */}
            {stepErrors[currentStep.id] && stepErrors[currentStep.id].length > 0 && (
              <Alert severity="error" sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Please fix the following errors:
                </Typography>
                <Box component="ul" sx={{ mb: 0, pl: 2 }}>
                  {stepErrors[currentStep.id].map((error, index) => (
                    <Typography key={index} component="li" variant="body2">
                      {error}
                    </Typography>
                  ))}
                </Box>
              </Alert>
            )}

            {/* Step Component */}
            <currentStep.component
              data={formData}
              onChange={updateFormData}
              errors={stepErrors[currentStep.id] || []}
              onNext={handleNext}
              onPrevious={handleBack}
              isFirstStep={isFirstStep}
              isLastStep={isLastStep}
            />
          </CardContent>
        </Card>

        {/* Submit Error */}
        {submitError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {submitError}
          </Alert>
        )}

        {/* Navigation */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Button
            onClick={isFirstStep ? onCancel : handleBack}
            startIcon={isFirstStep ? undefined : <ArrowBack />}
            disabled={isSubmitting}
          >
            {isFirstStep ? cancelText : "Back"}
          </Button>

          <Box sx={{ display: "flex", gap: 2 }}>
            {!isLastStep ? (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<ArrowForward />}
                disabled={isSubmitting}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={isSubmitting}
                startIcon={isSubmitting ? undefined : <Check />}
              >
                {isSubmitting ? "Submitting..." : submitText}
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

// Example step component
export const BasicInfoStep: React.FC<FormStepProps> = ({
  data,
  // onChange,
  errors,
}) => {
  // const handleFieldChange = (field: string, value: unknown) => {
  //   onChange({ [field]: value });
  // };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="body1">
        This is an example step component. In a real implementation, you would
        include form fields here.
      </Typography>
      
      {/* Add your form fields here */}
      <Box sx={{ p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Form data: {JSON.stringify(data, null, 2)}
        </Typography>
      </Box>

      {errors.length > 0 && (
        <Alert severity="error">
          <Typography variant="subtitle2" gutterBottom>
            Validation Errors:
          </Typography>
          <Box component="ul" sx={{ mb: 0, pl: 2 }}>
            {errors.map((error, index) => (
              <Typography key={index} component="li" variant="body2">
                {error}
              </Typography>
            ))}
          </Box>
        </Alert>
      )}
    </Box>
  );
};

export default FormWizard;
