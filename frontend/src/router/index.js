import { createRouter, createWebHistory } from 'vue-router';
import { isAuthenticated } from '../services/auth.js';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../components/Auth/Login.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/signup',
    name: 'Signup',
    component: () => import('../components/Auth/Signup.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../components/Dashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard/purchase',
    name: 'CreditPurchase',
    component: () => import('../components/Payment/CreditPurchase.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/payment/success',
    name: 'PaymentSuccess',
    component: () => import('../components/Payment/PaymentSuccess.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/payment/cancel',
    name: 'PaymentCancel',
    component: () => import('../components/Payment/PaymentCancel.vue'),
    meta: { requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Navigation guards
router.beforeEach((to, from, next) => {
  const authenticated = isAuthenticated();

  if (to.meta.requiresAuth && !authenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } });
  } else if (to.meta.requiresGuest && authenticated) {
    next({ name: 'Home' });
  } else {
    next();
  }
});

export default router;

