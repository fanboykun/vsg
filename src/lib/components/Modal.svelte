<script>
    import {createEventDispatcher, onMount} from "svelte";
    import { rsa } from "../utils/rsa";
    import { objToArr } from "../utils/formatter";
    import { username, loggedInUser } from "../utils/user";
    let dispatch = createEventDispatcher();
    let data;
    let fetching = true;
    rsa.subscribe((val) => {
        data = val
    });
    function hKey(e){
        dispatch("modalHide");
    }
   onMount(() => {
        setTimeout(() => {
            fetching = false;
        }, 1000);
    });
</script>
  
  <!-- Main modal -->
<div class="fixed inset-0 backdrop-blur-sm z-50  w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-[calc(100%-1rem)] max-h-full flex items-center justify-center">
    <div class="relative w-full max-w-2xl max-h-full shadow-2xl shadow-teal-300/50">
        <!-- Modal content -->
        <div class="relative bg-white rounded-lg shadow">
            <!-- Modal header -->
            <div class="flex items-start justify-between p-4 border-b rounded-t">
                <h3 class="text-xl font-semibold text-gray-900">
                    RSA Proof Of Work (pesan yang diterima {$username} dari {$rsa[0].sender})
                </h3>
                <button on:click={hKey} type="button" class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center">
                    <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                    </svg>
                    <span class="sr-only">Close modal</span>
                </button>
            </div>
            <!-- Modal body -->
            <div class="relative overflow-x-auto max-h-60">
                {#if !fetching}
                <table class="w-full text-sm text-left text-gray-500 table-fixed">
                    <thead class="text-xs text-gray-700 uppercase bg-gray-50 w-auto">
                        <tr class="min-w-full">
                            <th scope="col" class="px-6 py-3 w-1/5">
                                RSA Key
                            </th>
                            <th scope="col" class="px-6 py-3">
                                Cypher Text
                            </th>
                            <th scope="col" class="px-6 py-3">
                                Plain Text (ASCII)
                            </th>
                            <th scope="col" class="px-6 py-3">
                                Plain Text (Text)
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each data as rsa}
                            <tr class="bg-white border-b">
                                <td class="px-6 py-4">
                                    n : {$loggedInUser.rsa.publicKey.n}<br>
                                    e : {$loggedInUser.rsa.publicKey.e}<br>
                                    d : {$loggedInUser.rsa.privateKey.d}
                                </td>
                                <td class="px-6 py-4">
                                    <p class="break-words">
                                        {objToArr(rsa.cyphertext)}
                                    </p>
                                </td>
                                <td class="px-6 py-4">
                                    <p class="break-words">
                                        {rsa.plaintext}
                                    </p>
                                </td>
                                <td class="px-6 py-4">
                                    <p class="break-words">
                                        {rsa.text}
                                    </p>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
                {:else}
                <div class="flex items-center justify-center w-full h-full">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-12 h-12 animate-spin text-teal-700 drop-shadow-sm">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                    </svg>                                          
                </div>
                {/if}
            </div>
            <!-- Modal footer -->
            <div class="flex items-center justify-end p-6 space-x-2 border-t border-gray-200 rounded-b">
                <button on:click={hKey} type="button" class="text-white bg-teal-700 hover:bg-teal-800 focus:ring-4 focus:outline-none focus:ring-teal-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center">Okay</button>
            </div>
        </div>
    </div>
</div>
  
