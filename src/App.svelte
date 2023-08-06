<script>
  // @ts-nocheck
  import { createEventDispatcher } from "svelte";
  import Login from "./lib/Login.svelte";
  import Conversations from "./lib/Conversations.svelte";
  import { isLoggedIn } from "./lib/utils/user";
  import Register from "./lib/Register.svelte";
  
  let dispatch = createEventDispatcher();
  function logged(e){
    dispatch('login', { user: e.detail.user });
    if(!$isLoggedIn) isLoggedIn.set(true)
  }
  let register = false
  function hSignedUp(e){
    register = e.detail.register
  }
</script>

<main>
  <!-- component -->
  {#if $isLoggedIn === true}
      <Conversations />
  {:else}
    {#if register}
    <Register on:login={logged} on:signin={hSignedUp}/>
    {:else}
    <Login on:login={logged} on:signup={hSignedUp}/>
    {/if}
  {/if}
</main>
