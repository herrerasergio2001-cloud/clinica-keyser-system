import { useState, useCallback, useRef } from 'react';
import { FormState } from '../types';

interface UseFormOptions<T> {
  initialValues: T;
  onSubmit: (values: T) => Promise<void> | void;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  onSubmit,
  validate,
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const isValid = Object.keys(errors).length === 0;
  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      const actualValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
      setValues((prev) => ({ ...prev, [name]: actualValue }));
    },
    []
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name } = e.target;
      setTouched((prev) => ({ ...prev, [name]: true }));

      if (validate) {
        const fieldErrors = validate(values);
        setErrors((prev) => ({
          ...prev,
          [name]: fieldErrors[name as keyof T],
        }));
      }
    },
    [validate, values]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (validate) {
        const fieldErrors = validate(values);
        setErrors(fieldErrors);
        if (Object.keys(fieldErrors).length > 0) {
          return;
        }
      }

      try {
        setIsSubmitting(true);
        await onSubmit(values);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validate, onSubmit]
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const register = (name: keyof T) => ({
    name,
    value: values[name],
    onChange: handleChange,
    onBlur: handleBlur,
  });

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    isDirty,
    handleChange,
    handleBlur,
    handleSubmit,
    register,
    reset,
    setValues,
    formRef,
  };
}
