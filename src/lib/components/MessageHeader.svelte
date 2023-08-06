<script>
    import Modal from "./Modal.svelte";
    export let chatWith;
    let modalState = false
    function hModal(){
        modalState = !modalState
    }
</script>
<div class="relative flex items-center space-x-4">
    <div class="flex flex-col leading-tight">
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <span on:click={hModal} class="text-xl font-bold text-teal-700">chat with <span class=" underline underline-offset-2 cursor-pointer">{$chatWith?.members.receiver?.alias}</span></span>
    </div>
</div>
{#if modalState}
<Modal on:modalHide={hModal}/>
{/if}

