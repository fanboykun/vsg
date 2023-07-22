<script>
// @ts-nocheck
    import Login from "./Login.svelte";
    import { writable } from "svelte/store";
    import { db, username, user } from "./user";
    import { onMount } from "svelte";
    import { SEA } from "gun";
    import { v4 as uuidv4} from 'uuid';
    import { convertAsciiToText, convertTextToAscii } from "./text";
    import { rsa, encryptMessageWithPublicKey, decryptMessageWithPrivateKey } from "./rsa";
    import { arrToObj, objToArr } from "./formatter";

    let conversations = writable([])
    let alias = ''
    let searchedUser = ''
    let selectedUser
    let conversationRef = db.get('conversations')
    let chatWith = writable([])
    let newMessage = ''
    let conversationSelected = writable(false)
    let pair

    onMount(async() => {
        pair = await db.user()._.sea
        if(await user.is){
            await setRsa()
            conversationRef.map().once(async(data, key) => {
                await checkConversation(key)
            })
        }
    })

    async function setRsa(){
        let pair = await db.user()._.sea
        let rsaSet = []
        await db.get(pair.pub).get('rsa').map().once(async(data,key) => {
            if(data){
                if(key == 'publicKey'){
                    rsaSet[key] = {e: data.e, n: data.n}
                }else if(key == 'privateKey'){
                    rsaSet[key] = {d: data.d, n: data.n}
                }
            }else{
                console.log('no rsa key found')
            }
        })
        rsa.set(rsaSet)
        user.is.rsa = $rsa
    }

    async function checkConversation(id){
        conversationRef.get(id).once(async(d, k) => {
            if(d != undefined){
                let parsedValue = JSON.parse(d.members)
                d.members = parsedValue
                if(d.members.creator.pub === pair.pub || d.members.member.pub === pair.pub){
                    listConversation(d, id)
                }
            }
        })
    }

    function listConversation(data, key){
        if(data != null && key != null){
            let creator = data.members.creator
            let member =  data.members.member
            let list = {
                key: key,
                created_at: data.created_at,
                updated_at: data.updated_at,
                members: {
                    sender: {
                        alias: $username,
                        n: pair.n,
                        e: pair.e,
                        pub: pair.pub,
                        epub: pair.epub
                    },
                    receiver: {
                        alias: '',
                        n: '',
                        e: '',
                        pub: '',
                        epub: ''
                    }
                }
            }
            if(creator.pub === pair.pub){
                list.members.receiver = member
            }else if(member.pub === pair.pub){
                list.members.receiver = creator
            }
            conversations.set([...$conversations, list].sort((a, b) => b.updated_at.localeCompare(a.updated_at)))
        }
    }

    async function startNewConversation(){
        const check = await isAlreadyHaveConversation()
        if(check){
            console.log('conversation already exist')
        }else{
            let now = new Date().toISOString()
            let creator = {pub: pair.pub, e: $rsa.publicKey.e, n: $rsa.publicKey.n, alias: $username, epub: pair.epub}
            let member = {pub: selectedUser.pub, e: selectedUser.publicKey.e, n: selectedUser.publicKey.n, alias: selectedUser.alias, epub: selectedUser.epub}
            let id = uuidv4()
            let membersOfConv = {
                    creator, member
                }
            let str = JSON.stringify(membersOfConv)
            conversationRef.get(id).get('members').put(str, (ack,err) => {
                if(ack.err){
                    console.log(ack.err)
                }else{
                    console.log('Conversation Created!')
                }
            }).back().get('created_at').put(now).back().get('updated_at').put(now)
        }
    }

    async function findUser(){
        let formatedAlias = `@${alias}`
        // @ts-ignore
        db.user(formatedAlias).map().once(async(data) => {
            if(data){
                console.log(`user with alias ${alias} found!`)
                searchedUser = data.alias;
                selectedUser = data
                db.get(data.pub).get('rsa').get('publicKey').on(async(v,k) => {
                    if(v){
                        selectedUser.publicKey = {e: v.e, n: v.n}
                    }else{
                        console.log('no public key found')
                    }
                })
            }else{
                // alert(`user with alias ${alias} not found!`)
                console.log(`user with alias ${alias} not found!`)
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

    async function isAlreadyHaveConversation(){
        conversationRef.map().once(async(data, key) => {
            conversationRef.get(key).get('members').once(async(d) => {
                if(d){
                    let parsed = JSON.parse(d)
                    if((parsed.creator.pub === pair.pub || parsed.member.pub === pair.pub) && (parsed.creator.pub === selectedUser.pub || parsed.member.pub === selectedUser.pub)){
                       console.log('conversation already exist')
                       return true
                    }else{
                        console.log('conversation not exist')
                        return false
                    }
                }
            })
        })
    }

    async function fetchMessages(){
        conversationRef.get($chatWith.key).get('messages').map().on(async(data, key) => {
            if(data){
                let receiverEpub = $chatWith.members.receiver.epub
                let secretData = await SEA.secret(receiverEpub, pair); //secret key for database
                let decrypted =  await SEA.decrypt(data, secretData); // decription for database
                if(decrypted != null){ // begin rsa decription
                    let objMsg = JSON.parse(decrypted.body)
                    if(decrypted.from == $username && decrypted.to == $chatWith.members.receiver.alias){
                        decrypted.body = objMsg.toLocal
                    }else if(decrypted.from == $chatWith.members.receiver.alias && decrypted.to == $username){
                        decrypted.body = objMsg.toSend
                    }
                    let arr = objToArr(decrypted.body)
                    let rsaDec = decryptMessageWithPrivateKey(arr, user.is.rsa.privateKey)
                    let ascii = convertAsciiToText(rsaDec)
                    decrypted.body = ascii // end of rsa decription
                    // this line below might be buggy on should be improved
                    chatWith.set({...$chatWith, messages: [...$chatWith.messages, decrypted].filter((message, index) => index != message).sort((a, b) => a.when - b.when)})
                }
            }else{
                console.log('No Chat Yet In This Conversation')
            }
        }).off()
    }

    async function sendMessage(){
        if(newMessage == ''){
            console.log('message cannot be empty')
            return
        }
        let ascii = convertTextToAscii(newMessage) // begin rsa encryption
        let toSend = arrToObj(encryptMessageWithPublicKey(ascii, {e: $chatWith.members.receiver.e, n: $chatWith.members.receiver.n}))
        let toLocal = arrToObj(encryptMessageWithPublicKey(ascii, user.is.rsa.publicKey))
        let strMsg = JSON.stringify({toSend : toSend, toLocal : toLocal}) // end rsa encryption
        let date = new Date().toISOString()
        let messageToSend = {
            body: strMsg,
            from: $username,
            to: $chatWith?.members?.receiver?.alias,
            when: date
        }
        let secretKey = await SEA.secret($chatWith?.members?.receiver?.epub, pair); // begin database secret key
        let encrypted = await SEA.encrypt(messageToSend, secretKey); // end database secret key
        conversationRef.get($chatWith.key).get('messages').get(date).put(encrypted, (ack,err) => {
            if(ack.err){
                console.log(ack.err)
            }else{
                console.log('Message sent')
                newMessage = ''
            }
        }).back(2).get('updated_at').put(date, (ack,err) => {
            if(ack.err){
                console.log(ack.err)
            }else{
                console.log('updated_at updated')
                conversations.update((val) => {
                    return val.map((conversation, index) => {
                        if(conversation.key == $chatWith.key){
                            conversation.updated_at = date
                        }
                        return conversation
                    })
                })
            }
        })
    }

    function showInfo(){
        console.log(`This Is Your Information, Please Use It Wisely`,user.is)
    }

    async function clearConversation(){
        let pair = db.user()._.sea
        conversationRef.map().once(async(data, key) => {
            conversationRef.get(key).put(null, ack => {
                if(ack.err){
                    console.log(ack.err)
                }else{
                    console.log('Conversation Cleared')
                }
            })
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
    <button on:click={clearConversation}>Clear Conversation</button>
    <button on:click={showInfo}>Console Your Information</button>
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
                {#each $conversations as $conversation, index}
                    {#if $conversation.key == $chatWith.key}
                        <li><button>{`conversation of ${$conversation.members.sender.alias} and ${$conversation.members.receiver.alias}`}</button></li>
                    {:else}
                    <li><button on:click={()=> startWithThisConversation($conversation)}>{`conversation of ${$conversation.members.sender.alias} and ${$conversation.members.receiver.alias}`}</button></li>
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