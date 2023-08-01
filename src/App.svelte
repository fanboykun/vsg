<script>
  // @ts-nocheck
    import Login from "./lib/Login.svelte";
    import Conversations from "./lib/Conversations.svelte";
    import { isLoggedIn } from "./lib/utils/user";
    let loggedInUser = null;

</script>

<main>
  <!-- component -->
  {#if $isLoggedIn}
    <Conversations />
  {:else}
    <Login/>
  {/if}
</main>
