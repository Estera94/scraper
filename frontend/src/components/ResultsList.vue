<template>
  <div class="results-list">
    <div v-if="results.length === 0" class="no-results">
      No results yet. Start scraping to see results here.
    </div>
    
    <div v-else>
      <div class="results-header">
        <h2>Scraping Results</h2>
        <div class="header-actions">
          <button @click="exportResults" class="export-btn">Export JSON</button>
          <button @click="handleDeleteAll" class="delete-all-btn">Delete All</button>
        </div>
      </div>
      
      <div class="results-container">
        <div v-for="(result, index) in results" :key="index" class="result-card">
          <div class="result-header">
            <h3>{{ result.website }}</h3>
            <div class="result-header-right">
              <span class="timestamp">{{ formatDate(result.timestamp) }}</span>
              <button @click="handleDelete(index)" class="delete-btn" :title="'Delete ' + result.website">
                🗑️
              </button>
            </div>
          </div>
          
          <div v-if="result.error || !result.results" class="error-message">
            Error: {{ result.error || 'Failed to scrape website' }}
          </div>
          
          <div v-else class="result-content">
            <div v-for="(value, key) in result.results" :key="key" class="result-item">
              <span class="result-label">{{ formatLabel(key) }}:</span>
              <span v-if="key === 'whmcs'" class="result-value">
                {{ value ? 'Yes' : 'No' }}
              </span>
              <span v-else-if="value" class="result-value">
                {{ value }}
                <button 
                  @click="copyToClipboard(value)" 
                  class="copy-btn"
                  :title="'Copy ' + formatLabel(key)"
                >
                  📋
                </button>
              </span>
              <span v-else class="result-value not-found">Not found</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  results: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['delete', 'delete-all']);

const formatLabel = (key) => {
  const labels = {
    linkedin: 'LinkedIn',
    email: 'Email',
    twitter: 'Twitter',
    phone: 'Phone',
    whmcs: 'WHMCS'
  };
  return labels[key] || key;
};

const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleString();
};

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    // You could add a toast notification here
    alert('Copied to clipboard!');
  } catch (error) {
    console.error('Failed to copy:', error);
  }
};

const exportResults = () => {
  const dataStr = JSON.stringify(props.results, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `scraping-results-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

const handleDelete = (index) => {
  if (confirm(`Are you sure you want to delete the result for ${props.results[index].website}?`)) {
    emit('delete', index);
  }
};

const handleDeleteAll = () => {
  if (confirm('Are you sure you want to delete all results? This action cannot be undone.')) {
    emit('delete-all');
  }
};
</script>

<style scoped>
.results-list {
  margin-top: 2rem;
}

.no-results {
  text-align: center;
  padding: 3rem;
  color: #999;
  font-style: italic;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.results-header h2 {
  margin: 0;
  color: #333;
}

.export-btn {
  padding: 0.5rem 1rem;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.3s;
}

.export-btn:hover {
  background-color: #357abd;
}

.delete-all-btn {
  padding: 0.5rem 1rem;
  background-color: #d32f2f;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.3s;
}

.delete-all-btn:hover {
  background-color: #b71c1c;
}

.results-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.result-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #eee;
}

.result-header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.result-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.2rem;
}

.timestamp {
  color: #999;
  font-size: 0.85rem;
}

.error-message {
  color: #d32f2f;
  padding: 0.75rem;
  background-color: #ffebee;
  border-radius: 4px;
}

.result-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
}

.result-label {
  font-weight: 600;
  color: #555;
  min-width: 100px;
}

.result-value {
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.result-value.not-found {
  color: #999;
  font-style: italic;
}

.copy-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.25rem;
  opacity: 0.6;
  transition: opacity 0.3s;
}

.copy-btn:hover {
  opacity: 1;
}

.delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.25rem 0.5rem;
  opacity: 0.6;
  transition: opacity 0.3s;
  border-radius: 4px;
}

.delete-btn:hover {
  opacity: 1;
  background-color: #ffebee;
}
</style>

