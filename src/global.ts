import { CodeMacros } from "@webpd/compiler-js/src/types";

// TODO : support for -raw (see soundfiler help)
// TODO : find a better way to factorize this code
// TODO : unit testing
export const GLOB_parseSoundFileOpenOpts = (macros: CodeMacros) => `
    ${macros.typedFuncHeader([
        macros.typedVar('m', 'Message'),
        macros.typedVar('soundInfo', '_fs_SoundInfo'),
    ], 'Set<Int>')} => {
        const ${macros.typedVar('unhandled', 'Set<Int>')} = new Set()
        let ${macros.typedVar('i', 'Int')} = 0
        while (i < msg_getLength(m)) {
            if (msg_isStringToken(m, i)) {
                const ${macros.typedVar('str', 'string')} = msg_readStringToken(m, i)
                if (['-wave', '-aiff', '-caf', '-next', '-ascii'].includes(str)) {
                    soundInfo.encodingFormat = str.slice(1)

                } else if (str === '-raw') {
                    console.log('-raw format not yet supported')
                    i += 4
                    
                } else if (str === '-big') {
                    soundInfo.endianness = 'b'

                } else if (str === '-little') {
                    soundInfo.endianness = 'l'

                } else if (str === '-bytes') {
                    if (i < msg_getLength(m) && msg_isFloatToken(m, i + 1)) {
                        soundInfo.bitDepth = msg_readFloatToken(m, i + 1) * 8
                        i++
                    } else {
                        console.log('failed to parse -bytes <value>')
                    }

                } else if (str === '-rate') {
                    if (i < msg_getLength(m) && msg_isFloatToken(m, i + 1)) {
                        soundInfo.sampleRate = msg_readFloatToken(m, i + 1)
                        i++
                    } else {
                        console.log('failed to parse -rate <value>')
                    }

                } else {
                    unhandled.add(i)
                }
                
            } else {
                unhandled.add(i)
            }
            i++
        }
        return unhandled
    }
`

export const GLOBS_parseReadWriteFsOpts = (state: any, globs: any, macros: CodeMacros) => `
    ${macros.typedFuncHeader([
        macros.typedVar('m', 'Message'),
        macros.typedVar('soundInfo', '_fs_SoundInfo'),
        macros.typedVar('unhandledOptions', 'Set<Int>'),
    ], 'string')} => {
        // Remove the "open" token
        unhandledOptions.delete(0)

        let ${macros.typedVar('url', 'string')} = ''
        let ${macros.typedVar('urlFound', 'boolean')} = false
        let ${macros.typedVar('errored', 'boolean')} = false
        let ${macros.typedVar('i', 'Int')} = 1
        while (i < msg_getLength(m)) {
            if (!unhandledOptions.has(i)) {

            } else if (msg_isStringToken(m, i)) {
                url = msg_readStringToken(m, i)
                urlFound = true

            } else {
                console.log("[writesf/readsf~] invalid option index " + i.toString())
                errored = true
            }
            i++
        }
        if (!urlFound) {
            console.log("[writesf/readsf~] invalid options, file url not found")
            return ''
        }
        if (errored) {
            return ''
        }
        return url
    }
`