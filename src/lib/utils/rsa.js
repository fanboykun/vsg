// @ts-nocheck
import { writable } from 'svelte/store';
export const rsa = writable([]);

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

export function generateRandomTwoDigitPrimeNumbers(){
    return getRandPrime(10, 99)
}

const getPrimes = (min, max) => {
    const result = Array(max + 1)
      .fill(0)
      .map((_, i) => i);
    for (let i = 2; i <= Math.sqrt(max + 1); i++) {
      for (let j = i ** 2; j < max + 1; j += i) delete result[j];
    }
    return Object.values(result.slice(Math.max(min, 2)));
  };
  
const getRandNum = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
};

const getRandPrime = (min, max) => {
    const primes = getPrimes(min, max);
    return primes[getRandNum(0, primes.length - 1)];
};

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
            // console.log(`${(d * e)} %  ${phi} = ${(d * e) % phi} `)
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
        // encryptedMessage.push((message[i] ** e) % n)
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
        // decryptedMessage.push((message[i] ** d) % n)
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
