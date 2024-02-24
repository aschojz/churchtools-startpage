<script setup lang="ts">
import {
    ContentWrapper,
    LoadingDots,
    KeyValueItem,
    Button,
} from '@churchtools/styleguide';
import SectionedCard from '../components/SectionedCard.vue';
import { Member, mapViz, queryClient, t, useToasts } from '@churchtools/utils';
import useGroup from '../composables/useGroup';
import { computed, onMounted, ref, toRef } from 'vue';
import { getName, mdToHtml } from '../utils/helper';
import useGroupMemberfields from '../composables/useGroupMemberfields';
import useGroupMembers from '../composables/useGroupMembers';
import { sortBy } from 'lodash';
import {
    churchtoolsClient,
    errorHelper,
} from '@churchtools/churchtools-client';
import useMain from '../composables/useMain';

const props = defineProps<{
    groupId: string;
}>();
const id = computed(() => parseInt(props.groupId));
const { currentUserId, currentUser } = useMain();
const { errorToast, successToast } = useToasts();
const { getGroup } = useGroup();
const { data: group, isLoading } = getGroup(id);

const { getMyMembership } = useGroupMembers(
    id,
    toRef(() => currentUser.value?.lastName)
);

const myMembership = ref<Member>();
onMounted(async () => {
    myMembership.value = await getMyMembership();
});
const values = computed(() => {
    const fields = myMembership.value?.fields;
    return Object.fromEntries(
        fields?.map((field) => [
            field.name.replaceAll('.', '_'),
            field.value,
        ]) ?? []
    );
});

const name = computed(() => getName(group.value?.name));
const note = computed(() => mdToHtml(group.value?.information.note));

const { fields: data } = useGroupMemberfields(id);
const fields = computed(
    () =>
        data.value.map((f) => ({
            ...f,
            key: f.key.replaceAll('.', '_'),
            nameTranslated: t(f.name, false),
        })) ?? []
);

const items = computed(() => {
    const viz: Record<string, KeyValueItem['viz']> = mapViz(
        {},
        fields.value,
        values.value
    );

    const mapped = Object.values(viz).map((item) => {
        return {
            type: 'key-value',
            viz: item,
            editable: true,
            context: name.value,
            onSave: async (e) => {
                // eslint-disable-next-line prefer-const
                let [key, values] = Object.entries(e)[0];
                const field = fields.value.find(
                    (f) => f.key === key.replaceAll('.', '_')
                );
                if (
                    [
                        'select',
                        'multiselect',
                        'radioselect',
                        'radioSelect',
                    ].includes(field?.fieldTypeCode)
                ) {
                    values ??= [];
                }

                const payload = { fields: { [field.id]: values } };
                const p = {
                    comment: null,
                    ...myMembership.value,
                    fields:
                        Array.isArray(payload.fields) || !payload.fields
                            ? Object.fromEntries(
                                  (payload.fields ?? [])?.map((f) => [
                                      f.id,
                                      Array.isArray(f.value)
                                          ? f.value.filter((v) => v)
                                          : f.value,
                                  ])
                              )
                            : payload.fields,
                };
                try {
                    const result = await churchtoolsClient.put<Member[]>(
                        `/groups/${props.groupId}/members/${currentUserId.value}`,
                        p
                    );
                    myMembership.value = result[0];
                    queryClient.invalidateQueries({
                        queryKey: ['groups', id.value, 'members'],
                    });
                    successToast('Daten gespeichert');
                } catch (error) {
                    errorToast(errorHelper.getTranslatedErrorMessage(error));
                }
            },
        };
    });
    return sortBy(
        mapped.filter((item) => item.viz.field.useInRegistrationForm),
        (item) => item.viz.field.sortKey
    );
});
</script>
<template>
    <LoadingDots v-if="isLoading || !myMembership" class="mt-20" />
    <ContentWrapper
        v-else
        max-width
        :title="name"
        :breadcrumbs="[
            { title: 'Meine Anmeldung', to: { name: 'profile' } },
            { title: name },
        ]"
    >
        <div
            v-if="note"
            class="markdown max-w-p text-secondary text-base"
            v-html="note"
        ></div>
        <SectionedCard :items="items" />
        <Button
            class="self-start"
            icon="fas fa-arrow-left"
            text
            size="S"
            @click="() => $router.go(-1)"
            >Zurück</Button
        >
    </ContentWrapper>
</template>
