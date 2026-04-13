<script setup lang="ts">
import { computed } from 'vue';
import { InfoMessageContainer } from '@churchtools/styleguide';
import { useToasts, queryClient, useCurrentUser } from '@churchtools/utils';
import { VueQueryDevtools } from '@tanstack/vue-query-devtools';

const { toasts, removeToast } = useToasts();
const currentUser = useCurrentUser();

const removeInfoMessage = (infoMessage: (typeof toasts.value)[0]) =>
    removeToast(infoMessage.id);

const isDev = computed(() => import.meta.env.MODE === 'development');
</script>

<template>
    <!-- is removed in build-mode -->
    <div v-if="isDev" class="navbar"></div>
    <div style="--menu-height: 0px" class="flex flex-col grow">
        <RouterView v-if="currentUser" />
    </div>
    <div v-if="isDev">
        <InfoMessageContainer
            :messages="toasts"
            @close-info-message="removeInfoMessage"
        />
        <VueQueryDevtools :client="queryClient" />
    </div>
</template>
<style scoped>
.navbar {
    height: 56px;
    background: #0e204b;
}
</style>
