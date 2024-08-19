import { churchtoolsClient } from '@churchtools/churchtools-client';
import { Memberfield, queryClient } from '@churchtools/utils';
import { useQuery } from '@tanstack/vue-query';
import { ComputedRef, Ref, computed } from 'vue';
import { FIFTEEN_MINUTES } from '../utils/config';

export default function useGroupMemberfields(
    groupId: ComputedRef<number> | Ref<number>
) {
    const getGroupMemberfields = () => {
        return useQuery(
            {
                queryKey: ['groups', groupId, 'memberfields'],
                queryFn: () => {
                    return churchtoolsClient.get<Memberfield[]>(
                        `/groups/${groupId.value}/memberfields`
                    );
                },
                enabled: !!groupId,
                staleTime: FIFTEEN_MINUTES,
            },
            queryClient
        );
    };
    const { data: groupMemberfields } = getGroupMemberfields();

    const pureGroupMemberfields = computed(() =>
        (groupMemberfields.value ?? []).filter((field) => field.type === 'group')
    );

    const fields = computed(() =>
        (pureGroupMemberfields.value ?? []).map((field) => {
            if (field.type === 'group') {
                return {
                    id: field.field.id,
                    key: field.field.fieldName,
                    name: (field.field.nameInSignupForm ? field.field.nameInSignupForm : field.field.name ) +
                        (field.field.requiredInRegistrationForm ? ' *' : ''),
                    note: field.field.noteInSignupForm ? field.field.noteInSignupForm : field.field.note,
                    fieldTypeCode: field.field.fieldTypeCode,
                    sortKey: field.field.sortKey,
                    securityLevel: field.field.securityLevel,
                    defaultValue: field.field.defaultValue,
                    maxLength: field.field.maxLength,
                    options: field.field.options,
                    useInRegistrationForm: field.field.useInRegistrationForm,
                    requiredInRegistrationForm:
                        field.field.requiredInRegistrationForm,
                };
            }
            return {
                id: field.field.id,
                key: field.field.dbField.name,
                name:
                    field.field.dbField.name +
                    (field.field.dbField.requiredInRegistrationForm
                        ? ' *'
                        : ''),
                note: '',
                fieldTypeCode: field.field.dbField.fieldType.internCode,
                sortKey: field.field.dbField.sortKey,
                securityLevel: field.field.dbField.securityLevel,
                defaultValue: null,
                maxLength: field.field.dbField.length,
                options: field.field.dbField.options ?? [],
                useInRegistrationForm: true,
                requiredInRegistrationForm:
                    field.field.dbField.requiredInRegistrationForm,
            };
        })
    );

    const requiredFields = computed(() =>
        fields.value.filter((f) => f.requiredInRegistrationForm)
    );
    return { fields, requiredFields };
}
