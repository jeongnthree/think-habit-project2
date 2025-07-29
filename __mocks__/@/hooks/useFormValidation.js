// Mock for @/hooks/useFormValidation
export const useFormValidation = jest
  .fn()
  .mockImplementation(
    ({
      initialValues = {},
      validationRules = [],
      validateOnChange = true,
      validateOnBlur = true,
    }) => {
      return {
        values: initialValues,
        isValid: true,
        isSubmitting: false,
        hasErrors: false,
        isDirty: false,
        setFieldValue: jest.fn(),
        setFieldError: jest.fn(),
        setFieldErrors: jest.fn(),
        getFieldProps: jest.fn().mockImplementation(fieldName => ({
          value: initialValues[fieldName] || '',
          error: null,
          onChange: jest.fn(),
          onBlur: jest.fn(),
        })),
        submitForm: jest.fn().mockImplementation(async onSubmit => {
          try {
            await onSubmit(initialValues);
            return true;
          } catch (error) {
            return false;
          }
        }),
        resetForm: jest.fn(),
      };
    }
  );

export default useFormValidation;
