// @ts-nocheck
export function generateKeys(p, q){
    let publicKey = {}
    let privateKey = {}
    let n = calculateMod(p, q)
    let phi = calculatePhi(p, q)
    let e = calculateE(phi)
    let d = calculateD(e, phi)
    publicKey.e = e
    publicKey.n = n
    privateKey.d = d
    privateKey.n = n
    return {publicKey, privateKey}
}

export function calculateMod(p,q){
    return p * q
}

export function calculatePhi(p,q){
    return (p - 1) * (q - 1)
}

export function calculateE(phi){
    let e = 3
    while(e < phi){
        if(gcd(e, phi) === 1 && isNumberPrime(e) && e !== phi){
            break
        }
        e++
    }
    return e
}

export function calculateD(e, phi){
    let d = 1
    while(d < phi){
        if((d * e) % phi === 1){
            break
        }
        d++
    }
    return d
}

export function gcd(a, b){
    if(!b){
        return a
    }
    return gcd(b, a % b)
}

export function raiseKeyToPowerModN(key, power, n){
    let result = 1
    for(let i = 0; i < power; i++){
        result = (result * key) % n
    }
    return result
}

export function encryptMessage(message, e, n){
    let encryptedMessage = []
    for(let i = 0; i < message.length; i++){
        encryptedMessage.push(raiseKeyToPowerModN(message[i], e, n))
    }
    return encryptedMessage
}

export function encryptMessageWithPublicKey(message, publicKey){
    return encryptMessage(message, publicKey.e, publicKey.n)
}

export function decryptMessage(message, d, n){
    let decryptedMessage = []
    for(let i = 0; i < message.length; i++){
        decryptedMessage.push(raiseKeyToPowerModN(message[i], d, n))
    }
    return decryptedMessage
}

export function decryptMessageWithPrivateKey(message, privateKey){
    return decryptMessage(message, privateKey.d, privateKey.n)
}

export function generateKeysWithBits(bits){
    let p = generatePrimeNumber(bits)
    let q = generatePrimeNumber(bits)
    return generateKeys(p, q)
}

export function generatePrimeNumber(bits){
    let primeNumber = 0
    let isPrime = false
    while(!isPrime){
        primeNumber = generateRandomNumber(bits)
        isPrime = isNumberPrime(primeNumber)
    }
    return primeNumber
}

export function generateRandomNumber(bits){
    let randomNumber = 0
    while(randomNumber < 2){
        randomNumber = Math.floor(Math.random() * 2 ** bits)
    }
    return randomNumber
}

export function isNumberPrime(number){
    if(number === 2){
        return true
    }
    if(number % 2 === 0){
        return false
    }
    let squareRoot = Math.sqrt(number)
    for(let i = 3; i <= squareRoot; i += 2){
        if(number % i === 0){
            return false
        }
    }
    return true
}

export function generateKeysWithBitsAndMessage(bits, message){
    let keys = generateKeysWithBits(bits)
    let encryptedMessage = encryptMessageWithPublicKey(message, keys.publicKey)
    let decryptedMessage = decryptMessageWithPrivateKey(encryptedMessage, keys.privateKey)
    return {keys, encryptedMessage, decryptedMessage}
}

export function generateKeysWithBitsAndMessageAndPQ(bits, message, p, q){
    let keys = generateKeys(p, q)
    let encryptedMessage = encryptMessageWithPublicKey(message, keys.publicKey)
    let decryptedMessage = decryptMessageWithPrivateKey(encryptedMessage, keys.privateKey)
    return {keys, encryptedMessage, decryptedMessage}
}

export function generateKeysWithBitsAndMessageAndPQAndE(bits, message, p, q, e){
    let keys = generateKeys(p, q)
    keys.publicKey.e = e
    keys.privateKey.d = calculateD(e, calculatePhi(p, q))
    let encryptedMessage = encryptMessageWithPublicKey(message, keys.publicKey)
    let decryptedMessage = decryptMessageWithPrivateKey(encryptedMessage, keys.privateKey)
    return {keys, encryptedMessage, decryptedMessage}
}

export function generateKeysWithBitsAndMessageAndPQAndEAndD(bits, message, p, q, e, d){
    let keys = generateKeys(p, q)
    keys.publicKey.e = e
    keys.privateKey.d = d
    let encryptedMessage = encryptMessageWithPublicKey(message, keys.publicKey)
    let decryptedMessage = decryptMessageWithPrivateKey(encryptedMessage, keys.privateKey)
    return {keys, encryptedMessage, decryptedMessage}
}

export function generateKeysWithBitsAndMessageAndPQAndEAndDAndN(bits, message, p, q, e, d, n){
    let keys = generateKeys(p, q)
    keys.publicKey.e = e
    keys.privateKey.d = d
    keys.publicKey.n = n
    keys.privateKey.n = n
    let encryptedMessage = encryptMessageWithPublicKey(message, keys.publicKey)
    let decryptedMessage = decryptMessageWithPrivateKey(encryptedMessage, keys.privateKey)
    return {keys, encryptedMessage, decryptedMessage}
}

export function generateKeysWithBitsAndMessageAndPQAndEAndDAndNAndEncryptedMessage(bits, message, p, q, e, d, n, encryptedMessage){
    let keys = generateKeys(p, q)
    keys.publicKey.e = e
    keys.privateKey.d = d
    keys.publicKey.n = n
    keys.privateKey.n = n
    let decryptedMessage = decryptMessageWithPrivateKey(encryptedMessage, keys.privateKey)
    return {keys, encryptedMessage, decryptedMessage}
}

export function generateKeysWithBitsAndMessageAndPQAndEAndDAndNAndEncryptedMessageAndDecryptedMessage(bits, message, p, q, e, d, n, encryptedMessage, decryptedMessage){
    let keys = generateKeys(p, q)
    keys.publicKey.e = e
    keys.privateKey.d = d
    keys.publicKey.n = n
    keys.privateKey.n = n
    return {keys, encryptedMessage, decryptedMessage}
}

export function generateKeysWithBitsAndMessageAndPQAndEAndDAndNAndEncryptedMessageAndDecryptedMessageAndIsMessageDecrypted(bits, message, p, q, e, d, n, encryptedMessage, decryptedMessage, isMessageDecrypted){
    let keys = generateKeys(p, q)
    keys.publicKey.e = e
    keys.privateKey.d = d
    keys.publicKey.n = n
    keys.privateKey.n = n
    return {keys, encryptedMessage, decryptedMessage, isMessageDecrypted}
}

export function generateKeysWithBitsAndMessageAndPQAndEAndDAndNAndEncryptedMessageAndDecryptedMessageAndIsMessageDecryptedAndIsMessageEncrypted(bits, message, p, q, e, d, n, encryptedMessage, decryptedMessage, isMessageDecrypted, isMessageEncrypted){
    let keys = generateKeys(p, q)
    keys.publicKey.e = e
    keys.privateKey.d = d
    keys.publicKey.n = n
    keys.privateKey.n = n
    return {keys, encryptedMessage, decryptedMessage, isMessageDecrypted, isMessageEncrypted}
}
