<template>
  <nav class="bg-white shadow-lg">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex">
          <div class="flex-shrink-0 flex items-center">
            <router-link to="/dashboard" class="text-xl font-bold text-indigo-600">
              Website Scraper
            </router-link>
          </div>
          <div class="hidden sm:ml-6 sm:flex sm:space-x-8 sm:items-center">
            <div class="relative flex items-center" @mouseenter="showToolsDropdown = true" @mouseleave="showToolsDropdown = false">
              <router-link
                to="/tools"
                :class="[
                  'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium',
                  isToolsActive 
                    ? 'border-indigo-500 text-gray-900' 
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                ]"
              >
                Tools
                <svg class="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </router-link>
              
              <transition
                enter-active-class="transition ease-out duration-200"
                enter-from-class="opacity-0 transform scale-95"
                enter-to-class="opacity-100 transform scale-100"
                leave-active-class="transition ease-in duration-150"
                leave-from-class="opacity-100 transform scale-100"
                leave-to-class="opacity-0 transform scale-95"
              >
                <div
                  v-if="showToolsDropdown"
                  class="absolute left-0 top-2 mt-8 pt-0 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
                >
                  <div class="py-1">
                    <router-link
                      to="/tools/website-scraper"
                      class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      active-class="bg-indigo-50 text-indigo-900"
                    >
                      Scraper
                    </router-link>
                  </div>
                </div>
              </transition>
            </div>
            <router-link
              to="/companies"
              class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              active-class="border-indigo-500 text-gray-900"
            >
              Companies
            </router-link>
            <router-link
              to="/batches"
              class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              active-class="border-indigo-500 text-gray-900"
            >
              Batches
            </router-link>
            <router-link
              to="/reports"
              class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              active-class="border-indigo-500 text-gray-900"
            >
              Reports
            </router-link>
            <router-link
              to="/dashboard"
              class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              active-class="border-indigo-500 text-gray-900"
            >
              Dashboard
            </router-link>
          </div>
        </div>
        <div class="flex items-center">
          <div class="flex items-center space-x-4">
            <div class="text-sm text-gray-700">
              <span class="font-medium">{{ user?.email }}</span>
              <span class="ml-2 px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-semibold">
                {{ user?.credits || 0 }} credits
              </span>
            </div>
            <button
              @click="handleLogout"
              class="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { logout, getStoredUser, getCurrentUser } from '../services/auth.js';

const router = useRouter();
const route = useRoute();
const user = ref(null);
const showToolsDropdown = ref(false);

const isToolsActive = computed(() => {
  return route.path.startsWith('/tools');
});

onMounted(async () => {
  user.value = getStoredUser();
  try {
    const currentUser = await getCurrentUser();
    user.value = currentUser;
    localStorage.setItem('user', JSON.stringify(currentUser));
  } catch (error) {
    console.error('Failed to get current user:', error);
  }
});

const handleLogout = () => {
  logout();
  router.push('/login');
};
</script>

