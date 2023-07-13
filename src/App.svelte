<script>
  import Messaging from './lib/Messaging.svelte';
  import Conversation from './lib/Conversation.svelte';
  import Rsa from './lib/Rsa.svelte';
  let state = 'rsa'
</script>

<main>
  <div class="card">
      <div>
        <button on:click={() => state = 'public'}>Public</button>
        <button on:click={() => state = 'private'}>Private</button>
        <button on:click={() => state = 'rsa'}>Rsa</button>
      </div>
      <p>current state is {state}</p>
      {#if state == 'private'}
        <Conversation />
      {:else if state == 'public'}
        <Messaging />
      {:else}
        <Rsa />
      {/if}
  </div>
</main>
