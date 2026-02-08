import { withForm } from '@/components/form/hooks';
import { FieldGroup } from '@/components/ui/field';
import type { CommitmentInput } from '@/domain/commitment/commitmentInput.schema';
import type { CommitmentGroupOption } from '@/server/commitments/getCommitmentGroups';

const CUSTOM_GROUP_VALUE = '__custom__';
const NO_GROUP_VALUE = '__none__';

export const CommitmentForm = withForm({
  defaultValues: {
    title: '',
    note: '',
    groupId: undefined,
    groupName: '',
    groupSelection: undefined,
  } as CommitmentInput,
  props: {
    groups: [] as CommitmentGroupOption[],
    submitLabel: '',
  },
  render: ({ form, groups, submitLabel }) => {
    const options = [
      { label: 'No group', value: NO_GROUP_VALUE },
      { label: 'New group...', value: CUSTOM_GROUP_VALUE },
      ...groups.map((group) => ({ label: group.name, value: group.id })),
    ];

    return (
      <form
        className="p-4"
        onSubmit={async (event) => {
          event.preventDefault();
          await form.handleSubmit();
        }}
      >
        <FieldGroup>
          <form.AppField name="title">
            {(field) => <field.Input label="Title" />}
          </form.AppField>

          <form.AppField name="note">
            {(field) => (
              <field.Textarea
                label="Note"
                description="Optional context or motivation"
              />
            )}
          </form.AppField>

        <form.Subscribe selector={(state) => state.values.groupSelection}>
          {(groupSelection) => (
            <>
              <form.AppField name="groupSelection">
                {(field) => (
                  <field.Select
                    label="Group"
                    description="Optional. Choose an existing group or create a new one."
                    options={options}
                    placeholder="No group"
                    value={groupSelection ?? NO_GROUP_VALUE}
                    onValueChange={(value) => {
                      if (value === NO_GROUP_VALUE) {
                        form.setFieldValue('groupId', undefined);
                        form.setFieldValue('groupName', '');
                        return;
                      }

                      if (value === CUSTOM_GROUP_VALUE) {
                        form.setFieldValue('groupId', undefined);
                        return;
                      }

                      form.setFieldValue('groupId', value);
                      form.setFieldValue('groupName', '');
                    }}
                  />
                )}
              </form.AppField>

              {groupSelection === CUSTOM_GROUP_VALUE && (
                <form.AppField name="groupName">
                  {(field) => <field.Input label="New Group Name" />}
                </form.AppField>
              )}
            </>
          )}
        </form.Subscribe>

          <form.AppForm>
            <form.SubmitButton label={submitLabel} />
          </form.AppForm>
        </FieldGroup>
      </form>
    );
  },
});
