<script>
// @ts-nocheck
    import { convertAsciiToText, convertTextToAscii } from "./text";
    import { generateKeys, encryptMessageWithPublicKey, decryptMessageWithPrivateKey } from "./rsa";
    import { arrToObj, objToArr } from "./formatter";
  import { onMount } from "svelte";

    const Alice = {
        name: 'Alice',
        p: 11,
        q: 13,
        publicKey: {
            n: 0,
            e: 0
        },
        privateKey: {
            n: 0,
            d: 0
        }
    }

    const Bob = {
        name: 'Bob',
        p: 17,
        q: 23,
        publicKey: {
            n: 0,
            e: 0
        },
        privateKey: {
            n: 0,
            d: 0
        }
    }   

    onMount(() => {
        generateInfo('Alice')
        generateInfo('Bob')
    })

    function generateInfo(who){
        if(who === 'Alice'){
            const keyGen =  generateKeys(Alice.p, Alice.q)
            Alice.publicKey.n = keyGen.publicKey.n
            Alice.publicKey.e = keyGen.publicKey.e
            Alice.privateKey.n = keyGen.privateKey.n
            Alice.privateKey.d = keyGen.privateKey.d
        }else if(who === 'Bob'){
            const keyGen = generateKeys(Bob.p, Bob.q)
            Bob.publicKey.n = keyGen.publicKey.n
            Bob.publicKey.e = keyGen.publicKey.e
            Bob.privateKey.n = keyGen.privateKey.n
            Bob.privateKey.d = keyGen.privateKey.d
        }
    }

    let conversion = {
        text: '',
        ascii: [],
        msgAfterEncrypt: [],
        msgAfterDecrypt: [],
        gun_like: {},
        after_gun: [],
        textAfterConversion: [],
    }

    function encrypt(msg, receiver){
        if(receiver.publicKey.n === 0){
            alert('Please generate Bob info first')
            return
        }
        conversion.msgAfterEncrypt = encryptMessageWithPublicKey(msg, receiver.publicKey)
    }

    function decrypt(msg, receiver){
        if(receiver.privateKey.n === 0){
            alert('Please generate Bob info first')
            return
        }
        conversion.msgAfterDecrypt = decryptMessageWithPrivateKey(msg, receiver.privateKey)
    }
</script>

<section>
    <div>
        <h3>Alice Info</h3>
        <button on:click={() => generateInfo('Alice')}>Generate Info</button>
        <div>
            <p>Alice p : {Alice.p} q : {Alice.q}</p>
            <p>Alice pub n : {Alice.publicKey.n} priv n {Alice.privateKey.n}</p>
            <p>Alice e (public key) : {Alice.publicKey.e}</p>
            <p>Alice d (private key) : {Alice.privateKey.d}</p>
        </div>
    </div>
    <div>
        <h3>Bob Info</h3>
        <button on:click={() => generateInfo('Bob')}>Generate Info</button>
        <div>
            <p>Bob p : {Bob.p} q : {Bob.q}</p>
            <p>Bob pub n : {Bob.publicKey.n} priv n : {Bob.privateKey.n}</p>
            <p>Bob e (public key) : {Bob.publicKey.e}</p>
            <p>Bob d (private key) : {Bob.privateKey.d}</p>
        </div>
    </div>
    
    <div>
        <h3>Text to convert to ASCII</h3>
        <textarea name="text" id="text" cols="50" rows="10" bind:value={conversion.text}></textarea>
        <button on:click={() =>conversion.ascii =  convertTextToAscii(conversion.text)}>Convert</button>
    </div>
    <div>
        <h3>ASCII value after convert</h3>
        {conversion.ascii}
    </div>
    <div>
        <h3>RSA encryption (alice to bob)</h3>
        <button on:click={() => encrypt(conversion.ascii, Bob)}>Encrypt</button>
        <p>{conversion.msgAfterEncrypt}</p>
    </div>
    <div>
        <h3>Object to encrypt in Gun</h3>
        <button on:click={() => conversion.gun_like = arrToObj(conversion.msgAfterEncrypt)}>Convert To Gun Like</button>
        <p>{JSON.stringify(conversion.gun_like)}</p>
    </div>
    <div>
        <h3>Array to decrypt</h3>
        <button on:click={() => conversion.after_gun =  objToArr(conversion.gun_like)}>Go</button>
        <p>{JSON.stringify(conversion.after_gun)}</p>
    </div>
    <div>
        <h3>After Decrypt</h3>
        <button on:click={() => decrypt(conversion.msgAfterEncrypt, Bob)}>Decrypt</button>
        <p>
            {conversion.msgAfterDecrypt}
        </p>
    </div>
    <div>
        <h3>Plain Text</h3>
        <button on:click={() => conversion.textAfterConversion =  convertAsciiToText(conversion.msgAfterDecrypt)}>Convert</button>
        <div>
            {conversion.textAfterConversion}
        </div>
        <textarea name="after" id="after" cols="50" rows="10">{conversion.textAfterConversion}</textarea>
    </div>
</section>
