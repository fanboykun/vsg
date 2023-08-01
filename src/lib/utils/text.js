export function convertTextToAscii(text){
    let ascii = []
    Object.keys(text).forEach((key) => {
        ascii[key] = text.charCodeAt(key)
    })
    return ascii
}

export function convertAsciiToText(ascii){
    let textAfterConversion = ''
    Object.keys(ascii).forEach((key) => {
        textAfterConversion += String.fromCharCode(ascii[key])
    })
    return textAfterConversion
}