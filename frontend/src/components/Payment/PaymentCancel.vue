<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 text-center">
      <div class="bg-white rounded-lg shadow-md p-8">
        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
          <svg class="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Payment Cancelled</h2>
        <p class="text-gray-600 mb-6">Your payment was cancelled. No charges were made.</p>
        <div class="space-y-4">
          <router-link
            to="/dashboard"
            class="block w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 font-medium"
          >
            Go to Dashboard
          </router-link>
          <router-link
            to="/dashboard"
            class="block w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 font-medium"
          >
            Back to Home
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

