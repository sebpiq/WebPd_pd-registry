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

import { MSG_DATUM_TYPE_STRING } from '@webpd/compiler-js/src/constants'
import {
    NodeCodeGenerator,
    NodeImplementation,
} from '@webpd/compiler-js/src/types'
import NODE_ARGUMENTS_TYPES from '../node-arguments-types'

type SoundfilerCodeGenerator = NodeCodeGenerator<NODE_ARGUMENTS_TYPES['_NO_ARGS']>
type SoundfilerNodeImplementation = NodeImplementation<NODE_ARGUMENTS_TYPES['_NO_ARGS']>

// ------------------------------ declare ------------------------------ //
export const declare: SoundfilerCodeGenerator = (_, {macros, state, ins, globs}) => `
    let ${macros.typedVarStringArray(state.arrayNames)} = []

    const ${state.funcHandleMessage0} = ${macros.functionHeader()} => {
        let m = ${ins.$0}.shift()

        if (${macros.isMessageMatching('m', ['read', MSG_DATUM_TYPE_STRING, MSG_DATUM_TYPE_STRING, MSG_DATUM_TYPE_STRING])}) {
            ${macros.extractMessageStringTokens('m', 'mStrings')}
            let ${macros.typedVarString('url')} = ''
            for (let i = 0; i < mStrings.length; i++) {
                let ${macros.typedVarString('sIndex')} = mStrings[i][0]
                let ${macros.typedVarString('sValue')} = mStrings[i][1]
                if (sValue.includes('/') || sValue.includes('.')) {
                    url = sValue
                    ${state.arrayNames} = []
                } else if (url.length > 0) {
                    ${state.arrayNames}.push(sValue)
                }
            }

            fs_readSoundFile(url, (id: fs_OperationId, status: fs_OperationStatus, sound: TypedArray[]) => {
                const ${macros.typedVarInt('channelCount')} = ${macros.castToInt(`Math.min(${state.arrayNames}.length, sound.length)`)}
                for (let channel = 0; channel < channelCount; channel++) {
                    ${globs.arrays}.set(${state.arrayNames}[channel], sound[channel])
                }
            })
        
        } else {
            throw new Error("Unexpected message")
        }
    }
`

// ------------------------------ initialize ------------------------------ //
export const initialize: SoundfilerCodeGenerator = (_, {state}) => `
    ${state.arrayNames} = []
`

// ------------------------------- loop ------------------------------ //
// TODO: right inlet, reset phase
export const loop: SoundfilerCodeGenerator = (_, { state, ins }) => `
    while (${ins.$0}.length) {
        ${state.funcHandleMessage0}()
    }
`

// ------------------------------------------------------------------- //
export const stateVariables: SoundfilerNodeImplementation['stateVariables'] = ['funcHandleMessage0', 'arrayNames']