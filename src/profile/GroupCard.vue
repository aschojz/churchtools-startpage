<script setup lang="ts">
import { Card, Tag } from '@churchtools/styleguide';
import { GroupDomainObjectType, Member } from '@churchtools/utils';
import useGroupMemberfields from '../composables/useGroupMemberfields';
import { computed, onMounted, ref } from 'vue';
import useGroupMembers from '../composables/useGroupMembers';

const props = defineProps<{
    gms: Member & { group: GroupDomainObjectType };
    showStatus?: boolean;
}>();

const groupId = computed(() => parseInt(props.gms.group.domainIdentifier));
const { fields, requiredFields } = useGroupMemberfields(groupId);

const { getMyMembership } = useGroupMembers(groupId);
const myMembership = ref<Member>();
const isLoading = ref(true);
onMounted(async () => {
    myMembership.value = await getMyMembership();
    isLoading.value = false;
});

const fieldsCompleted = computed(() => {
    if (!myMembership.value?.fields || !requiredFields.value?.length) {
        return 'no-fields';
    }
    return requiredFields.value.every((f) => {
        const res = myMembership.value?.fields.find((ff) => {
            const hasValue = Array.isArray(ff.value)
                ? ff.value.filter(
                      (v) =>
                          !!v && v !== 'bitte wählen' && v !== 'bitte ausfüllen'
                  ).length
                : !!ff.value &&
                  ff.value !== 'bitte wählen' &&
                  ff.value !== 'bitte ausfüllen';
            return ff.id === f.id && hasValue;
        });
        return !!res;
    });
});

const tag = computed(() => {
    if (fieldsCompleted.value === 'no-fields') {
        return {
            color: 'gray',
            label: 'Optionale Angaben',
        };
    }
    if (fieldsCompleted.value) {
        return {
            color: 'green',
            label: 'Angaben vollständig',
            icon: 'fas fa-circle-check',
        };
    }
    return {
        color: 'red',
        label: 'Angaben unvollständig',
        icon: 'fas fa-circle-exclamation',
    };
});

const statuses = {
    eingeladen: { color: 'yellow', icon: 'fas fa-envelope' },
    'diesmal abgesagt': { color: 'red', icon: 'fas fa-ban' },
    'immer abgesagt': { color: 'red', icon: 'fas fa-ban' },
    zugesagt: { color: 'green', icon: 'fas fa-circle-check' },
};

const statusTag = computed(() => {
    const statusIndex = fields.value?.findIndex(
        (f) => f.key === 'Zu-/Absage Mitarbeit'
    );
    if (statusIndex < 0 || !myMembership.value?.fields) {
        return {
            label: 'Eingeladen',
            color: 'yellow',
            icon: 'fas fa-envelope',
        };
    }
    const value = myMembership.value?.fields[statusIndex]?.value ?? null;

    return {
        label: value ?? 'Eingeladen',
        color: statuses[value]?.color ?? 'yellow',
        icon: statuses[value]?.icon ?? 'fas fa-envelope',
    };
});
</script>
<template>
    <Card style="--card-px: 24px; --card-py: 12px" class="hover:bg-gray-100">
        <RouterLink
            :to="{
                name: 'my-group',
                params: {
                    groupId: gms.group.domainIdentifier,
                },
            }"
        >
            <div class="flex justify-between items-center text-base">
                <div>
                    <span class="text-bold">
                        {{ gms.group.title }}
                    </span>
                </div>
                <div v-if="isLoading">
                    <i class="fas fa-spinner fa-pulse text-gray-500 ml-3"></i>
                </div>
                <div v-else class="flex items-center gap-2">
                    <Tag v-if="showStatus" v-bind="statusTag" size="0" />
                    <Tag v-bind="tag" size="S" />
                    <i class="fas fa-chevron-right text-gray-500 ml-3"></i>
                </div>
            </div>
        </RouterLink>
    </Card>
</template>
