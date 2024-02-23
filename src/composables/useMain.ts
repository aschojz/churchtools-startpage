import { churchtoolsClient } from '@churchtools/churchtools-client';
import { useQuery } from '@tanstack/vue-query';
import { queryClient, Person } from '@churchtools/utils';
import { FIFTEEN_MINUTES } from '../utils/config';
import { computed } from 'vue';

export default function useMain() {
    const getCurrentUser = () => {
        return useQuery(
            {
                queryKey: ['currentUser'],
                queryFn: () =>
                    churchtoolsClient.get<{
                        data: {
                            data: Person;
                            meta: { simulatingUserId: number };
                        };
                    }>('/whoami', undefined, true),
                staleTime: FIFTEEN_MINUTES,
            },
            queryClient
        );
    };

    const { data, isLoading: userIsLoading } = getCurrentUser();

    const isSimulation = computed(
        () => data.value?.data.meta.simulatingUserId !== null
    );
    const isLoggedIn = computed(() => currentUserId.value > -1);

    const currentUserId = computed(() => data.value?.data.data.id ?? -1);
    const currentUser = computed(() => data.value?.data.data);

    return {
        currentUser,
        currentUserId,
        userIsLoading,
        isSimulation,
        isLoggedIn,
    };
}
