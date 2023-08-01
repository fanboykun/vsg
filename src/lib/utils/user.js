import GUN from 'gun';
import 'gun/sea';
// import 'gun/axe';
import { rsa } from './rsa.js'
import { writable } from 'svelte/store';

export const isLoggedIn = writable(false)

// Database
export const db = GUN({peers : ['http://localhost:4200/gun'], localStorage: false, axe: false});

// Gun User
export const user = db.user().recall({sessionStorage: true});

// Current User's username
export const username = writable('');

user.get('alias').on(v => username.set(v))

db.on('auth', async(event) => {
    let pair = db.user()._.sea
    user.is = pair
    setRsa(pair)
    const alias = await user.get('alias'); // username string
    username.set(alias);
    isLoggedIn.set(true)
});
function setRsa(pair){
    let rsaSet = []
     // @ts-ignore
     db.get(pair.pub).get('rsa').map().once((data,key) => {
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
    user.is.rsa = rsaSet
}
