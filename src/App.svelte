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

  onMount(async () => {
    if (import.meta.env.DEV) return;
    const isE2eWorker = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('e2e-sw') === '1';
    const testWorker = isE2eWorker ? `/e2e-sw-${sessionStorage.getItem('e2e-sw-ready') ? 'two' : 'one'}.js` : '/sw.js';
    if (isE2eWorker) sessionStorage.setItem('e2e-sw-ready', '1');
    updatePort = await registerBrowserServiceWorker(testWorker);
  });
</script>

<svelte:head>
  <meta name="theme-color" content="#f4fbff" />
</svelte:head>

{#if isQuizPage}
  <QuizPage storage={storage} navigation={browserNavigation} download={browserDownload} random={randomQuiz} />
  {:else}
  <HomePage storage={storage} navigation={browserNavigation} download={browserDownload} haptics={browserHaptics} />
{/if}

<UpdatePill updatePort={updatePort} />
