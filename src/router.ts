import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
    {
        path: '/profile',
        name: 'profile',
        component: () => import('./profile/Profile.vue'),
    },
    {
        path: '/profile/:groupId',
        name: 'my-group',
        component: () => import('./profile/MyGroup.vue'),
        props: true,
    },
    { path: '', redirect: { name: 'profile' } },
];

export const router = createRouter({
    routes,
    history: createWebHistory(`/ccm/${import.meta.env.VITE_KEY}/`),
    scrollBehavior(to, from, savedPosition) {
        if (to.hash) {
            return { el: to.hash, left: 0, top: 70 };
        } else if (savedPosition) {
            return savedPosition;
        } else if (to.name !== from.name) {
            return { left: 0, top: 0 };
        }
        return {};
    },
});
