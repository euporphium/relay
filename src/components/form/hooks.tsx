import { createFormHook, createFormHookContexts } from '@tanstack/react-form';
import { FormDatePicker } from '@/components/form/FormDatePicker.tsx';
import { FormInput } from '@/components/form/FormInput.tsx';
import { FormTextarea } from '@/components/form/FormTextarea.tsx';

const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts();

const { useAppForm } = createFormHook({
  fieldComponents: {
    DatePicker: FormDatePicker,
    Input: FormInput,
    Textarea: FormTextarea,
  },
  formComponents: {},
  fieldContext,
  formContext,
});

export { useAppForm, useFieldContext, useFormContext };
