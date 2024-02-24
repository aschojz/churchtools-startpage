<script setup lang="ts">
import {
    ContentWrapper,
    SectionHeader,
    LoadingDots,
} from '@churchtools/styleguide';
import { computed, onMounted, toRef } from 'vue';
import usePersonMasterData from '../composables/usePersonMasterData';
import useMyGroups from '../composables/useMyGroups';
import useWikiPage from '../composables/useWikiPage';
import { mdToHtml, getName } from '../utils/helper';
import SectionedCard from '../components/SectionedCard.vue';
import {
    useFields,
    mapViz,
    Person,
    useToasts,
    queryClient,
    usePermissions,
} from '@churchtools/utils';
import {
    STARTPAGE_WIKIPAGE_ID,
    STARTPAGE_CATEGORY_ID,
    STARTPAGE_FOOTER_WIKIPAGE_ID,
    GROUP_TYPE_SHORTIES,
} from '../utils/config';
import GroupCard from './GroupCard.vue';
import {
    churchtoolsClient,
    errorHelper,
} from '@churchtools/churchtools-client';
import { sortBy } from 'lodash';
import useMain from '../composables/useMain';

const {
    groupTypes,
    isLoading: isLoadingMasterData,
    rolesById,
} = usePersonMasterData();
const { myGroups, isLoading } = useMyGroups();

const filteredGroupTypes = computed(() => {
    const gt = groupTypes.value.filter((groupType) =>
        GROUP_TYPE_SHORTIES.includes(groupType.shorty)
    );
    return gt
        .map((g) => {
            return {
                ...g,
                namePluralTranslated: getName(
                    g.namePluralTranslated ?? g.nameTranslated
                ),
                groups: myGroups.value
                    .filter(
                        (group) =>
                            rolesById.value[group.groupTypeRoleId]
                                .groupTypeId === g.id
                    )
                    .map((group) => {
                        return {
                            ...group,
                            group: {
                                ...group.group,
                                title: getName(group.group.title),
                                showStatus: g.shorty === 'AB',
                            },
                        };
                    }),
            };
        })
        .filter((g) => g.groups.length > 0);
});

const { getWikiPage } = useWikiPage();
const { data: wikiPage } = getWikiPage(
    toRef(() => STARTPAGE_CATEGORY_ID),
    toRef(() => STARTPAGE_WIKIPAGE_ID)
);
const { data: wikiPageFooter } = getWikiPage(
    toRef(() => STARTPAGE_CATEGORY_ID),
    toRef(() => STARTPAGE_FOOTER_WIKIPAGE_ID)
);
const description = computed(() => mdToHtml(wikiPage.value?.text));
const footer = computed(() => mdToHtml(wikiPageFooter.value?.text));

const { store } = usePermissions();
const { successToast, errorToast } = useToasts();
const { personFields, loadFields } = useFields();
const { currentUser, currentUserId } = useMain();
onMounted(async () => {
    loadFields();
});

const fields = computed(() => {
    const mapped = mapViz(
        {},
        personFields.value.filter((f) => {
            const secLevel =
                store.globalPermissions?.churchdb?.[
                    'security level view own data'
                ];
            if (secLevel) {
                return (
                    f.secLevel <= secLevel[0] &&
                    !f.hideInFrontend &&
                    ['f_address', 'f_church'].includes(f.fieldCategoryCode) &&
                    (f.isNewPersonField ||
                        ['firstName', 'lastName'].includes(f.key))
                );
            }
            return false;
        }),
        currentUser.value
    );
    const editLevel =
        store.globalPermissions?.churchdb?.['security level edit own data'];
    const fields = Object.values(mapped).map((item) => {
        return {
            type: 'key-value',
            viz: item,
            editable: editLevel ? item.field.secLevel <= editLevel[0] : false,
            context: 'Persönliche Daten',
            onSave: async (e) => {
                try {
                    await churchtoolsClient.patch<Person>(
                        `/persons/${currentUserId.value}`,
                        e
                    );
                    queryClient.invalidateQueries({
                        queryKey: ['currentUser'],
                    });
                    successToast('Daten gespeichert');
                } catch (error) {
                    errorToast(errorHelper.getTranslatedErrorMessage(error));
                }
            },
        };
    });
    return sortBy(fields, ['viz.field.fieldCategoryCode', 'viz.field.sortKey']);
});
</script>
<template>
    <ContentWrapper max-width>
        <div class="max-w-p mb-10 pjta-markdown" v-html="description"></div>
        <div class="flex flex-col gap-8">
            <LoadingDots
                v-if="isLoadingMasterData || !currentUserId"
                class="mt-10"
            />
            <template v-else>
                <SectionedCard
                    title="Persönliche Daten"
                    :items="fields"
                ></SectionedCard>
                <div v-for="type in filteredGroupTypes" :key="type.id">
                    <SectionHeader
                        :label="type.namePluralTranslated"
                        :note="type.description"
                    />
                    <LoadingDots v-if="isLoading" class="mt-5" />
                    <div v-else class="c-card__wrapper mt-4">
                        <GroupCard
                            v-for="group in type.groups"
                            :key="group.group.domainIdentifier"
                            :gms="group"
                            :show-status="group.group.showStatus"
                        />
                    </div>
                </div>
            </template>
        </div>
        <div class="max-w-p mb-10 pjta-markdown" v-html="footer"></div>
    </ContentWrapper>
</template>
