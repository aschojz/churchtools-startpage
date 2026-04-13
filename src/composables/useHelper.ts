import { ComputedRef, Ref } from 'vue';
import { mdConverter } from '../utils/helper';

export default function useHelper() {
    const mdToHtml = (
        md: ComputedRef<string | undefined> | Ref<string | undefined>
    ) => (md.value ? mdConverter().makeHtml(md.value) : '');

    return { mdToHtml };
}
