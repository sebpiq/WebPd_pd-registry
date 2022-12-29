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
import NODE_ARGUMENTS_TYPES from '../node-arguments-types'

type SoundfilerCodeGenerator = NodeCodeGenerator<NODE_ARGUMENTS_TYPES['_NO_ARGS']>
type SoundfilerNodeImplementation = NodeImplementation<NODE_ARGUMENTS_TYPES['_NO_ARGS']>

// ------------------------------ declare ------------------------------ //
export const declare: SoundfilerCodeGenerator = (_, {macros, state, types, globs}) => `
    let ${macros.typedVar(state.arrayNames, 'Array<string>')} = []

    const ${state.funcHandleMessage0} = ${macros.typedFuncHeader([
        macros.typedVar('m', 'Message')
    ], 'void')} => {
        if (msg_getLength(m) >= 3) {
            if (msg_readStringDatum(m, 0) === 'read) {
                const stringsIndexes: Array<number> = []
                const stringsValues: Array<string> = []
                for (let i = 1; i < msg_getLength(m); i++) {
                    if (msg_isStringToken(m, i)) {
                        stringsIndexes.push(i)
                        stringsValues.push(msg_readStringDatum(m, i))
                    }
                }
                let ${macros.typedVar('url', 'string')} = ''
                for (let i = 0; i < stringsIndexes.length; i++) {
                    let ${macros.typedVar('sIndex', 'string')} = stringsIndexes[i]
                    let ${macros.typedVar('sValue', 'string')} = stringsValues[i]
                    if (sValue.includes('/') || sValue.includes('.')) {
                        url = sValue
                        ${state.arrayNames} = []
                    } else if (url.length > 0) {
                        ${state.arrayNames}.push(sValue)
                    }
                }
    
                fs_readSoundFile(url, (id: fs_OperationId, status: fs_OperationStatus, sound: FloatArray[]) => {
                    const ${macros.typedVar('channelCount', 'Int')} = ${types.Int}(Math.min(${state.arrayNames}.length, sound.length))
                    for (let channel = 0; channel < channelCount; channel++) {
                        ${globs.arrays}.set(${state.arrayNames}[channel], sound[channel])
                    }
                })
                return
            }

        } else {
            throw new Error("Unexpected message")
        }
    }
`

// ------------------------------- loop ------------------------------ //
// TODO: right inlet, reset phase
export const loop: SoundfilerCodeGenerator = (_, { state, ins }) => `
    while (${ins.$0}.length) {
        ${state.funcHandleMessage0}(${ins.$0}.shift())
    }
`

// ------------------------------------------------------------------- //
export const stateVariables: SoundfilerNodeImplementation['stateVariables'] = ['funcHandleMessage0', 'arrayNames']