import { createFormHook, createFormHookContexts } from '@tanstack/react-form';
import { FormDatePicker } from '@/components/form/FormDatePicker';
import { FormInput } from '@/components/form/FormInput';
import { FormTextarea } from '@/components/form/FormTextarea';

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
