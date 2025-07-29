import { useCallback, useEffect, useState } from 'react';

export interface FormField {
  value: any;
  error?: string;
  touched: boolean;
  dirty: boolean;
}

export interface FormState<T> {
  fields: Record<keyof T, FormField>;
  isValid: boolean;
  isSubmitting: boolean;
  hasErrors: boolean;
  isDirty: boolean;
  submitCount: number;
}

export interface ValidationRule<T> {
  field: keyof T;
  validator: (value: any, formData: T) => string | null;
  dependencies?: (keyof T)[];
}

export interface UseFormValidationOptions<T> {
  initialValues: T;
  validationRules?: ValidationRule<T>[];
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
}

export function useFormValidation<T extends Record<string, any>>({
  initialValues,
  validationRules = [],
  validateOnChange = true,
  validateOnBlur = true,
  debounceMs = 300,
}: UseFormValidationOptions<T>) {
  // Initialize form state
  const [formState, setFormState] = useState<FormState<T>>(() => {
    const fields = {} as Record<keyof T, FormField>;

    Object.keys(initialValues).forEach(key => {
      fields[key as keyof T] = {
        value: initialValues[key as keyof T],
        touched: false,
        dirty: false,
      };
    });

    return {
      fields,
      isValid: true,
      isSubmitting: false,
      hasErrors: false,
      isDirty: false,
      submitCount: 0,
    };
  });

  // Debounced validation
  const [validationTimeout, setValidationTimeout] =
    useState<NodeJS.Timeout | null>(null);

  // Get current form values
  const getFormValues = useCallback((): T => {
    const values = {} as T;
    Object.keys(formState.fields).forEach(key => {
      values[key as keyof T] = formState.fields[key as keyof T].value;
    });
    return values;
  }, [formState.fields]);

  // Validate a single field
  const validateField = useCallback(
    (fieldName: keyof T, value: any, formData?: T): string | null => {
      const currentFormData = formData || getFormValues();

      for (const rule of validationRules) {
        if (rule.field === fieldName) {
          const error = rule.validator(value, currentFormData);
          if (error) {
            return error;
          }
        }
      }

      return null;
    },
    [validationRules, getFormValues]
  );

  // Validate all fields
  const validateForm = useCallback(
    (formData?: T): Record<keyof T, string | null> => {
      const currentFormData = formData || getFormValues();
      const errors = {} as Record<keyof T, string | null>;

      Object.keys(formState.fields).forEach(key => {
        const fieldName = key as keyof T;
        const value = currentFormData[fieldName];
        errors[fieldName] = validateField(fieldName, value, currentFormData);
      });

      return errors;
    },
    [formState.fields, getFormValues, validateField]
  );

  // Update field value
  const setFieldValue = useCallback(
    (fieldName: keyof T, value: any) => {
      setFormState(prev => {
        const newFields = {
          ...prev.fields,
          [fieldName]: {
            ...prev.fields[fieldName],
            value,
            dirty: true,
          },
        };

        // Validate field if validateOnChange is enabled
        let fieldError: string | undefined;
        if (validateOnChange) {
          const formData = {} as T;
          Object.keys(newFields).forEach(key => {
            formData[key as keyof T] = newFields[key as keyof T].value;
          });

          fieldError = validateField(fieldName, value, formData) || undefined;
          newFields[fieldName].error = fieldError;

          // Also validate dependent fields
          validationRules.forEach(rule => {
            if (rule.dependencies?.includes(fieldName)) {
              const depValue = newFields[rule.field].value;
              const depError =
                validateField(rule.field, depValue, formData) || undefined;
              newFields[rule.field].error = depError;
            }
          });
        }

        const hasErrors = Object.values(newFields).some(field => field.error);
        const isDirty = Object.values(newFields).some(field => field.dirty);

        return {
          ...prev,
          fields: newFields,
          hasErrors,
          isDirty,
          isValid: !hasErrors,
        };
      });
    },
    [validateOnChange, validateField, validationRules]
  );

  // Set field as touched
  const setFieldTouched = useCallback(
    (fieldName: keyof T, touched = true) => {
      setFormState(prev => {
        const newFields = {
          ...prev.fields,
          [fieldName]: {
            ...prev.fields[fieldName],
            touched,
          },
        };

        // Validate field if validateOnBlur is enabled and field is touched
        if (validateOnBlur && touched) {
          const formData = getFormValues();
          const fieldError =
            validateField(fieldName, newFields[fieldName].value, formData) ||
            undefined;
          newFields[fieldName].error = fieldError;
        }

        const hasErrors = Object.values(newFields).some(field => field.error);

        return {
          ...prev,
          fields: newFields,
          hasErrors,
          isValid: !hasErrors,
        };
      });
    },
    [validateOnBlur, getFormValues, validateField]
  );

  // Set multiple field values
  const setFieldValues = useCallback(
    (values: Partial<T>) => {
      setFormState(prev => {
        const newFields = { ...prev.fields };

        Object.entries(values).forEach(([key, value]) => {
          const fieldName = key as keyof T;
          newFields[fieldName] = {
            ...newFields[fieldName],
            value,
            dirty: true,
          };
        });

        // Validate all changed fields if validateOnChange is enabled
        if (validateOnChange) {
          const formData = {} as T;
          Object.keys(newFields).forEach(key => {
            formData[key as keyof T] = newFields[key as keyof T].value;
          });

          Object.keys(values).forEach(key => {
            const fieldName = key as keyof T;
            const fieldError =
              validateField(fieldName, values[fieldName], formData) ||
              undefined;
            newFields[fieldName].error = fieldError;
          });
        }

        const hasErrors = Object.values(newFields).some(field => field.error);
        const isDirty = Object.values(newFields).some(field => field.dirty);

        return {
          ...prev,
          fields: newFields,
          hasErrors,
          isDirty,
          isValid: !hasErrors,
        };
      });
    },
    [validateOnChange, validateField]
  );

  // Set field error
  const setFieldError = useCallback(
    (fieldName: keyof T, error: string | null) => {
      setFormState(prev => {
        const newFields = {
          ...prev.fields,
          [fieldName]: {
            ...prev.fields[fieldName],
            error: error || undefined,
          },
        };

        const hasErrors = Object.values(newFields).some(field => field.error);

        return {
          ...prev,
          fields: newFields,
          hasErrors,
          isValid: !hasErrors,
        };
      });
    },
    []
  );

  // Set multiple field errors
  const setFieldErrors = useCallback(
    (errors: Record<keyof T, string | null>) => {
      setFormState(prev => {
        const newFields = { ...prev.fields };

        Object.entries(errors).forEach(([key, error]) => {
          const fieldName = key as keyof T;
          newFields[fieldName] = {
            ...newFields[fieldName],
            error: error || undefined,
          };
        });

        const hasErrors = Object.values(newFields).some(field => field.error);

        return {
          ...prev,
          fields: newFields,
          hasErrors,
          isValid: !hasErrors,
        };
      });
    },
    []
  );

  // Reset form
  const resetForm = useCallback(
    (newInitialValues?: T) => {
      const values = newInitialValues || initialValues;
      const fields = {} as Record<keyof T, FormField>;

      Object.keys(values).forEach(key => {
        fields[key as keyof T] = {
          value: values[key as keyof T],
          touched: false,
          dirty: false,
        };
      });

      setFormState({
        fields,
        isValid: true,
        isSubmitting: false,
        hasErrors: false,
        isDirty: false,
        submitCount: 0,
      });
    },
    [initialValues]
  );

  // Submit form
  const submitForm = useCallback(
    async (
      onSubmit: (values: T) => Promise<void> | void,
      options?: {
        validateBeforeSubmit?: boolean;
        onValidationError?: (errors: Record<keyof T, string | null>) => void;
      }
    ) => {
      const { validateBeforeSubmit = true, onValidationError } = options || {};

      setFormState(prev => ({
        ...prev,
        isSubmitting: true,
        submitCount: prev.submitCount + 1,
      }));

      try {
        // Validate before submit if enabled
        if (validateBeforeSubmit) {
          const formData = getFormValues();
          const errors = validateForm(formData);
          const hasErrors = Object.values(errors).some(error => error !== null);

          if (hasErrors) {
            setFieldErrors(errors);
            if (onValidationError) {
              onValidationError(errors);
            }
            return;
          }
        }

        // Mark all fields as touched
        setFormState(prev => {
          const newFields = { ...prev.fields };
          Object.keys(newFields).forEach(key => {
            newFields[key as keyof T].touched = true;
          });
          return { ...prev, fields: newFields };
        });

        // Submit form
        const formData = getFormValues();
        await onSubmit(formData);
      } catch (error) {
        // Handle submission error
        throw error;
      } finally {
        setFormState(prev => ({
          ...prev,
          isSubmitting: false,
        }));
      }
    },
    [getFormValues, validateForm, setFieldErrors]
  );

  // Debounced validation effect
  useEffect(() => {
    if (validationTimeout) {
      clearTimeout(validationTimeout);
    }

    if (validateOnChange && formState.isDirty) {
      const timeout = setTimeout(() => {
        const formData = getFormValues();
        const errors = validateForm(formData);
        setFieldErrors(errors);
      }, debounceMs);

      setValidationTimeout(timeout);
    }

    return () => {
      if (validationTimeout) {
        clearTimeout(validationTimeout);
      }
    };
  }, [
    formState.fields,
    validateOnChange,
    debounceMs,
    getFormValues,
    validateForm,
    setFieldErrors,
  ]);

  // Helper functions for field access
  const getFieldProps = useCallback(
    (fieldName: keyof T) => ({
      value: formState.fields[fieldName]?.value || '',
      error: formState.fields[fieldName]?.error,
      touched: formState.fields[fieldName]?.touched || false,
      dirty: formState.fields[fieldName]?.dirty || false,
      onChange: (value: any) => setFieldValue(fieldName, value),
      onBlur: () => setFieldTouched(fieldName, true),
    }),
    [formState.fields, setFieldValue, setFieldTouched]
  );

  const getFieldValue = useCallback(
    (fieldName: keyof T) => {
      return formState.fields[fieldName]?.value;
    },
    [formState.fields]
  );

  const getFieldError = useCallback(
    (fieldName: keyof T) => {
      return formState.fields[fieldName]?.error;
    },
    [formState.fields]
  );

  return {
    // State
    formState,
    values: getFormValues(),
    isValid: formState.isValid,
    isSubmitting: formState.isSubmitting,
    hasErrors: formState.hasErrors,
    isDirty: formState.isDirty,
    submitCount: formState.submitCount,

    // Field operations
    setFieldValue,
    setFieldValues,
    setFieldTouched,
    setFieldError,
    setFieldErrors,
    getFieldProps,
    getFieldValue,
    getFieldError,

    // Form operations
    validateForm,
    validateField,
    submitForm,
    resetForm,

    // Utilities
    getFormValues,
  };
}
