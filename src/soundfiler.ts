/*
 * Copyright (c) 2012-2020 Sébastien Piquemal <sebpiq@gmail.com>
 *
 * BSD Simplified License.
 * For information on usage and redistribution, and for a DISCLAIMER OF ALL
 * WARRANTIES, see the file, "LICENSE.txt," in this distribution.
 *
 * See https://github.com/sebpiq/WebPd_pd-parser for documentation
 *
 */

import {
    NodeCodeGenerator,
    NodeImplementation,
} from '@webpd/compiler-js/src/types'
import { NodeBuilder } from '@webpd/pd-json'

interface NodeArguments {}

// TODO: lots of things left to implement
//      - channel count
//      - simlutaneous operations
// ------------------------------- node builder ------------------------------ //
const builder: NodeBuilder<NodeArguments> = {
    translateArgs: (pdNode) => ({}),
    build: () => ({
        inlets: {
            '0': { type: 'message', id: '0' },
        },
        outlets: {
            '0': { type: 'message', id: '0' },
        },
    }),
}

// ------------------------------ declare ------------------------------ //
const declare: NodeCodeGenerator<NodeArguments> = (_, {macros, state}) => `
    let ${macros.typedVar(state.arrayNames, 'Array<string>')} = []
`

// ------------------------------- messages ------------------------------ //
const messages: NodeImplementation<NodeArguments>['messages'] = (_, { state, macros, globs, snds }) => ({
    '0': `
    if (
        msg_getLength(${globs.m}) >= 3 
        && msg_isStringToken(${globs.m}, 0)
        && (
            msg_readStringToken(${globs.m}, 0) === 'read'
            || msg_readStringToken(${globs.m}, 0) === 'write'
        )
    ) {
        const ${macros.typedVar('operationType', 'string')} = msg_readStringToken(${globs.m}, 0)
        
        let ${macros.typedVar('i', 'Int')} = 0
        let ${macros.typedVar('url', 'string')} = ''
        const ${macros.typedVar('stringsIndexes', 'Array<Int>')} = []
        const ${macros.typedVar('stringsValues', 'Array<string>')} = []

        for (i = 1; i < msg_getLength(${globs.m}); i++) {
            if (msg_isStringToken(${globs.m}, i)) {
                stringsIndexes.push(i)
                stringsValues.push(msg_readStringToken(${globs.m}, i))
            }
        }
        
        for (i = 0; i < stringsIndexes.length; i++) {
            let ${macros.typedVar('sIndex', 'Int')} = stringsIndexes[i]
            let ${macros.typedVar('sValue', 'string')} = stringsValues[i]
            if (sValue.includes('/') || sValue.includes('.')) {
                url = sValue
                ${state.arrayNames} = []
            } else if (url.length > 0) {
                ${state.arrayNames}.push(sValue)
            }
        }

        const ${macros.typedVar('channelCount', 'Int')} = ${state.arrayNames}.length

        if (operationType === 'read') {
            console.log('[soundfiler] READ ' + url + ' ' + channelCount.toString())
            fs_readSoundFile(url, fs_soundInfo(channelCount), ${macros.typedFuncHeader([
                macros.typedVar('id', 'fs_OperationId'),
                macros.typedVar('status', 'fs_OperationStatus'),
                macros.typedVar('sound', 'FloatArray[]'),
            ], 'void')} => {
                let ${macros.typedVar('i', 'Int')} = 0
                for (i = 0; i < sound.length; i++) {
                    ${globs.arrays}.set(${state.arrayNames}[i], sound[i])
                }
                if (sound.length) {
                    ${snds.$0}(msg_floats([sound[0].length]))
                } else {
                    ${snds.$0}(msg_floats([0]))
                }
                console.log('[soundfiler] READ done')
            })

        } else {
            console.log('[soundfiler] WRITE ' + url + ' ' + channelCount.toString())
            const ${macros.typedVar('sound', 'FloatArray[]')} = []
            for (i = 0; i < channelCount; i++) {
                sound.push(${globs.arrays}.get(${state.arrayNames}[i]))
            }
            fs_writeSoundFile(sound, url, fs_soundInfo(channelCount), ${macros.typedFuncHeader([
                macros.typedVar('id', 'fs_OperationId'),
                macros.typedVar('status', 'fs_OperationStatus'),
            ], 'void')} => {
                console.log('[soundfiler] WRITE done')
            })
        }

        return
    }
    throw new Error("Unexpected message")
    `
})

// ------------------------------------------------------------------- //
const stateVariables: NodeImplementation<NodeArguments>['stateVariables'] = () => ['arrayNames']

const nodeImplementation: NodeImplementation<NodeArguments> = {declare, messages, stateVariables}

export { 
    builder,
    nodeImplementation,
    NodeArguments,
}