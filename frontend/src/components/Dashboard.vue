<template>
  <div class="min-h-screen bg-gray-50">
    <NavBar />
    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <div class="bg-white shadow rounded-lg p-6 mb-6">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div class="bg-green-50 rounded-lg p-6">
              <div class="text-sm font-medium text-green-600 mb-1">Total Payments</div>
              <div class="text-3xl font-bold text-green-900">${{ totalSpent.toFixed(2) }}</div>
            </div>
            <div class="bg-purple-50 rounded-lg p-6">
              <div class="text-sm font-medium text-purple-600 mb-1">Total Results</div>
              <div class="text-3xl font-bold text-purple-900">{{ totalResults }}</div>
            </div>
          </div>
        </div>

        <div class="bg-white shadow rounded-lg p-6 mb-6">
          <h3 class="text-xl font-semibold text-gray-900 mb-4">Payment History</h3>
          <div v-if="loadingPayments" class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
          <div v-else-if="payments.length === 0" class="text-center py-8 text-gray-500">
            No payment history yet
          </div>
          <div v-else class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="payment in payments" :key="payment.id">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ formatDate(payment.createdAt) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${{ (payment.amount / 100).toFixed(2) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                      :class="{
                        'bg-green-100 text-green-800': payment.status === 'completed',
                        'bg-yellow-100 text-yellow-800': payment.status === 'pending',
                        'bg-red-100 text-red-800': payment.status === 'failed'
                      }"
                    >
                      {{ payment.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import NavBar from './NavBar.vue';
import { getStoredUser, getCurrentUser } from '../services/auth.js';
import { getPaymentHistory } from '../services/payments.js';
import api from '../services/auth.js';

const user = ref(null);
const payments = ref([]);
const totalResults = ref(0);
const loadingPayments = ref(true);

const totalSpent = computed(() => {
  return payments.value
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0) / 100;
});

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

onMounted(async () => {
  // Load user data
  user.value = getStoredUser();
  try {
    const currentUser = await getCurrentUser();
    user.value = currentUser;
    localStorage.setItem('user', JSON.stringify(currentUser));
  } catch (error) {
    console.error('Failed to get current user:', error);
  }

  // Load payment history
  try {
    const response = await getPaymentHistory();
    payments.value = response.payments;
  } catch (error) {
    console.error('Failed to load payment history:', error);
  } finally {
    loadingPayments.value = false;
  }

  // Load total results count
  try {
    const response = await api.get('/results');
    totalResults.value = response.data.results?.length || 0;
  } catch (error) {
    console.error('Failed to load results count:', error);
  }
});
</script>


