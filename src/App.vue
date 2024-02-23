<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { InfoMessageContainer } from '@churchtools/styleguide';
import { useToasts, useMain } from '@churchtools/utils';

const { toasts, removeToast } = useToasts();
const { loadCurrentUser, mainStore } = useMain();

onMounted(() => loadCurrentUser());

const removeInfoMessage = (infoMessage: (typeof toasts.value)[0]) =>
    removeToast(infoMessage.id);

const isDev = computed(() => import.meta.env.MODE === 'development');
</script>

<template>
    <!-- is removed in build-mode -->
    <div v-if="isDev" class="navbar"></div>
    <RouterView v-if="mainStore.user" />
    <div v-if="isDev">
        <InfoMessageContainer
            :messages="toasts"
            @close-info-message="removeInfoMessage"
        />
    </div>
</template>
<style scoped>
.navbar {
    height: 56px;
    background: #0e204b;
}
</style>
