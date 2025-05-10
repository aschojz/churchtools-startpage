import { churchtoolsClient } from '@churchtools/churchtools-client';
import {
    GroupMember,
    DomainObjectGroup,
    queryClient,
    useCurrentUser,
} from '@churchtools/utils';
import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';

export default function useMyGroups() {
    const currentUser = useCurrentUser();
    const getMyGroups = () => {
        return useQuery(
            {
                queryKey: ['myGroups'],
                queryFn: () => {
                    return churchtoolsClient.get<
                        (GroupMember & { group: DomainObjectGroup })[]
                    >(`/persons/${currentUser.id}/groups`);
                },
                enabled: () => currentUser.isLoggedIn,
            },
            queryClient
        );
    };

    const { data, isLoading, error } = getMyGroups();
    const myGroups = computed(() => data.value ?? []);

    return { myGroups, isLoading, error };
}
