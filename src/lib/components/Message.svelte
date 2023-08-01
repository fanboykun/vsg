<script>
    import { username } from "../utils/user";
    export let message;

    function formatDate(date){
        let formattedDate = ''
        let hr = new Date(date).getHours()
        let min = new Date(date).getMinutes()
        let day = new Date(date).getDate()
        let month = new Date(date).getMonth()
        let year = new Date(date).getFullYear()
        return formattedDate = hr + ':' + (min < 9 ? '0' + min : min) + ' ' + day + '-' + month + '-' + year
    }
</script>
{#if message != undefined && message.from == $username}
    <!-- sender -->    
    <div class="chat-message">
        <div class="flex items-end justify-end">
            <div class="flex flex-col space-y-2 text-sm max-w-xs mx-2 order-1 items-end">
                <div>
                    <span class="px-4 py-2 rounded-lg inline-block rounded-br-none bg-teal-600 text-white ">{message?.body}</span>
                </div>
                <span class="mt-0.5 text-gray-600 ml-2 text-sm">{formatDate(message.when)}</span>
            </div>
        </div>
    </div>
{:else if message != undefined && message.from != $username}
    <!-- receiver -->
    <div class="chat-message">
        <div class="flex items-end">
            <div class="flex flex-col space-y-2 text-sm max-w-xs mx-2 order-2 items-start">
                <div>
                    <span class="px-4 py-2 rounded-lg inline-block rounded-bl-none bg-white text-gray-800">{message?.body}</span>
                </div>
                <span class="mt-0.5 text-gray-600 ml-2 text-sm">{new Date(message.when).getHours() + ':' + new Date(message.when).getMinutes() + ' ' + new Date(message.when).getDate() + '-' + new Date(message.when).getMonth() + '-' + new Date(message.when).getFullYear()}</span>
            </div>
        </div>
    </div>
{/if}