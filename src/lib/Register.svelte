<script>
  // @ts-nocheck
    import { db, user } from './utils/user';
    import { rsa, generateKeys, generateRandomTwoDigitPrimeNumbers } from "./utils/rsa";
    import { createEventDispatcher } from 'svelte';

    let username;
    let password;
    let dispatch = createEventDispatcher();

    function login(keyGen) {
      user.auth(username, password, ({ err }) => err && alert(err));
      if (keyGen){
        if(user.is){
          generateInfo(keyGen)
        }
      }
      dispatch('login', { user });
    }

    function generateInfo(keyGen){
      // db.on('auth', async () => {
        const pair = db.user()._.sea
        db.get(pair.pub).get('rsa').put(keyGen, (ack) => {
          if(ack.err){
            console.log(ack.err)
          }else{
            rsa.set(keyGen)
          }
        })
      // })
    }
  
    function signup() {
      user.create(username, password, ({ err }) => {
        if (err) {
          alert(err);
        } else {
          if(username == 'alice'){
            const keyGen = generateKeys(11, 13)
            login(keyGen);
          }else if(username == 'bob'){
            const keyGen = generateKeys(17, 23)
            login(keyGen);
          }else{
            const keyGen = generateKeys(generateRandomTwoDigitPrimeNumbers(), generateRandomTwoDigitPrimeNumbers())
            login(keyGen);
          }
        }
      });
    }

    function hLogin(){
      dispatch('signin', {register: false});
    }
  </script>

  <section class="bg-gray-50">
    <div class="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
        <span class="flex items-center text-2xl font-semibold text-gray-900">
            Decentralized Chat With
          </span>
          <span class="flex items-center mb-6 text-xl font-semibold text-gray-900">
            Vite + Gun + Svelte  
          </span>
        <div class="w-full bg-white rounded-lg shadow md:mt-0 sm:max-w-md xl:p-0">
            <div class="p-6 space-y-4 md:space-y-6 sm:p-8">
                <h1 class="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
                    Register a new account
                </h1>
                <div class="space-y-4 md:space-y-6" action="#">
                    <div>
                        <label for="username" class="block mb-2 text-sm font-medium text-gray-900">Your username</label>
                        <input type="text" name="username" bind:value={username} id="username" class="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-teal-600 focus:border-teal-600 block w-full p-2.5" placeholder="username" required="">
                    </div>
                    <div>
                        <label for="password" class="block mb-2 text-sm font-medium text-gray-900">Password</label>
                        <input type="password" name="password" bind:value={password} id="password" placeholder="••••••••" class="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-teal-600 focus:border-teal-600 block w-full p-2.5" required="">
                    </div>
                    <button type="submit" on:click={signup} class="w-full text-white bg-teal-600 hover:bg-teal-700 focus:ring-4 focus:outline-none focus:ring-teal-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center">Sign up</button>
                    <p class="text-sm font-light text-gray-500">
                        Already have an account ? <button on:click={hLogin} class="font-medium text-teal-600 hover:underline">Sign in</button> instead.
                    </p>
                </div>
            </div>
        </div>
    </div>
  </section>
