<template>
  <div class="min-h-screen bg-gray-50">
    <NavBar />
    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <div class="bg-white shadow rounded-lg p-6 mb-6">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Tools</h2>
          <p class="text-gray-600 mb-8">Choose a tool to get started:</p>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <router-link
              to="/tools/website-scraper"
              class="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-indigo-500 transition-all duration-200"
            >
              <div class="flex items-center mb-4">
                <div class="bg-indigo-100 rounded-lg p-3 mr-4">
                  <svg class="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 class="text-lg font-semibold text-gray-900">Website Scraper</h3>
              </div>
              <p class="text-sm text-gray-600">
                Extract information from websites including emails, phone numbers, LinkedIn profiles, and more.
              </p>
            </router-link>
            
            <!-- Placeholder for future tools -->
            <!--
            <div class="bg-white border border-gray-200 rounded-lg p-6 opacity-50">
              <div class="flex items-center mb-4">
                <div class="bg-gray-100 rounded-lg p-3 mr-4">
                  <svg class="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 class="text-lg font-semibold text-gray-500">Coming Soon</h3>
              </div>
              <p class="text-sm text-gray-400">
                More tools will be available soon.
              </p>
            </div>
            -->
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import NavBar from '../components/NavBar.vue';
</script>

