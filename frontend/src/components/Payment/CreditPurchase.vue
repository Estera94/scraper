<template>
  <div class="max-w-4xl mx-auto py-8 px-4">
    <h2 class="text-2xl font-bold text-gray-900 mb-6">Purchase Credits</h2>
    
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div
        v-for="pkg in packages"
        :key="pkg.id"
        class="bg-white rounded-lg shadow-md p-6 border-2 hover:border-indigo-500 transition-colors"
        :class="{ 'border-indigo-500': selectedPackage === pkg.id }"
      >
        <h3 class="text-xl font-semibold text-gray-900 mb-2">{{ pkg.name }}</h3>
        <div class="text-3xl font-bold text-indigo-600 mb-4">{{ pkg.priceFormatted }}</div>
        <div class="text-gray-600 mb-6">{{ pkg.credits }} credits</div>
        <button
          @click="selectPackage(pkg.id)"
          class="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 font-medium"
        >
          Select
        </button>
      </div>
    </div>

    <div v-if="selectedPackage" class="mt-8 bg-white rounded-lg shadow-md p-6">
      <h3 class="text-lg font-semibold mb-4">Complete Purchase</h3>
      <button
        @click="handlePurchase"
        :disabled="processing"
        class="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        <span v-if="processing">Processing...</span>
        <span v-else>Proceed to Checkout</span>
      </button>
    </div>

    <div v-if="error" class="mt-4 rounded-md bg-red-50 p-4">
      <div class="text-sm text-red-700">{{ error }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { createCheckout, getCreditPackages } from '../../services/payments.js';

const router = useRouter();

const packages = ref([]);
const selectedPackage = ref(null);
const loading = ref(true);
const processing = ref(false);
const error = ref('');

onMounted(async () => {
  try {
    const response = await getCreditPackages();
    packages.value = response.packages;
  } catch (err) {
    error.value = 'Failed to load credit packages';
    console.error('Error loading packages:', err);
  } finally {
    loading.value = false;
  }
});

const selectPackage = (packageId) => {
  selectedPackage.value = packageId;
};

const handlePurchase = async () => {
  if (!selectedPackage.value) return;

  processing.value = true;
  error.value = '';

  try {
    const response = await createCheckout(selectedPackage.value);
    // Redirect to Stripe Checkout
    window.location.href = response.url;
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to create checkout session';
    console.error('Checkout error:', err);
    processing.value = false;
  }
};
</script>



