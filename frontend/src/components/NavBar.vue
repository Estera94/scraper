<template>
  <nav class="bg-white shadow-lg">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex">
          <div class="flex-shrink-0 flex items-center">
            <router-link to="/" class="text-xl font-bold text-indigo-600">
              Website Scraper
            </router-link>
          </div>
          <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
            <router-link
              to="/"
              class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              active-class="border-indigo-500 text-gray-900"
            >
              Scraper
            </router-link>
            <router-link
              to="/companies"
              class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              active-class="border-indigo-500 text-gray-900"
            >
              Companies
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
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { logout, getStoredUser, getCurrentUser } from '../services/auth.js';

const router = useRouter();
const user = ref(null);

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

