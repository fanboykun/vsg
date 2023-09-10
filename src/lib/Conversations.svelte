<script>
    // @ts-nocheck
    import { writable } from "svelte/store";
    import { db, username, user, isLoggedIn, loggedInUser } from "./utils/user";
    import { onMount } from "svelte";
    import { SEA } from "gun";
    import { convertAsciiToText, convertTextToAscii } from "./utils/text";
    import { encryptMessageWithPublicKey, decryptMessageWithPrivateKey, rsa } from "./utils/rsa";
    import { arrToObj, objToArr } from "./utils/formatter";
    import Message from "./components/Message.svelte";
    import MessageHeader from "./components/MessageHeader.svelte";

    let conversations = writable([])
    let alias = ''
    let searchedUser = ''
    let fetchingUserStatus = ''
    let selectedUser
    let conversationRef = db.get('conversations')
    let chatWith = writable([])
    let newMessage = ''
    let conversationSelected = writable(false)
    let viewInfo = false
    let open = { status: false, where: ''}
    let scrollBottom

    onMount(async() => {
        if($username){
            let pair = db.user()._.sea
            loggedInUser.update(v => {
                v.priv = pair.priv
                v.epriv = pair.epriv
                return v
            })
            await fetchConversations()
        }else{isLoggedIn.set(false)}
    })

    function autoScroll() {
        setTimeout(() => scrollBottom?.scrollIntoView({ behavior: 'auto' }), 50);
    }
  
    async function fetchConversations(){
        conversationRef.map().once((data, key) => {
            if(!key.includes($loggedInUser.pub)) return
            try{
                let parsedMemberValue = JSON.parse(data.members);
                data.members = parsedMemberValue
                listConversation(data, key)
            }catch(e){
               return 
            }
        })
    }
  
    function listConversation(data, key){
        if(data == undefined) return
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
                        n: user.is.rsa.publicKey.n,
                        e: user.is.rsa.publicKey.e,
                        pub: $loggedInUser.pub,
                        epub: $loggedInUser.epub
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
            if(creator.pub === user.is.pub){
                list.members.receiver = member
            }else if(member.pub === user.is.pub){
                list.members.receiver = creator
            }
            conversations.set([...$conversations, list].sort((a, b) => b.updated_at.localeCompare(a.updated_at)))
        }
    }
  
    async function startNewConversation(){
        const check = isAlreadyHaveConversation()
        if(check){
            console.log('conversation already exist')
        }else{
            let now = new Date().toISOString()
            let creator = {pub: $loggedInUser.pub, e: $loggedInUser.rsa.publicKey.e, n: $loggedInUser.rsa.publicKey.n, alias: $username, epub: $loggedInUser.epub}
            let member = {pub: selectedUser.pub, e: selectedUser.publicKey.e, n: selectedUser.publicKey.n, alias: selectedUser.alias, epub: selectedUser.epub}
            let id = creator.pub + '|||' + member.pub
            let membersOfConv = {
                    creator, member
                }
            let str = JSON.stringify(membersOfConv)
            conversationRef.get(id).get('members').put(str, (ack) => {
                if(ack.err){
                    console.log(ack.err)
                }
            }).back().get('created_at').put(now).back().get('updated_at').put(now)
            openDialog('center')
        }
    }
  
    async function findUser(){
      if(alias == '') return
        let formatedAlias = `@${alias}`
        // @ts-ignore
        fetchingUserStatus = 'fetching'
        db.user(formatedAlias).map().on((data) => {
            if(data){
                console.log(`user with alias ${alias} found!`)
                db.get(data.pub).get('rsa').get('publicKey').on((v,k) => {
                    if(v){
                        selectedUser.publicKey = {e: v.e, n: v.n}
                        fetchingUserStatus = 'fetched'
                    }else{
                        fetchingUserStatus = 'error'
                        console.log('no public key found')
                    }
                })
                searchedUser = data.alias;
                selectedUser = data
            }else{
                fetchingUserStatus = 'error'
                // alert(`user with alias ${alias} not found!`)
                console.log(`user with alias ${alias} not found!`)
            }
        })
    }
  
    function startWithThisConversation(conversation){
        chatWith.set([])
        chatWith.messages = []
        conversation.messages = []
        chatWith.set(conversation)
        conversationSelected.set(true)
        rsa.set([])
        fetchMessages()
    }
  
    function isAlreadyHaveConversation(){
      conversationRef.map().once((data, key) => {
          if(key.includes(user.is.pub) && key.includes(selectedUser.pub)){
              return true
          }else{
              return false
          }
      })
    }
  
    async function fetchMessages(){
        conversationRef.get($chatWith.key).get('messages').map().on(async(data, key) => {
            if(data){
                let receiverEpub = $chatWith.members.receiver.epub
                let secretData = await SEA.secret(receiverEpub, $loggedInUser); //secret key for database
                let decrypted =  await SEA.decrypt(data, secretData); // decription for database
                if(decrypted != null || decrypted != undefined){ // begin rsa decription
                    let objMsg = JSON.parse(decrypted.body)
                    if(decrypted.from == $username && decrypted.to == $chatWith.members.receiver.alias){
                        decrypted.body = objMsg.toLocal
                    }else if(decrypted.from == $chatWith.members.receiver.alias && decrypted.to == $username){
                        decrypted.body = objMsg.toSend
                        let toProve = {
                            sender : decrypted.from,
                            cyphertext : objToArr(objMsg.toSend),
                            plaintext : decryptMessageWithPrivateKey(objToArr(objMsg.toSend), $loggedInUser.rsa.privateKey),
                            text : convertAsciiToText(decryptMessageWithPrivateKey(objToArr(objMsg.toSend), $loggedInUser.rsa.privateKey))
                        }
                        rsa.set([...$rsa, toProve])
                    }
                    let arr = objToArr(decrypted.body)
                    let rsaDec = decryptMessageWithPrivateKey(arr, $loggedInUser.rsa.privateKey)
                    let ascii = convertAsciiToText(rsaDec)
                    decrypted.body = ascii // end of rsa decription
                    if(checkDuplicateMessage(decrypted)) return
                    chatWith.set({...$chatWith, messages: [...$chatWith.messages, decrypted].sort((a, b) => a.when - b.when)})
                    autoScroll()
                }
            }else{
                console.log('No Chat Yet In This Conversation')
            }
        }).off()
    }

    function checkDuplicateMessage(message){
        let check = false
        $chatWith.messages.forEach(msg => {
            if(msg.when == message.when){
                check = true
            }
        })
        return check
    }
  
    async function sendMessage(){
        if(newMessage == ''){
            console.log('message cannot be empty')
            return
        }
        let ascii = convertTextToAscii(newMessage) // begin rsa encryption
        let toSend = arrToObj(encryptMessageWithPublicKey(ascii, {e: $chatWith.members.receiver.e, n: $chatWith.members.receiver.n}))
        let toLocal = arrToObj(encryptMessageWithPublicKey(ascii, $loggedInUser.rsa.publicKey))
        let strMsg = JSON.stringify({toSend : toSend, toLocal : toLocal}) // end rsa encryption
        let date = new Date().toISOString()
        let messageToSend = {
            body: strMsg,
            from: $username,
            to: $chatWith.members.receiver.alias,
            when: date
        }
        let secretKey = await SEA.secret($chatWith.members.receiver.epub, $loggedInUser);
        let encrypted = await SEA.encrypt(messageToSend, secretKey);
        newMessage = ''
        conversationRef.get($chatWith.key).get('messages').get(date).put(encrypted, (ack) => {
            if(ack.err){
                console.log(ack.err)
            }else{
                conversationRef.get($chatWith.key).get('updated_at').put(date)
                autoScroll()
            }
        })
    }
  
    function showInfo(){
    //   console.log(`This Is Your Information, Please Use It Wisely`,user.is)
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
            }).back(1).put(null)
        })
    }
  
    function signout() {
      conversations.set([])
      chatWith.set([])
      conversationSelected.set(false)
      openDialog('left')
      user.leave();
      username.set('');
      loggedInUser.set({pub: '', priv: '', epub: '', epriv: '', rsa: {publicKey: {e: '', n: ''}, privateKey: {d: '', n: ''}}})
      isLoggedIn.set(false);
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
  
    <div class="flex flex-auto">
      <!-- sidebar -->
        <div class="flex flex-col w-64 h-[100vh] max-h-screen overflow-y-auto scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch gap-y-2 bg-white shadow-lg shadow-gray-400 text-teal-500 font-semibold text-lg">
          <div class="flex flex-row h-[10vh] px-2 py-2.5 bg-white">
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
                  <div class="flex flex-row py-2 mx-2 px-2 rounded-xl bg-gray-600 hover:text-teal-200 font-sans hover:bg-slate-900 hover:shadow-md hover:shadow-cyan-500/40 border-teal-200/50 font-medium text-base text-gray-200">
                      <img src="{`https://ui-avatars.com/api/?name=${conversation.members.receiver.alias}`}" alt="" class="w-8 h-8 rounded-full border-2 border-teal-200">
                      <span class="ml-2 mt-1">{conversation.members.receiver.alias}</span>
                  </div>
                  {:else}
                  <!-- svelte-ignore a11y-click-events-have-key-events -->
                  <div on:click={()=> startWithThisConversation(conversation)} class="flex flex-row py-2 mx-2 px-2 rounded-xl bg-gray-200 hover:text-teal-200 font-sans hover:bg-slate-900 hover:shadow-md hover:shadow-cyan-500/40 border-teal-200/50 font-medium text-base text-teal-700">
                      <img src="{`https://ui-avatars.com/api/?name=${conversation.members.receiver.alias}`}" alt="" class="w-8 h-8 rounded-full border-2 border-teal-200">
                      <span class="ml-2 mt-1">{conversation.members.receiver.alias}</span>
                  </div>
              {/if}
          {/each}
        </div>
      <!-- main -->
        <div class="flex-1 h-screen bg-gray-200">
          <!-- header -->
          <div class="relative flex justify-end items-center bg-white w-full h-[10vh] drop-shadow-lg">
              <!-- svelte-ignore a11y-click-events-have-key-events -->
              <img src="https://ui-avatars.com/api/?name={$username}" alt="" class="rounded-full mr-3 h-10 w-10 place-content-center hover:cursor-pointer bg-center border-2 border-teal-200 hover:drop-shadow-md" on:click={() => openDialog('left')}>
          </div>
          <!-- left dialog -->
          {#if open.status && open.where == 'left'}
              <div class="absolute right-2 p-4 shadow-lg shadow-teal-400 flex w-72 -mt-2 z-50 h-auto bg-gray-500 rounded-lg">
                  <div class="flex-col text-white font-serif font-normal text-sm">
                      <span class="flex flex-row w-full border-b-2 border-teal-600 mb-2 text-base">{$username}</span>
                      <div class="flex-inline border-b-2 border-teal-600 pb-2">
                          <button class=" p-2 drop-shadow-md border-2 hover:bg-teal-700 border-teal-600 rounded-xl" on:click={signout}>Logout</button>
                          <!-- <button class=" p-2 drop-shadow-md border-2 hover:bg-teal-700 border-teal-600 rounded-xl" on:click={clearConversation}>Clear Conversation Data</button> -->
                          <button class=" p-2 drop-shadow-md border-2 hover:bg-teal-700 border-teal-600 rounded-xl mt-2" on:click={showInfo}>View Info</button>
                      </div>
                      {#if viewInfo}
                      <div class="flex-inline py-2 text-base font-normal font-mono leading-8">
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
              <div class="fixed top-[15%] left-[40%] h-72 p-4 shadow-lg shadow-teal-400 flex w-72 z-50 bg-gray-500 rounded-lg ">
                  <div class="relative flex-col text-white font-serif font-normal text-sm">
                      <button on:click={() => openDialog('center')} class="flex flex-row w-full border-b-2 border-teal-600 mb-2 text-base items-start justify-between">
                          <span class="ml-2 mt-1">Search User</span>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 mb-1 hover:text-red-500">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                      </button>
                      <div class="flex-inline">
                          <input type="text" bind:value={alias} class=" min-w-full bg-gray-200 rounded-xl px-2 py-2 focus:ring-2 focus:ring-teal-400 text-black placeholder:text-gray-400" placeholder="input the recepient username">
                          <button class=" p-2 drop-shadow-md border-2 hover:bg-teal-700 focus:bg-teal-700 border-teal-600 rounded-xl mt-2" on:click={findUser}>Search</button>
                      </div>
                      {#if fetchingUserStatus == 'fetched' && fetchingUserStatus != ''}
                          <div class="mt-2 w-full h-auto p-2 flex-0 items-center justify-center border-y-2">
                              <div class="grid grid-cols-3 items-center justify-between">
                                  <span class="flex text-base font-normal text-white p-2 justify-start col-span-2">{`'${searchedUser}' found!`}</span>
                                  <button on:click={startNewConversation} class="flex m-2 p-2 rounded-xl justify-self-center bg-teal-700 shadow-md shadow-teal-500/50 hover:shadow-teal-500/80">Start Conversation</button>
                              </div>
                          </div>
                        {:else}
                        <div class="mt-2 w-full h-auto p-2 flex-0 items-center justify-center border-y-2">
                            <div class="grid grid-cols-3 items-center justify-between">
                                <span class="flex text-base font-normal text-white p-2 justify-start col-span-2">{fetchingUserStatus}</span>
                            </div>
                        </div>
                      {/if}
                  </div>
              </div>
          {/if}
          {#if $conversationSelected}
          <!-- message box -->
          <div class="p-2 justify-between flex h-[80vh] flex-col w-full bg-gray-200">
              <div class="flex sm:items-center justify-center px-2 py-2 rounded-xl border-b-2 bg-white border-teal-200/70">
                  <!-- message header -->
                  <MessageHeader {chatWith}/>
              </div>
              <!-- messages list -->
              <div id="messages" class="flex flex-col space-y-4 p-3 overflow-y-auto scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch">
                  {#each $chatWith.messages as message (message.when)}
                      <Message {message}/>
                  {/each}
                  <div class="bg-black w-16 block" bind:this={scrollBottom}></div>
              </div>
          </div>
          <!-- message input -->
          <div class="relative border-t-2 bg-gray-200 border-teal-200/50 px-4 pt-2 sm:mb-0 items-center h-auto py-2">
              <div class="relative flex">
                  <input type="text" focus placeholder="Write your message!" bind:value={newMessage} class="w-full focus:outline-none focus:placeholder-gray-400 text-gray-800 placeholder-gray-600 pl-6 bg-white rounded-md py-3">
                  <div class="absolute right-0 items-center inset-y-0">
                      <button type="button" on:click={() => sendMessage()} class="inline-flex items-center justify-center rounded-lg px-2 -mr-0.5 py-3 transition duration-500 ease-in-out text-white bg-teal-500 hover:bg-teal-400 focus:ring-teal-400 focus:bg-teal-600">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-6 w-6 ml-2 transform rotate-90">
                          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                          </svg>
                      </button>
                  </div>
              </div>
          </div>
          {:else}
          <div class="p-2 justify-center h-[80vh] flex w-full bg-gray-200">
              <div id="nomessages" class="grid grid-cols-1 space-y-4 p-3 ">
                  <div class="flex w-full h-fit font-mono items-center justify-center text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-500 to-violet-500">
                      <h1> Welcome To Decentralized Chat App. </h1>
                  </div>
                  <div class=" font-mono items-center justify-center text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-500 to-violet-500">
                      <h1> Coded With Vite + Gun + Svelte </h1>
                  </div>
                  <div class="flex font-mono items-center justify-center text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-500 to-violet-500">
                      <span>Built With</span> 
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 text-red-600 mx-2">
                          <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                      </svg>
                      <span class=" underline-offset-1">By <a href="https://github.com/fanboykun">Irfan Ramadhan</a></span>
                  </div>
              </div>
          </div>
          {/if}
        </div>
    </div>
  
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
  