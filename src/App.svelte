<script>
  // @ts-nocheck
  import Login from "./lib/Login.svelte";
  import { writable } from "svelte/store";
  import { db, username, user } from "./lib/user";
  import { onMount } from "svelte";
  import { SEA } from "gun";
  import { v4 as uuidv4} from 'uuid';
  import { convertAsciiToText, convertTextToAscii } from "./lib/text";
  import { rsa, encryptMessageWithPublicKey, decryptMessageWithPrivateKey } from "./lib/rsa";
  import { arrToObj, objToArr } from "./lib/formatter";

  let conversations = writable([])
  let alias = ''
  let searchedUser = ''
  let selectedUser
  let conversationRef = db.get('conversations')
  let chatWith = writable([])
  let newMessage = ''
  let conversationSelected = writable(false)
  let pair
  let viewInfo = false
  $: watchState = chatWith
  let open = {
    status: false,
    where: ''
  }
  
  onMount(async() => {
    pair = await db.user()._.sea
    if(user.is){
        await setRsa()
        conversationRef.map().once(async(data, key) => {
            await checkConversation(key)
        })
    }
  })

  async function setRsa(){
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
          openDialog('center')
      }
  }

  async function findUser(){
    if(alias == '') return
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
    viewInfo = !viewInfo
  }

  async function clearConversation(){
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

  function openDialog(where){
    if(where == 'left'){
      open.status = !open.status
      open.where = 'left'
      viewInfo = false
    }else{
        open.status = !open.status
        open.where = 'center'
        alias = ''
        searchedUser = ''
    }
  }
</script>

<main>
  <!-- component -->
  {#if $username && user}
  <div class="flex flex-auto">
    <!-- sidebar -->
      <div class="flex flex-col w-64 h-[100vh] max-h-screen overflow-y-auto scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch gap-y-2 bg-slate-900/95 text-teal-500 font-semibold text-lg">
        <div class="flex flex-row h-[10vh] px-2 py-2.5 bg-slate-900 ">
            <button on:click={() => openDialog('center')} class="rounded-lg font-mono px-2 py-3 bg-teal-700 hover:bg-teal-800 text-white text-sm flex">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>                      
               <span class="mt-0.5 ml-0.5"> Start New Conversation </span>
            </button>
        </div>
        <!-- conversation list -->
        {#each $conversations as conversation, index}
            {#if conversation.key == $chatWith.key}
                <div class="flex flex-row py-2 px-2 hover:text-teal-200 font-sans hover:bg-slate-900 hover:shadow-md hover:shadow-cyan-500/40 border-teal-200/50 font-medium text-base text-gray-200">
                    <img src="{`https://ui-avatars.com/api/?name=${conversation.members.receiver.alias}`}" alt="" class="w-8 h-8 rounded-full border-2 border-teal-200">
                    <span class="ml-2 mt-1">{conversation.members.receiver.alias}</span>
                </div>
                {:else}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <div on:click={()=> startWithThisConversation(conversation)} class="flex flex-row py-2 px-2 hover:text-teal-200 font-sans hover:bg-slate-900 hover:shadow-md hover:shadow-cyan-500/40 border-teal-200/50 font-medium text-base text-gray-200">
                    <img src="{`https://ui-avatars.com/api/?name=${conversation.members.receiver.alias}`}" alt="" class="w-8 h-8 rounded-full border-2 border-teal-200">
                    <span class="ml-2 mt-1">{conversation.members.receiver.alias}</span>
                </div>
            {/if}
        {/each}
      </div>
    <!-- main -->
      <div class="flex-1 h-screen bg-slate-800/80">
        <!-- header -->
        <div class="relative flex justify-end  items-end bg-slate-900 w-full h-[10vh] drop-shadow-lg">
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <div class="flex bg-white/5 mr-3 mb-2 h-6 w-6 p-6 rounded-full items-center hover:cursor-pointer border-2 border-teal-400 bg-[url(https://ui-avatars.com/api/?name={$username})] bg-center" on:click={() => openDialog('left')} />
        </div>
        <!-- left dialog -->
        {#if open.status && open.where == 'left'}
            <div class="absolute right-2 p-4 shadow-lg shadow-teal-400 flex w-72 -mt-2 z-50 h-auto bg-slate-700 rounded-lg">
                <div class="flex-col text-white font-serif font-normal text-sm">
                    <span class="flex flex-row w-full border-b-2 border-teal-600 mb-2 text-base">{$username}</span>
                    <div class="flex-inline border-b-2 border-teal-600 pb-2">
                        <button class=" p-2 drop-shadow-md border-2 hover:bg-teal-700 border-teal-600 rounded-xl" on:click={signout}>Logout</button>
                        <button class=" p-2 drop-shadow-md border-2 hover:bg-teal-700 border-teal-600 rounded-xl" on:click={clearConversation}>Clear Conversation Data</button>
                        <button class=" p-2 drop-shadow-md border-2 hover:bg-teal-700 border-teal-600 rounded-xl mt-2" on:click={showInfo}>View Info</button>
                    </div>
                    {#if viewInfo}
                    <div class="flex-inline py-2 text-base font-normal leading-8">
                        <span class="block text-lg font-bold">THIS IS YOUR RSA INFORMATION, PLEASE BE WISE WITH IT</span>
                        <span class="block">RSA Public Key : {user.is.rsa.publicKey.e}</span>
                        <span class="block">RSA Private Key : {user.is.rsa.privateKey.d}</span>
                        <span class="block">RSA Modulus : {user.is.rsa.publicKey.n}</span>
                    </div>
                    {/if}
                </div>
            </div>
        {/if}
        <!-- center dialog -->
        {#if open.status && open.where == 'center'}
            <div class="fixed top-[15%] left-[40%] h-72 p-4 shadow-lg shadow-teal-400 flex w-72 z-50 bg-slate-700 rounded-lg ">
                <div class="relative flex-col text-white font-serif font-normal text-sm">
                    <button on:click={() => openDialog('center')} class="flex flex-row w-full border-b-2 border-teal-600 mb-2 text-base items-start justify-between">
                        <span class="ml-2 mt-1">Search User</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 mb-1">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>
                    <div class="flex-inline">
                        <input type="text" bind:value={alias} class=" min-w-full bg-gray-200 rounded-xl px-2 py-2 focus:ring-2 focus:ring-teal-400 text-black placeholder:text-gray-400" placeholder="input the recepient username">
                        <button class=" p-2 drop-shadow-md border-2 hover:bg-teal-700 focus:bg-teal-700 border-teal-600 rounded-xl mt-2" on:click={findUser}>Search</button>
                    </div>
                    {#if searchedUser != ''}
                        <div class="mt-2 w-full h-auto p-2 flex-0 items-center justify-center">
                            <span class="flex text-base font-semibold text-white p-2 justify-center">{`'${searchedUser}' found!`}</span>
                            <div class="flex items-center justify-center">
                                <button on:click={startNewConversation} class="flex p-2 rounded-xl justify-self-center bg-teal-700 shadow-md shadow-teal-500/50 hover:shadow-teal-500/80">Start Conversation</button>
                            </div>
                        </div>
                    {/if}
                </div>
            </div>
        {/if}
        {#if $conversationSelected}
        <!-- message box -->
        <div class="p:2 sm:p-6 justify-between flex h-[80vh] flex-col w-full">
            <div class="flex sm:items-center justify-center -mt-5 px-2 py-2 rounded-xl border-b-2 bg-slate-900/30 border-teal-200/70">
                <!-- message header -->
              <div class="relative flex items-center space-x-4">
                  <div class="flex flex-col leading-tight">
                      <span class="text-xl font-semibold text-gray-200">{`chat with ${$chatWith?.members.receiver?.alias}`}</span>
                  </div>
              </div>
            </div>
            <div id="messages" class="flex flex-col space-y-4 p-3 overflow-y-auto scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch">
                {#each $chatWith.messages as message, index}
                    {#if message != undefined && message.from == $username}
                             <!-- sender -->    
                        <div class="chat-message">
                            <div class="flex items-end justify-end">
                                <div class="flex flex-col space-y-2 text-sm max-w-xs mx-2 order-1 items-end">
                                    <div>
                                        <span class="px-4 py-2 rounded-lg inline-block rounded-br-none bg-teal-600 text-white ">{message?.body}</span>
                                    </div>
                                    <span class="mt-0.5 text-gray-400 ml-2 text-sm">{message.when}</span>
                                </div>
                            </div>
                        </div>
                    {:else if message != undefined && message.from != $username}
                        <!-- receiver -->
                        <div class="chat-message">
                            <div class="flex items-end">
                                <div class="flex flex-col space-y-2 text-sm max-w-xs mx-2 order-2 items-start">
                                    <div>
                                        <span class="px-4 py-2 rounded-lg inline-block rounded-bl-none bg-gray-300 text-gray-800">{message?.body}</span>
                                    </div>
                                    <span class="mt-0.5 text-gray-400 ml-2 text-sm">{message.when}</span>
                                </div>
                            </div>
                        </div>
                    {/if}
                {/each}
            </div>
        </div>
        <!-- message input -->
        <div class="relative border-t-2 border-teal-200/50 px-4 pt-2 mb-2 sm:mb-0">
            <div class="relative flex">
                <input type="text" autofocus placeholder="Write your message!" bind:value={newMessage} class="w-full focus:outline-none focus:placeholder-gray-400 text-gray-800 placeholder-gray-600 pl-6 bg-gray-200 rounded-md py-3">
                <div class="absolute right-0 items-center inset-y-0">
                    <button type="button" on:click={() => sendMessage()} class="inline-flex items-center justify-center rounded-lg px-2 -mr-0.5 py-3 transition duration-500 ease-in-out text-white bg-teal-500 hover:bg-teal-400 focus:ring-teal-400 focus:bg-teal-600">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-6 w-6 ml-2 transform rotate-90">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
        {/if}
      </div>
  </div>
  {:else}
    <Login />
  {/if}
</main>

<style>
    .scrollbar-w-2::-webkit-scrollbar {
      width: 0.25rem;
      height: 0.25rem;
    }
    
    .scrollbar-track-blue-lighter::-webkit-scrollbar-track {
      --bg-opacity: 1;
      background-color: #f7fafc;
      background-color: rgba(247, 250, 252, var(--bg-opacity));
    }
    
    .scrollbar-thumb-blue::-webkit-scrollbar-thumb {
      --bg-opacity: 1;
      background-color: #edf2f7;
      background-color: rgba(237, 242, 247, var(--bg-opacity));
    }
    
    .scrollbar-thumb-rounded::-webkit-scrollbar-thumb {
      border-radius: 0.25rem;
    }
</style>
