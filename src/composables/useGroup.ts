import { churchtoolsClient } from '@churchtools/churchtools-client';
import { Group, queryClient } from '@churchtools/utils';
import { useQuery } from '@tanstack/vue-query';
import { ComputedRef, Ref } from 'vue';
import { FIFTEEN_MINUTES } from '../utils/config';

export default function useGroup() {
    const getGroup = (groupId: ComputedRef<number> | Ref<number>) => {
        return useQuery(
            {
                queryKey: ['groups', groupId],
                queryFn: () => {
                    return churchtoolsClient.get<Group>(
                        `/groups/${groupId.value}`
                    );
                },
                staleTime: FIFTEEN_MINUTES,
            },
            queryClient
        );
    };
    return { getGroup };
}
