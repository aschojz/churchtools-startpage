<script setup lang="ts" generic="Item = SectionedCardItem">
import {
    Button,
    Toggle,
    ValueDisplay,
    Tag,
    DropdownMenu,
    Card,
    SectionHeader,
    SectionHeaderAction,
    ActionItem,
    LinkItem,
    SectionedCardItem,
    useEditFormData,
    KeyValueItem,
} from '@churchtools/styleguide';
import { notNullish, vizIsEmpty } from '@churchtools/utils';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { mdToHtml } from '../utils/helper';

const emit = defineEmits<{
    (event: 'click', item: string): void;
}>();

const props = defineProps<{
    items: Item[];
    context?: string;
    title?: string;
    note?: string;
    actions?: SectionHeaderAction[];
    onSaveItem?: (data: { [key: string]: unknown }) => void;
}>();

const router = useRouter();

const getActionItemOnClick = (item: ActionItem) => {
    if (item.onClick) {
        return item.onClick;
    }
    if (item.emit) {
        return () => {
            emit('click', item.emit);
        };
    }
    return undefined;
};

const getLinkItemOnClick = (item: LinkItem) => {
    if (item.to) {
        return () => {
            router.push(item.to!);
        };
    }
    if (item.href) {
        return () => {
            window.location.href = item.href!;
        };
    }
    if (item.onClick) {
        return item.onClick;
    }
    if (item.emit) {
        return () => {
            emit('click', item.emit);
        };
    }
    return undefined;
};

const getLinkItemIconColor = (iconColor: LinkItem['iconColor']) => {
    if (iconColor === undefined || typeof iconColor === 'string') {
        return {
            '--avatar-background': `var(--${iconColor}-pale)`,
            '--avatar-color': `var(--${iconColor}-bright)`,
        };
    }

    return {
        '--avatar-background': iconColor.background,
        '--avatar-color': iconColor.icon,
    };
};

const canClear = (item: KeyValueItem) =>
    item.clearText === undefined &&
    !item.viz?.field.required &&
    item.viz?.field.fieldTypeCode !== 'text-html' &&
    (item.viz?.field.nullable !== false ||
        item.viz?.field.fieldTypeCode === 'text');

const getFormValue = (item: KeyValueItem) => {
    return (item.viz?.type === 'tags' || item.viz?.type === 'domainObjects') &&
        Array.isArray(item.viz?.value)
        ? item.viz?.value.map((v) => v.id)
        : item.viz?.type === 'number'
          ? item.viz?.value.number
          : item.viz?.value;
};

const { editFormData } = useEditFormData();

const onKeyValueEdit = (item: KeyValueItem) => {
    if (item.onEdit) {
        item.onEdit();
        return;
    }

    if (item.viz === null) {
        return;
    }

    editFormData(
        {
            context: item.context ?? props.context ?? '',
            clearText: canClear(item)
                ? tx(`Daten zurücksetzen`)
                : item.clearText,
            headline: item.headline,
            backdropClose: item.backdropClose,
            zIndex: item.zIndex,
            fields: [item.viz.field],
            formData: {
                [item.viz?.field.key]: notNullish(getFormValue(item))
                    ? getFormValue(item)
                    : item.prefilledValue ?? '',
            },
        },
        item.slots
    ).then((result) => {
        const res = item.transformResult
            ? item.transformResult(result)
            : result;

        if (item.onSave) {
            item.onSave(res);
            return;
        }

        if (props.onSaveItem) {
            props.onSaveItem(res);
        }
    });
};

const getActionItemColor = (item: ActionItem) => {
    if (item.disabled) {
        return 'text-basic-disabled';
    }

    if (item.actionType === 'destructive') {
        return 'text-error-bright group-hover:text-error-secondary';
    }
    if (item.actionType === 'accent') {
        return 'text-accent-bright group-hover:text-accent-secondary';
    }

    return 'text-basic-secondary group-hover:text-basic-primary';
};

const items = computed(() => {
    return props.items.map((item) => {
        if (item.type === 'link') {
            return {
                ...item,
                onClick: getLinkItemOnClick(item),
                iconStyle: getLinkItemIconColor(item.iconColor),
            };
        }

        if (item.type === 'action') {
            return {
                ...item,
                onClick: (e: MouseEvent) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const action = getActionItemOnClick(item);
                    if (action) {
                        action(e);
                    }
                },
                color: getActionItemColor(item),
            };
        }

        return item;
    });
});

const onBeforeChange = async (item: KeyValueItem) => {
    if (item.onBeforeEdit) {
        return item.onBeforeEdit();
    }
    return Promise.resolve();
};

const toggleRefresh = ref(0);

const onSaveBool = (item: KeyValueItem, newVal: boolean) => {
    const key =
        item.viz?.field.key ??
        item.viz?.field.name ??
        String(item.viz?.field.id);
    let data = { [key]: newVal };

    if (item.transformResult) {
        data = item.transformResult(data);
    }
    if (item.onSave) {
        const promise = item.onSave(data);
        if (!promise) {
            return;
        }
        promise.then((result: boolean | undefined) => {
            if (result !== undefined && !result) {
                toggleRefresh.value += 1;
            }
        });
        return;
    }

    props.onSaveItem?.(data);
};
</script>
<template>
    <div>
        <SectionHeader
            v-if="title || note || actions?.length"
            :label="title"
            :note="note"
            :actions="actions"
            class="mb-4"
        />
        <Card class="flex-shrink-0 overflow-hidden">
            <template #full>
                <div
                    class="flex flex-col divide-x-0 divide-y divide-solid divide-basic-divider"
                    v-bind="$attrs"
                >
                    <template v-for="(item, index) in items" :key="index">
                        <slot
                            name="item"
                            :item-index="index"
                            :item="item"
                            :on-key-value-edit="onKeyValueEdit"
                        >
                            <div
                                v-if="item.type === 'link'"
                                class="px-6 py-3.5"
                                :class="{
                                    'cursor-pointer': item.onClick,
                                    'bg-foreground-secondary':
                                        item.variant === 'secondary',
                                }"
                                @click="item.onClick"
                            >
                                <div
                                    class="flex items-center justify-between gap-4"
                                >
                                    <div class="flex-shrink-0">
                                        <div class="flex items-center gap-4">
                                            <div
                                                v-if="item.icon"
                                                class="c-avatar c-avatar__XS c-avatar__border-none"
                                                :style="item.iconStyle"
                                            >
                                                <i
                                                    :class="item.icon"
                                                    class="fa-fw"
                                                />
                                            </div>
                                            <span
                                                class="flex flex-shrink-0 grow items-center gap-2 whitespace-nowrap"
                                            >
                                                <div
                                                    v-if="item.valueLoading"
                                                    class="ct-animate-pulse h-4 rounded-full"
                                                    :style="{
                                                        width: `${Math.min((item.value?.length ?? 0) * 2, 70)}%`,
                                                    }"
                                                />
                                                <span
                                                    v-else
                                                    :class="
                                                        item.valueBold
                                                            ? 'text-body-m-emphasized'
                                                            : 'text-body-m'
                                                    "
                                                >
                                                    {{ item.value }}
                                                </span>
                                                <slot
                                                    name="linkitem-left"
                                                    :item="item"
                                                >
                                                    <div
                                                        class="flex items-center gap-2"
                                                    >
                                                        <template
                                                            v-for="(
                                                                tagOrString,
                                                                leftIndex
                                                            ) in item.left"
                                                            :key="leftIndex"
                                                        >
                                                            <span
                                                                v-if="
                                                                    typeof tagOrString ===
                                                                    'string'
                                                                "
                                                                class="text-basic-secondary text-body-m"
                                                            >
                                                                {{
                                                                    tagOrString
                                                                }}
                                                            </span>
                                                            <Tag
                                                                v-else
                                                                v-tippy="
                                                                    tagOrString.tippy
                                                                "
                                                                v-bind="
                                                                    tagOrString
                                                                "
                                                                :color="
                                                                    tagOrString
                                                                        .color
                                                                        ?.key ??
                                                                    tagOrString.color
                                                                "
                                                            />
                                                        </template>
                                                    </div>
                                                </slot>
                                            </span>
                                        </div>
                                    </div>
                                    <div
                                        v-if="
                                            item.actions?.length ||
                                            item.right?.length ||
                                            item.to ||
                                            item.onClick ||
                                            item.href
                                        "
                                    >
                                        <div class="flex items-center gap-4">
                                            <slot
                                                name="linkitem-right"
                                                :item="item"
                                            >
                                                <div class="flex gap-4">
                                                    <template
                                                        v-for="(
                                                            tagOrString,
                                                            rightIndex
                                                        ) in item.right"
                                                        :key="rightIndex"
                                                    >
                                                        <span
                                                            v-if="
                                                                typeof tagOrString ===
                                                                'string'
                                                            "
                                                            class="text-basic-secondary text-body-m line-clamp-1"
                                                        >
                                                            {{ tagOrString }}
                                                        </span>
                                                        <Tag
                                                            v-else
                                                            v-tippy="
                                                                tagOrString.tippy
                                                            "
                                                            class="whitespace-nowrap"
                                                            v-bind="tagOrString"
                                                            :color="
                                                                tagOrString
                                                                    .color
                                                                    ?.key ??
                                                                tagOrString.color
                                                            "
                                                        />
                                                    </template>
                                                </div>
                                            </slot>
                                            <template
                                                v-for="(
                                                    action, actionIndex
                                                ) in item.actions"
                                                :key="actionIndex"
                                            >
                                                <Button
                                                    v-if="
                                                        action.type === 'button'
                                                    "
                                                    v-tippy="action.label"
                                                    :icon="action.icon"
                                                    size="S"
                                                    text
                                                    color="gray"
                                                    :disabled="action.disabled"
                                                    @click="action.onClick"
                                                />
                                                <DropdownMenu
                                                    v-else-if="
                                                        action.type ===
                                                        'dropdown'
                                                    "
                                                    :menu-items="
                                                        action.sections
                                                    "
                                                >
                                                    <Button
                                                        icon="fas fa-ellipsis-h"
                                                        text
                                                        color="gray"
                                                        size="S"
                                                    />
                                                </DropdownMenu>
                                            </template>
                                            <i
                                                v-if="
                                                    item.to ||
                                                    item.onClick ||
                                                    item.href
                                                "
                                                class="fas fa-chevron-right text-basic-secondary"
                                                color="gray"
                                                size="S"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div
                                v-else-if="item.type === 'key-value'"
                                class="sectioned-card-grid gap-2 px-6 py-3.5"
                                :class="{
                                    'bg-foreground-secondary':
                                        item.variant === 'secondary',
                                }"
                            >
                                <template
                                    v-if="
                                        item.viz?.type === 'yesno' &&
                                        item.editable
                                    "
                                >
                                    <div
                                        class="text-basic-primary md:col-span-2 text-body-m-emphasized md:text-body-m flex h-6 items-center"
                                    >
                                        {{
                                            item.viz?.field.nameTranslated ??
                                            item.viz?.field.name
                                        }}
                                    </div>
                                    <div
                                        v-tippy="item.disabled"
                                        class="md:col-start-3"
                                    >
                                        <Toggle
                                            :key="index + '-' + toggleRefresh"
                                            class="shrink-0"
                                            :disabled="!!item.disabled"
                                            :label="
                                                item.viz.field.nameTranslated ??
                                                ''
                                            "
                                            :model-value="item.viz.value"
                                            :before-change="
                                                (ev) => onBeforeChange(item)
                                            "
                                            :self-center="false"
                                            @update:model-value="
                                                onSaveBool(item, $event)
                                            "
                                        />
                                    </div>
                                    <template
                                        v-if="item.note || item.viz?.field.note"
                                    >
                                        <div
                                            v-if="
                                                typeof item.note === 'string' ||
                                                typeof item.viz?.field.note ===
                                                    'string'
                                            "
                                            class="text-basic-secondary text-body-m max-w-p col-span-2"
                                            v-html="
                                                mdToHtml(
                                                    item.note ??
                                                        item.viz?.field.note
                                                )
                                            "
                                        ></div>
                                        <div
                                            v-else-if="item.note"
                                            class="col-span-2 col-start-2"
                                        >
                                            <i
                                                class="fas fa-circle-info text-info-bright"
                                            />
                                            <span
                                                class="text-body-m max-w-p ml-2"
                                                :class="{
                                                    'text-info-primary':
                                                        item.note.variant ===
                                                        'info',
                                                }"
                                            >
                                                {{ item.note.text }}
                                            </span>
                                        </div>
                                    </template>
                                </template>
                                <template v-else>
                                    <span
                                        class="text-basic-primary text-body-m-emphasized lg:text-body-m shrink-0"
                                    >
                                        {{
                                            item.viz?.field.nameTranslated ??
                                            item.viz?.field.name
                                        }}
                                    </span>
                                    <span
                                        v-if="
                                            item.editable &&
                                            (!vizIsEmpty(item.viz) ||
                                                item.viz?.field.defaultValue)
                                        "
                                        v-tippy="item.disabled"
                                        class="ml-3 flex place-content-end items-start gap-4"
                                    >
                                        <Button
                                            :disabled="!!item.disabled"
                                            class="-m-0.5"
                                            icon="fas fa-pen"
                                            size="S"
                                            text
                                            color="gray"
                                            @click="onKeyValueEdit(item)"
                                        />
                                    </span>
                                    <div
                                        class="break-word col-span-2 flex flex-wrap gap-1 md:col-span-1 md:col-start-2 md:row-start-1"
                                    >
                                        <ValueDisplay
                                            :item="item"
                                            @add="onKeyValueEdit(item)"
                                        />
                                    </div>
                                    <template
                                        v-if="item.note || item.viz?.field.note"
                                    >
                                        <div
                                            v-if="
                                                typeof item.note === 'string' ||
                                                typeof item.viz?.field.note ===
                                                    'string'
                                            "
                                            class="text-basic-secondary pjta-markdown text-body-m md:row-start-2 md:col-span-2"
                                            v-html="
                                                mdToHtml(
                                                    item.note ??
                                                        item.viz?.field.note
                                                )
                                            "
                                        ></div>
                                        <div
                                            v-else-if="item.note"
                                            class="md:row-start-2 md:col-span-2"
                                        >
                                            <i
                                                class="fas fa-circle-info text-info-bright"
                                            />
                                            <span
                                                class="text-body-m max-w-p ml-2"
                                                :class="{
                                                    'text-info-primary':
                                                        item.note.variant ===
                                                        'info',
                                                }"
                                            >
                                                {{ item.note.text }}
                                            </span>
                                        </div>
                                    </template>
                                </template>
                            </div>
                            <button
                                v-else-if="item.type === 'action'"
                                class="group flex w-full items-center justify-start border-none bg-transparent px-6 py-3 font-sans"
                                :class="
                                    item.disabled
                                        ? 'cursor-not-allowed'
                                        : 'cursor-pointer'
                                "
                                @click="!item.disabled && item.onClick($event)"
                            >
                                <div
                                    class="c-avatar c-avatar__XS c-avatar__border-none bg-transparent"
                                    tabindex="-1"
                                >
                                    <i
                                        class="fa-fw transition-colors"
                                        :class="[item.icon, item.color]"
                                    />
                                </div>
                                <span
                                    class="text-body-m-emphasized ml-4 flex-shrink-0 grow text-left transition-colors"
                                    :class="item.color"
                                >
                                    {{ item.label }}
                                </span>
                            </button>
                        </slot>
                    </template>
                </div>
            </template>
        </Card>
    </div>
</template>
<style>
.sectioned-card-grid {
    display: grid;
    grid-template-columns: 1fr min-content;
}
@media screen and (min-width: 768px) {
    .sectioned-card-grid {
        grid-template-columns: 192px 1fr min-content;
    }
}
</style>
