import { createRouter, createWebHistory } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/',
      component: () => import('@/layouts/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', name: 'dashboard', component: () => import('@/views/DashboardView.vue') },
        { path: 'merchants', name: 'merchants', component: () => import('@/views/MerchantsView.vue') },
        {
          path: 'merchants/:id',
          name: 'merchant-detail',
          component: () => import('@/views/MerchantDetailView.vue'),
          props: (route) => ({ id: Number(route.params.id) }),
        },
        { path: 'transactions', name: 'transactions', component: () => import('@/views/TransactionsView.vue') },
        { path: 'settlements', name: 'settlements', component: () => import('@/views/SettlementsView.vue') },
        { path: 'reports', name: 'reports', component: () => import('@/views/ReportsView.vue') },
        { path: 'components', name: 'components', component: () => import('@/views/ComponentsView.vue') },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.init()

  if (to.meta.requiresAuth && !auth.user) {
    return { name: 'login', query: to.fullPath === '/' ? {} : { redirect: to.fullPath } }
  }

  if (to.meta.guestOnly && auth.user) {
    return { name: 'dashboard' }
  }
})

export default router
