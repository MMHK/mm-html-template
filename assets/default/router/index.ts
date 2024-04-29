import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../page/Home.vue')
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../page/About.vue')
  }
]

const router = createRouter({
    history: createWebHashHistory(),
    routes
})

export default router
