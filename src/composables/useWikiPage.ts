import { churchtoolsClient } from '@churchtools/churchtools-client';
import { WikiPage, queryClient } from '@churchtools/utils';
import { useQuery } from '@tanstack/vue-query';
import { ComputedRef, Ref } from 'vue';
import { FIFTEEN_MINUTES } from '../utils/config';

export default function useWikiPage() {
    const getWikiPage = (
        categoryId: ComputedRef<number> | Ref<number>,
        pageId: ComputedRef<string> | Ref<string>
    ) => {
        return useQuery(
            {
                queryKey: ['wiki', categoryId.value, pageId.value],
                queryFn: () => {
                    return churchtoolsClient.get<WikiPage>(
                        `/wiki/categories/${categoryId.value}/pages/${pageId.value}`
                    );
                },
                staleTime: FIFTEEN_MINUTES,
            },
            queryClient
        );
    };
    return { getWikiPage };
}
