<template>
  <div class="min-h-screen bg-gray-50">
    <NavBar />
    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <button
          type="button"
          class="mb-4 text-sm text-indigo-600 hover:text-indigo-800"
          @click="goBack"
        >
          ← Back to Batches
        </button>

        <div v-if="loading" class="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-500">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p class="mt-2">Loading batch details...</p>
        </div>

        <div v-else-if="error" class="bg-white border border-red-200 rounded-lg p-6 text-sm text-red-700">
          {{ error }}
          <button
            type="button"
            class="mt-3 px-4 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white"
            @click="loadBatch"
          >
            Retry
          </button>
        </div>

        <div v-else-if="!batch" class="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-500">
          Batch not found.
        </div>

        <div v-else class="space-y-6">
          <!-- Batch Header -->
          <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 class="text-3xl font-bold text-gray-900">Batch #{{ batch.id.slice(-8) }}</h1>
                <p class="text-sm text-gray-500 mt-1">
                  Created {{ formatDate(batch.createdAt) }}
                </p>
              </div>
              <div class="flex items-center gap-3">
                <span
                  :class="[
                    'px-3 py-1 rounded-full text-sm font-medium',
                    getStatusClass(batch.status)
                  ]"
                >
                  {{ formatStatus(batch.status) }}
                </span>
                <button
                  v-if="batch.status === 'pending'"
                  type="button"
                  class="px-4 py-2 text-sm font-medium rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                  @click="handleDelete"
                >
                  Cancel Batch
                </button>
              </div>
            </div>

            <!-- Progress Bar -->
            <div class="mt-6">
              <div class="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Progress: {{ batch.completedJobs }} / {{ batch.totalJobs }} jobs completed</span>
                <span>{{ batch.progress }}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-3">
                <div
                  :class="[
                    'h-3 rounded-full transition-all duration-300',
                    getProgressBarClass(batch.status)
                  ]"
                  :style="{ width: `${batch.progress}%` }"
                ></div>
              </div>
            </div>

            <!-- Batch Stats -->
            <div class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="text-center">
                <div class="text-2xl font-bold text-gray-900">{{ batch.totalJobs }}</div>
                <div class="text-sm text-gray-500">Total Jobs</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-green-600">{{ batch.completedJobs }}</div>
                <div class="text-sm text-gray-500">Completed</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-red-600">{{ batch.failedJobs }}</div>
                <div class="text-sm text-gray-500">Failed</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-yellow-600">
                  {{ batch.totalJobs - batch.completedJobs - batch.failedJobs }}
                </div>
                <div class="text-sm text-gray-500">Pending</div>
              </div>
            </div>

            <!-- Metadata -->
            <div v-if="batch.metadata" class="mt-6 border-t border-gray-200 pt-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-3">Batch Information</h3>
              <div class="space-y-2 text-sm">
                <div v-if="batch.metadata.infoTypes">
                  <span class="font-medium text-gray-700">Info Types: </span>
                  <span class="text-gray-600">{{ batch.metadata.infoTypes.join(', ') }}</span>
                </div>
                <div v-if="batch.metadata.websites">
                  <span class="font-medium text-gray-700">Websites: </span>
                  <span class="text-gray-600">{{ batch.metadata.websites.length }} website(s)</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Jobs List -->
          <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Jobs</h2>
            
            <div v-if="batch.jobs.length === 0" class="text-center text-gray-500 py-8">
              No jobs found in this batch.
            </div>

            <div v-else class="space-y-4">
              <div
                v-for="job in batch.jobs"
                :key="job.id"
                class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div class="flex items-start justify-between gap-4">
                  <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                      <h3 class="font-semibold text-gray-900">{{ job.website }}</h3>
                      <span
                        :class="[
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          getStatusClass(job.status)
                        ]"
                      >
                        {{ formatStatus(job.status) }}
                      </span>
                    </div>
                    
                    <div class="text-sm text-gray-600 mb-2">
                      <span>Info Types: {{ Array.isArray(job.infoTypes) ? job.infoTypes.join(', ') : 'N/A' }}</span>
                    </div>

                    <div class="text-xs text-gray-500">
                      Created: {{ formatDate(job.createdAt) }}
                    </div>

                    <!-- Error Message -->
                    <div v-if="job.error" class="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      <strong>Error:</strong> {{ job.error }}
                    </div>

                    <!-- Success Info -->
                    <div v-if="job.status === 'completed' && job.companyId" class="mt-2">
                      <router-link
                        :to="{ name: 'CompanyProfile', params: { id: job.companyId } }"
                        class="text-sm text-indigo-600 hover:text-indigo-800"
                      >
                        View Company Profile →
                      </router-link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import NavBar from '../components/NavBar.vue';
import { getBatch, deleteBatch } from '../services/batchApi.js';

const route = useRoute();
const router = useRouter();

const batch = ref(null);
const loading = ref(true);
const error = ref(null);
let pollInterval = null;

const loadBatch = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await getBatch(route.params.id);
    batch.value = response.batch;

    // Auto-refresh if batch is still processing
    if (batch.value && ['pending', 'queued', 'processing'].includes(batch.value.status)) {
      if (!pollInterval) {
        pollInterval = setInterval(() => {
          loadBatch();
        }, 5000); // Poll every 5 seconds
      }
    } else {
      // Stop polling if batch is complete
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    }
  } catch (err) {
    error.value = err.response?.data?.error || err.message || 'Failed to load batch';
    console.error('Error loading batch:', err);
  } finally {
    loading.value = false;
  }
};

const handleDelete = async () => {
  if (!confirm('Are you sure you want to cancel this batch? This action cannot be undone.')) {
    return;
  }

  try {
    await deleteBatch(route.params.id);
    router.push({ name: 'Batches' });
  } catch (err) {
    error.value = err.response?.data?.error || err.message || 'Failed to delete batch';
  }
};

const goBack = () => {
  router.push({ name: 'Batches' });
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatStatus = (status) => {
  const statusMap = {
    pending: 'Pending',
    queued: 'Queued',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed'
  };
  return statusMap[status] || status;
};

const getStatusClass = (status) => {
  const classes = {
    pending: 'bg-yellow-100 text-yellow-800',
    queued: 'bg-blue-100 text-blue-800',
    processing: 'bg-indigo-100 text-indigo-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800'
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
};

const getProgressBarClass = (status) => {
  const classes = {
    pending: 'bg-yellow-500',
    queued: 'bg-blue-500',
    processing: 'bg-indigo-500',
    completed: 'bg-green-500',
    failed: 'bg-red-500'
  };
  return classes[status] || 'bg-gray-500';
};

onMounted(() => {
  loadBatch();
});

onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval);
  }
});
</script>

