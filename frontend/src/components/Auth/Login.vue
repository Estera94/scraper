<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
      </div>
      <form class="mt-8 space-y-6" @submit.prevent="handleLogin">
        <div v-if="error" class="rounded-md bg-red-50 p-4">
          <div class="text-sm text-red-700">{{ error }}</div>
        </div>
        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="email" class="sr-only">Email address</label>
            <input
              id="email"
              v-model="email"
              name="email"
              type="email"
              autocomplete="email"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Email address"
            />
          </div>
          <div>
            <label for="password" class="sr-only">Password</label>
            <input
              id="password"
              v-model="password"
              name="password"
              type="password"
              autocomplete="current-password"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Password"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="loading">Signing in...</span>
            <span v-else>Sign in</span>
          </button>
        </div>

        <div class="text-center space-y-2">
          <div>
            <router-link
              to="/forgot-password"
              class="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Forgot your password?
            </router-link>
          </div>
          <div>
            <router-link
              to="/signup"
              class="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Don't have an account? Sign up
            </router-link>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { login } from '../../services/auth.js';

const router = useRouter();
const route = useRoute();

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

const handleLogin = async () => {
  loading.value = true;
  error.value = '';

  try {
    const result = await login(email.value, password.value);
    console.log('Login result:', result); // Debug log
    // Ensure token is stored before redirecting
    if (result && result.token) {
      // Verify token is actually stored
      const storedToken = localStorage.getItem('token');
      console.log('Stored token:', storedToken ? 'Yes' : 'No'); // Debug log
      
      if (!storedToken) {
        error.value = 'Failed to store authentication token. Please try again.';
        loading.value = false;
        return;
      }
      
      // Small delay to ensure localStorage is written and router can check it
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const redirect = route.query.redirect || '/dashboard';
      console.log('Redirecting to:', redirect); // Debug log
      router.push(redirect);
    } else {
      error.value = 'Login failed: No token received';
      loading.value = false;
    }
  } catch (err) {
    console.error('Login error:', err);
    
    // Provide specific error messages
    if (err.response?.status === 401) {
      error.value = 'Invalid email or password. Please check your credentials and try again.';
    } else if (err.response?.status === 400) {
      error.value = err.response?.data?.error || 'Please provide both email and password.';
    } else if (err.response?.status === 500) {
      error.value = 'Server error. Please try again later.';
    } else if (err.message === 'Network Error' || !err.response) {
      error.value = 'Unable to connect to server. Please check your internet connection.';
    } else {
      error.value = err.response?.data?.error || err.message || 'Failed to login. Please try again.';
    }
    
    loading.value = false;
  }
};
</script>


