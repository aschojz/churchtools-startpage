import { churchtoolsClient } from '@churchtools/churchtools-client';
import { PersonMasterData, queryClient } from '@churchtools/utils';
import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import { FIFTEEN_MINUTES } from '../utils/config';

export default function usePersonMasterData() {
    const personMasterData = () => {
        return useQuery(
            {
                queryKey: ['personMasterData'],
                queryFn: () => {
                    return churchtoolsClient.get<PersonMasterData>(
                        '/person/masterdata'
                    );
                },
                staleTime: FIFTEEN_MINUTES,
            },
            queryClient
        );
    };
    const { data, isLoading, error } = personMasterData();

    const groupTypes = computed(() => data.value?.groupTypes ?? []);
    const rolesById = computed(() =>
        Object.fromEntries((data.value?.roles ?? []).map((r) => [r.id, r]))
    );
    return { groupTypes, isLoading, error, rolesById };
}
