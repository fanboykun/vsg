<script>
// @ts-nocheck

    import Login from "./Login.svelte";
    import { writable } from "svelte/store";
    import { db, username, user } from "./user";
    import { onMount } from "svelte";
    import { SEA } from "gun";
    import {v4 as uuidv4} from 'uuid';
    
    let conversations = writable([])
    let alias = ''
    let searchedUser = ''
    let selectedUser
    let conversationRef = db.get('conversations')
    let chatWith = writable([])
    let newMessage = ''
    let conversationSelected = writable(false)


    onMount(async() => {
        if(user.is){
            conversationRef.map().once(async(data, key) => {
                await checkConversation(key)
            })
        }
    })

    async function checkConversation(id = ''){
        conversationRef.get(id).get('members').once(async(data) => {
            return await listConversation(data, id)
        })
    }

    async function listConversation(data, key){
        let pair = db.user()._.sea
        let isCreator = data.creator == pair.pub
        let isMember = data.member == pair.pub
        if(isCreator || isMember){
            let list = {
                key: key,
                members: {
                    sender: {
                        alias: $username,
                        pub: pair.pub,
                        epub: pair.epub
                    },
                    receiver: {
                        alias: '',
                        pub: '',
                        epub: ''
                    }
                }
            }
            if(data.creator == pair.pub){
            // @ts-ignore
                await db.user(data.member).once(async (data) => {
                let receiver = {
                        alias: data.alias,
                        pub: data.pub,
                        epub: data.epub
                    }
                list.members.receiver = receiver
                })
            }else if(data.member == pair.pub){
                // @ts-ignore
                await db.user(data.creator).once(async (data) => {
                let receiver = {
                        alias: data.alias,
                        pub: data.pub,
                        epub: data.epub
                    }
                list.members.receiver = receiver
                })
            }
            conversations.set([...$conversations, list])
            // chatWith.set([...$chatWith, list])
            // console.log(Object.values($chatWith))
        }
    }

    async function startNewConversation(){
        let pair = user._.sea
        let creator = pair.pub
        let member = selectedUser.pub
        let id = uuidv4()
        let membersOfConv = {
                creator, member
            }
        conversationRef.get(id).get('members').put(membersOfConv, (ack,err) => {
            if(ack.err){
                console.log(ack.err)
            }else{
                console.log('Conversation Created!')
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
                selectedUser = data
                // await checkConversation(data.alias)
            }else{
                // alert(`user with alias ${alias} not found!`)
                console.log('No user found')
            }
        })
    }

    async function startWithThisConversation(conversation){
        chatWith.set([])
        chatWith.messages = []
        conversation.messages = []
        chatWith.set(conversation)
        conversationSelected.set(true)
        await fetchMessages()
    }

    async function fetchMessages(){
        let messageToPush = []
        conversationRef.get($chatWith.key).get('messages').map().once(async(data, key) => {
            if(data){
                console.log(key)
                let pair = db.user()._.sea
                let receiverEpub = $chatWith.members.receiver.epub
                let secretData = await SEA.secret(receiverEpub, pair);
                let decrypted =  await SEA.decrypt(data, secretData);
                chatWith.set({...$chatWith, messages: [...$chatWith.messages, decrypted].filter((message) => message != undefined).sort((a, b) => a.when - b.when)})
            }else{
                console.log('No Chat Yet In This Conversation')
            }
            // console.log($chatWith.messages)
        }).off()
    }

    async function sendMessage(){
        let pair = db.user()._.sea
        let date = new Date().toISOString()
        let conversationId = $chatWith.key
        let receiverEpub = $chatWith?.members?.receiver?.epub
        let messageToSend = {
            body: newMessage,
            from: $username,
            to: $chatWith?.members?.receiver?.alias,
            when: date
        }
        let secretKey = await SEA.secret(receiverEpub, pair);
        let encrypted = await SEA.encrypt(messageToSend, secretKey);
        conversationRef.get(conversationId).get('messages').get(date).put(encrypted, (ack,err) => {
                if(ack.err){
                    console.log(ack.err)
                }else{
                    console.log('Message sent')
                    newMessage = ''
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
                <button on:click={startNewConversation}>start Conversation</button>
            </div>
        {/if}
        <div>
            <ul>
                {#each $conversations as conversation, index}
                {#if conversation.key == $chatWith.key}
                    <li><button>{`conversation of ${conversation.members.sender.alias} and ${conversation.members.receiver.alias}`}</button></li>
                {:else}
                    <li><button on:click={()=> startWithThisConversation(conversation)}>{`conversation of ${conversation.members.sender.alias} and ${conversation.members.receiver.alias}`}</button></li>
                {/if}
                {/each}
            </ul>
        </div>
        <div>
            {#if $conversationSelected}
                <h3>{`chat with ${$chatWith?.members.receiver?.alias}`}</h3>
                    {#each $chatWith.messages as message, index}
                        {#if message != undefined}
                            <p>{message?.from} : {message?.body}</p>
                        {/if}
                    {/each}
                <div>
                    <input type="text" bind:value={newMessage} placeholder="input new message here">
                    <button on:click={() => sendMessage()}>Send</button>
                </div>
            {/if}
        </div>
    </div>
    {:else}
        <Login />
    {/if}
</div>