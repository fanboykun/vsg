<script>
// @ts-nocheck

    import { onMount } from "svelte";
    import Login from "../Login.svelte";
    import { db, user, username } from "../utils/user";
    import { writable } from "svelte/store";
    import "gun/sea";
    let searchedUser = '';
    let alias;
    let ff;
    let isLoggedIn = false
    let people = writable([])
    $: if($username){
        isLoggedIn = true;
    }
    let selectedChat = [];
    let isChatting = false;
    let loading = true;
    let newMessage;
    let secrets = '';


    onMount( async() => {
        let contactRef = db.get('contacts')
        contactRef.map().once(async(data) => {
            if(data){
                console.log(data)
                people.update(people => [...people, data])
                loading = false;
            }else{
                console.log('No contacts')
                loading = false;
            }
        })
        db.get('secret').map().on((data) => {
            console.log(data)
            secrets = data
            if(data){
                console.log(data)
                // let decrypted = await SEA.decrypt(data, secretData);
            }else{
                console.log('No messages')
            }
        })

    })
    // $: console.log(people.alias)
    async function findUser(){
        let formatedAlias = `@${alias}`
        // @ts-ignore
        db.user(formatedAlias).map().once((data) => {
            if(data){
                console.log(data)
                searchedUser = data.alias;
                ff = data
            }else{
                console.log('No user found')
            }
        })
    }

    async function addFriend(){
        let selectedPerson = ff;
        let pair = await db.user()._.sea
        let certificate = await SEA.certify(selectedPerson.pub, ["^chats.*"], pair, null)
        db.get('contacts').get(selectedPerson.pub).put(certificate, (ack, err) => {
            if(ack.err){
                console.log(ack.err)
                ff = ''
            }
            else{
                refetchContacts()
                console.log(ack)
                ff = ''
            }
        })
        console.log(certificate)
    }

    async function startChat(selectedPerson){
        let pair = await db.user()._.sea
        
        isChatting = true;
    }

    async function sendMessage(){
        
        // let certificate = await SEA.certify(selectedPerson.pub, [{"*": "inbox", "+": "*"}, {"*": "stories"}], pair, null, {expiry: Gun.state()+(60*60*24*1000)})
        // console.log('send message')
        // let key = await SEA.secret(selectedChat.epub, user.priv);
        // let enc = await SEA.encrypt(newMessage, key);
        // @ts-ignore
        // let index = new Date().toISOString();
        // let msgToSend = {
        //     sender: $username,
        //     receiver: selectedChat.alias,
        //     message: enc
        // }
        // let msgRef = user.get('messages').get(index).set(msgToSend, (ack, err) => {
        //     if(ack.err){
        //         console.log(ack.err)
        //     }
        //     else{
        //         console.log(ack)
        //         newMessage = ''
        //     }
        // })
        // // @ts-ignore
        // db.user().get('contacts').get(selectedChat.pub).put(msgRef, (ack, err) => {
        //     if(ack.err){
        //         console.log(ack.err)
        //     }
        //     else{
        //         console.log(ack)
        //     }
        // })
    }

    function fetchMessages(){
        // @ts-ignore
        // if(selectedChat.pub == undefined){
        //     return
        // }
        // @ts-ignore
        db.get('messages').map().once((data) => {
            if(data){
                console.log(data)
            }else{
                console.log('No messages')
            }
        })
    }

    function refetchContacts(){
        contactRef.map().once((data) => {
            if(data){
                console.log(data)
                people.update(people => [...people, data])
                loading = false;
            }else{
                console.log('No contacts')
                loading = false;
            }
        })
        return () => {
            contactRef.off()
        }
    }

    async function secret(){
        let pair = db.user()._.sea
        let receiver = ff
        console.log(receiver)
        let secretData = await SEA.secret(receiver.epub, pair);
        let encrypted = await SEA.encrypt('hello world', secretData);
        db.get('secret').get('message').put(encrypted, (ack, err) => {
            if(ack.err){
                console.log(ack.err)
            }
            else{
                console.log(ack)
            }
        })
    }

    async function decrypt(){
        let pair = db.user()._.sea
        let receiver = ff
        let secretData = await SEA.secret(receiver.epub, pair);
        secrets = await SEA.decrypt(secrets, secretData);
    }

    function signout() {
      user.leave();
      username.set('');
      isLoggedIn = false;
    }
</script>
{#if isLoggedIn}
<div>
    <h1>{$username == undefined ? 'wait...' : 'Logged in as '+$username}</h1>
    <button on:click={signout}>Out</button>
    <button on:click={secret}>Put Secret</button>
    <button on:click={decrypt}>Dec Secret</button>
    <div>
        <h1>Secrets</h1>
        <p>{secrets}</p>
    </div>
</div>
    <div>
        <label for="name">Find a user by username (alias)</label>
        <input type="text" name="name" id="name" bind:value={alias}>
        <button on:click={findUser}>Find</button>
        {#if searchedUser != ''}
        <div>
            <p>{searchedUser} found!</p>
            <button on:click={addFriend}>start</button>
        </div>
        {/if}
    </div>
    <div>
        {#if !loading}
            <h1>Contacts</h1>
            <ul>
                {#each $people as person}
                    <li>
                        <h3><button on:click={() => startChat(person)}>{person.alias}</button></h3>
                    </li>
                {/each}
            </ul>
        {:else}
            <h1>Loading...</h1>
        {/if}
    </div>
    <div>
        {#if isChatting}
        <h1>Chats with {selectedChat.alias}</h1>
        <div>
            <p>msg</p>
        </div>
        <div>
            <input type="text" name="newMessage" bind:value={newMessage}>
            <button on:click={sendMessage}>Send</button>
        </div>
        {/if}
    </div>
{:else}
<Login />
{/if}