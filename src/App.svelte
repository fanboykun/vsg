<script>
  import svelteLogo from './assets/svelte.svg'
  import viteLogo from '/vite.svg'
  import Counter from './lib/Counter.svelte'
  import Header from './lib/Header.svelte';
  import Chat from './lib/Chat.svelte';
  // import Login from './lib/Login.svelte';
  import Messaging from './lib/Messaging.svelte';
  import People from './lib/People.svelte';
  import Conversation from './lib/Conversation.svelte';
  let state = 'private'
</script>

<main>
  <!-- <div>
    <a href="https://vitejs.dev" target="_blank" rel="noreferrer">
      <img src={viteLogo} class="logo" alt="Vite Logo" />
    </a>
    <a href="https://svelte.dev" target="_blank" rel="noreferrer">
      <img src={svelteLogo} class="logo svelte" alt="Svelte Logo" />
    </a>
  </div>
  <h3>Vite + Svelte + Gun</h3> -->

  <div class="card">
    <!-- <Counter /> -->
    <div>
      <button on:click={() => state = 'public'}>Public</button>
      <button on:click={() => state = 'private'}>Private</button>
    </div>
    <p>current state is {state}</p>
    {#if state == 'private'}
      <!-- <People /> -->
      <Conversation />
    {:else}
      <Messaging />
    {/if}
</div>

<!-- <Header />
<Chat /> -->

</main>

<style scoped>
  .logo {
    height: 3em;
    padding: 1em;
    will-change: filter;
    transition: filter 300ms;
  }
  .logo:hover {
    filter: drop-shadow(0 0 2em #646cffaa);
  }
  .logo.svelte:hover {
    filter: drop-shadow(0 0 2em #ff3e00aa);
  }
</style>
