<template>
  <AppLayout>
    <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-dark-700 dark:bg-dark-900">
      <iframe
        title="GPT Image Playground"
        src="/gpt-image-playground/?sub2api=1"
        class="block h-[calc(100vh-9rem)] min-h-[680px] w-full border-0"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import AppLayout from '@/components/layout/AppLayout.vue'
</script>
