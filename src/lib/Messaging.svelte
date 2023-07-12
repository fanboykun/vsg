<script>
    import Login from "./Login.svelte";
    import { writable } from "svelte/store";
    import { db, username, user } from "./user";
    import { onMount } from "svelte";
    import { SEA } from "gun";
    
    let newMessage = ''
    let messages = writable([])
    let alias = ''
    let searchedUser = ''
    let selectedConversation
    // $: searchedUser != selectedConversation.alias ? messages.set([]) : ''
    let messageRef = db.get('messages')

    async function send(){
        let pair = db.user()._.sea
        let secretKey = await SEA.secret(selectedConversation.epub, pair);
        let date = new Date().toISOString()
        let messageToSend = {
            body: newMessage,
            from: $username,
            to: searchedUser,
            when: date,
        }
        let encrypted = await SEA.encrypt(messageToSend, secretKey);
        messageRef.get(date).put(encrypted, (ack,err) => {
                if(ack.err){
                    console.log(ack.err)
                }else{
                    console.log('Message sent')
                    newMessage = ''
                }
            })
    }

    async function checkConversation(user){
        if(selectedConversation){
            if(user == selectedConversation.alias){
               await fetchMessages()
            }else{
                messages.set([])
                await fetchMessages()
            }
        }
    }
    async function fetchMessages(){
        messageRef.map().once(async(data, key) => {
            if(data){
                if(selectedConversation){
                    let pair = db.user()._.sea
                    let secretData = await SEA.secret(selectedConversation.epub, pair);
                    let secret = await SEA.decrypt(data, secretData);
                    await messages.set([...$messages, secret])
                    // console.log(data)
                }
            }else{
                console.log('No messages')
            }
        })
    }

    async function findUser(){
        let formatedAlias = `@${alias}`
        // @ts-ignore
        db.user(formatedAlias).map().once(async(data) => {
            if(data){
                console.log(data)
                searchedUser = data.alias;
                selectedConversation = data
                await checkConversation(data.alias)
            }else{
                // alert(`user with alias ${alias} not found!`)
                console.log('No user found')
            }
        })
    }

    function signout() {
      user.leave();
      username.set('');
    }
</script>

<div>
    {#if $username}
    <h1>{$username == undefined ? 'wait...' : 'Logged in as '+$username}</h1>
    <button on:click={signout}>Logout</button>
    <div>
        <div>
            <input type="text" name="alias" bind:value={alias} id="alias">
            <button on:click={findUser}>Find</button>
        </div>
        {#if searchedUser != ''}
            <h1>Found user: {searchedUser}</h1>
            <div>
                <input type="text" name="message" bind:value={newMessage} id="message">
                <button on:click={send}>Send</button>
            </div>
        {/if}
        <ul>
            {#each $messages as $message, index}
                <li>{$message.from}: {$message.body} ({new Date($message.when)})</li>
            {/each}
        </ul>
    </div>
    {:else}
        <Login />
    {/if}
</div>