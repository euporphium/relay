import { withForm } from '@/components/form/hooks';
import { ToggleableSection } from '@/components/form/ToggleableSection';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { getFieldValidator } from '@/lib/utils';
import {
  type TaskInput,
  taskInputSchema,
} from '@/shared/validation/taskInput.schema';

export const TaskForm = withForm({
  defaultValues: {
    name: '',
    note: '',
    scheduledDate: new Date(),
    preview: undefined,
    reschedule: undefined,
  } as TaskInput,
  props: {
    submitLabel: '',
  },
  render: ({ form, submitLabel }) => (
    <form
      className="p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        await form.handleSubmit();
      }}
    >
      <FieldGroup>
        <form.AppField name="name">
          {(field) => <field.Input label="Name" />}
        </form.AppField>

        <form.AppField name="note">
          {(field) => (
            <field.Textarea
              label="Note"
              description="Optional additional context"
            />
          )}
        </form.AppField>

        <form.AppField name="scheduledDate">
          {(field) => <field.DatePicker label="Scheduled date" />}
        </form.AppField>

        <FieldSeparator />

        <form.AppField
          name="preview"
          // Nested object fields need explicit validators to populate field.state.meta.errors
          validators={{
            onSubmit: getFieldValidator(taskInputSchema, 'preview'),
          }}
        >
          {(field) => (
            <ToggleableSection
              label="Enable preview"
              description="Show the task ahead of its scheduled date"
              value={field.state.value}
              defaultValue={{ value: '1', unit: 'day' }}
              onChange={field.handleChange}
            >
              <field.CalendarInterval label="How far in advance" />
            </ToggleableSection>
          )}
        </form.AppField>

        <FieldSeparator />

        <form.AppField
          name="reschedule"
          // Nested object fields need explicit validators to populate field.state.meta.errors
          validators={{
            onSubmit: getFieldValidator(taskInputSchema, 'reschedule'),
          }}
        >
          {(field) => (
            <ToggleableSection
              label="Suggest next occurrence"
              description="Calculate the next date based on a recurring interval"
              value={field.state.value}
              defaultValue={{ value: '1', unit: 'week', from: 'scheduled' }}
              onChange={field.handleChange}
            >
              <field.CalendarInterval label="Repeat every" />

              <FieldSet>
                <FieldLegend>Calculate next date from</FieldLegend>
                <FieldDescription>
                  Determine if the next suggestion should follow a strict
                  calendar or shift based on your activity.
                </FieldDescription>

                <RadioGroup
                  value={field.state.value?.from}
                  onValueChange={(val) =>
                    field.handleChange({
                      ...(field.state.value ?? { value: '1', unit: 'day' }),
                      from: val as 'scheduled' | 'completion',
                    })
                  }
                  className="mt-3 flex flex-col gap-3"
                >
                  <FieldLabel htmlFor="anchor-scheduled">
                    <Field orientation="horizontal" className="py-1">
                      <FieldContent>
                        <FieldTitle>Original scheduled date</FieldTitle>
                        <FieldDescription>
                          Keeps the task on a fixed calendar schedule.
                        </FieldDescription>
                      </FieldContent>
                      <RadioGroupItem value="scheduled" id="anchor-scheduled" />
                    </Field>
                  </FieldLabel>

                  <FieldLabel htmlFor="anchor-completion">
                    <Field orientation="horizontal" className="py-1">
                      <FieldContent>
                        <FieldTitle>Actual completion date</FieldTitle>
                        <FieldDescription>
                          Shifts the schedule based on when you actually finish.
                        </FieldDescription>
                      </FieldContent>
                      <RadioGroupItem
                        value="completion"
                        id="anchor-completion"
                      />
                    </Field>
                  </FieldLabel>
                </RadioGroup>
              </FieldSet>
            </ToggleableSection>
          )}
        </form.AppField>

        <FieldSeparator />

        <form.AppForm>
          <form.SubmitButton label={submitLabel} />
        </form.AppForm>
      </FieldGroup>
    </form>
  ),
});
