import GUN from 'gun';
import 'gun/sea';
// import 'gun/axe';
import { writable } from 'svelte/store';

export const isLoggedIn = writable(false)

// Database
export const db = GUN({peers : ['http://localhost:8000/gun'], localStorage: false, axe: false});

// Gun User
export const user = db.user().recall({sessionStorage: true});
// export const user = writable(db.user().recall({sessionStorage: true}));
export const loggedInUser = writable(user.is);
// Current User's username
export const username = writable('');
user.get('alias').on(v => username.set(v))

db.on('auth', async(event) => {
    loggedInUser.set(user.is)
    let rsaKey = setRsa(user.is)
    user.is.rsa = rsaKey
    const alias = await user.get('alias'); // username string
    username.set(alias);
    if(rsaKey == user.is.rsa){
        isLoggedIn.set(true)
    }
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
    return rsaSet
}
