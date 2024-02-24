import { churchtoolsClient } from '@churchtools/churchtools-client';
import { Member, PaginationMetaData, queryClient } from '@churchtools/utils';
import { useInfiniteQuery } from '@tanstack/vue-query';
import { ComputedRef, Ref } from 'vue';
import { FIFTEEN_MINUTES } from '../utils/config';
import useMain from './useMain';

export default function useGroupMembers(
    groupId: ComputedRef<number> | Ref<number>,
    query: ComputedRef<string> | Ref<string>
) {
    const { currentUserId } = useMain();
    const getGroupMembers = () => {
        return useInfiniteQuery(
            {
                queryKey: ['groups', groupId.value, 'members'],
                queryFn: ({ pageParam }) => {
                    return churchtoolsClient.get<{
                        data: {
                            data: Member[];
                            meta: PaginationMetaData;
                        };
                    }>(
                        `/groups/${groupId.value}/members?page=${pageParam}&limit=200&query=${query.value}`,
                        undefined,
                        true
                    );
                },
                enabled: () => !!groupId.value && query.value !== undefined,
                initialPageParam: 1,
                getNextPageParam: (lastPage) => {
                    const nextPage = lastPage.data.meta.pagination.current + 1;
                    if (nextPage > lastPage.data.meta.pagination.lastPage) {
                        return undefined;
                    }
                    return nextPage;
                },
                staleTime: FIFTEEN_MINUTES,
                select: (data) => {
                    return data.pages.flatMap((page) => page.data.data);
                },
            },
            queryClient
        );
    };

    const {
        data: members,
        fetchNextPage,
        hasNextPage,
        isFetching,
        isFetchedAfterMount,
    } = getGroupMembers();

    const getMyMembership = async (): Promise<Member> => {
        const membership = members.value?.find(
            (m) => m.personId === currentUserId.value
        );
        if (membership) {
            return Promise.resolve(membership);
        } else {
            if (hasNextPage.value) {
                await fetchNextPage();
            }
            if (isFetching.value || !query.value) {
                await new Promise((resolve) => setTimeout(resolve, 2000));
            }
            return getMyMembership();
        }
    };
    return { getGroupMembers, getMyMembership, isFetchedAfterMount };
}
