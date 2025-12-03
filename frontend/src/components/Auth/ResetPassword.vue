<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Reset your password
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Enter your new password
        </p>
      </div>
      <form class="mt-8 space-y-6" @submit.prevent="handleResetPassword">
        <div v-if="error" class="rounded-md bg-red-50 p-4">
          <div class="text-sm text-red-700">{{ error }}</div>
        </div>
        <div v-if="success" class="rounded-md bg-green-50 p-4">
          <div class="text-sm text-green-700">{{ success }}</div>
          <div class="mt-2">
            <router-link
              to="/login"
              class="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Go to login
            </router-link>
          </div>
        </div>
        <div v-if="!success" class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="password" class="sr-only">New Password</label>
            <input
              id="password"
              v-model="password"
              name="password"
              type="password"
              autocomplete="new-password"
              required
              minlength="6"
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="New password (min 6 characters)"
            />
          </div>
          <div>
            <label for="confirmPassword" class="sr-only">Confirm Password</label>
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              name="confirmPassword"
              type="password"
              autocomplete="new-password"
              required
              minlength="6"
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Confirm new password"
            />
          </div>
        </div>

        <div v-if="!success">
          <button
            type="submit"
            :disabled="loading || password !== confirmPassword"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="loading">Resetting...</span>
            <span v-else>Reset password</span>
          </button>
          <p v-if="password && confirmPassword && password !== confirmPassword" class="mt-2 text-sm text-red-600">
            Passwords do not match
          </p>
        </div>

        <div class="text-center">
          <router-link
            to="/login"
            class="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Back to login
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { resetPassword } from '../../services/auth.js';

const route = useRoute();
const router = useRouter();

const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const error = ref('');
const success = ref('');
const token = ref('');

onMounted(() => {
  token.value = route.query.token || '';
  if (!token.value) {
    error.value = 'Invalid reset link. Please request a new password reset.';
  }
});

const handleResetPassword = async () => {
  if (!token.value) {
    error.value = 'Invalid reset link. Please request a new password reset.';
    return;
  }

  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match';
    return;
  }

  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters long';
    return;
  }

  loading.value = true;
  error.value = '';
  success.value = '';

  try {
    await resetPassword(token.value, password.value);
    success.value = 'Password reset successfully! You can now login with your new password.';
    password.value = '';
    confirmPassword.value = '';
  } catch (err) {
    console.error('Reset password error:', err);
    error.value = err.response?.data?.error || err.message || 'Failed to reset password. Please try again.';
  } finally {
    loading.value = false;
  }
};
</script>

