import GUN from 'gun';
import 'gun/sea';
// import 'gun/axe';
import { writable } from 'svelte/store';

// Database
// export const db = GUN({peers : ['http://localhost:8000/gun']});
export const db = GUN({peers : ['http://localhost:4200/gun'], localStorage: false, axe: false});

// Gun User
export const user = db.user().recall({sessionStorage: true});

// Current User's username
export const username = writable('');

user.get('alias').on(v => username.set(v))

db.on('auth', async(event) => {
    const alias = await user.get('alias'); // username string
    username.set(alias);
    // console.log(`user pub : ${user.is.pub}`);
    // console.log(`signed in as ${alias}`);
});