<script lang="ts">
  import HomePage from './routes/HomePage.svelte';
  import { browserStorage } from './adapters/browser/local-storage';
</script>

<svelte:head>
  <meta name="theme-color" content="#f4fbff" />
</svelte:head>

<HomePage storage={browserStorage()} />
