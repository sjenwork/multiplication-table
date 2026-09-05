<script lang="ts">
  import { onMount } from 'svelte';
  import QuizPage from './routes/QuizPage.svelte';
  import HomePage from './routes/HomePage.svelte';
  import { browserNavigation } from './adapters/browser/browser-navigation';
  import { browserStorage } from './adapters/browser/local-storage';
  import { browserDownload } from './adapters/browser/csv-download';
  import { browserHaptics } from './adapters/browser/browser-haptics';
  import { registerBrowserServiceWorker } from './adapters/browser/service-worker-update';
  import UpdatePill from './components/UpdatePill.svelte';
  import type { PwaUpdatePort } from './ports';

  const storage = browserStorage();
  const isQuizPage = typeof window !== 'undefined' && window.location.pathname.endsWith('/quiz.html');
  const randomQuiz = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('random') === '1';
  let updatePort: PwaUpdatePort | null = null;

  onMount(async () => { updatePort = await registerBrowserServiceWorker(); });
</script>

<svelte:head>
  <meta name="theme-color" content="#f4fbff" />
</svelte:head>

{#if isQuizPage}
  <QuizPage storage={storage} navigation={browserNavigation} random={randomQuiz} />
{:else}
  <HomePage storage={storage} navigation={browserNavigation} download={browserDownload} haptics={browserHaptics} />
{/if}

<UpdatePill updatePort={updatePort} />
