import { churchtoolsClient } from '@churchtools/churchtools-client';
import { Member, GroupDomainObjectType, queryClient } from '@churchtools/utils';
import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import useMain from './useMain';

export default function useMyGroups() {
    const { currentUserId, isLoggedIn } = useMain();
    const getMyGroups = () => {
        return useQuery(
            {
                queryKey: ['myGroups'],
                queryFn: () => {
                    return churchtoolsClient.get<
                        (Member & { group: GroupDomainObjectType })[]
                    >(`/persons/${currentUserId.value}/groups`);
                },
                enabled: isLoggedIn,
            },
            queryClient
        );
    };

    const { data, isLoading, error } = getMyGroups();
    const myGroups = computed(() => data.value ?? []);

    return { myGroups, isLoading, error };
}
