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

type MetroCodeGenerator = NodeCodeGenerator<NODE_ARGUMENTS_TYPES['metro']>
type MetroNodeImplementation = NodeImplementation<NODE_ARGUMENTS_TYPES['metro']>

// ------------------------------ declare ------------------------------ //
export const declare: MetroCodeGenerator = (node, { state, globs, macros, types }) => 
    // TODO : more complex ways to set rate
    // Time units are all expressed in frames here
    `
        let ${macros.typedVar(state.rate, 'Float')} = 0
        let ${macros.typedVar(state.nextTick, 'Int')} = -1
        let ${macros.typedVar(state.realNextTick, 'Float')} = -1

        const ${state.funcSetRate} = ${macros.typedFuncHeader([
            macros.typedVar('rate', 'Float')
        ], 'void')} => {
            ${state.rate} = rate / 1000 * ${globs.sampleRate}
        }

        const ${state.funcHandleMessage0} = ${macros.typedFuncHeader([
            macros.typedVar('m', 'Message')
        ], 'void')} => {
            if (msg_getLength(m) === 1) {
                if (
                    (msg_isFloatToken(m, 0) && msg_readFloatToken(m, 0) === 0)
                    || (msg_isStringToken(m, 0) && msg_readStringToken(m, 0) === 'stop')
                ) {
                    ${state.nextTick} = 0
                    ${state.realNextTick} = 0
                    return

                } else if (
                    msg_isFloatToken(m, 0)
                    || (msg_isStringToken(m, 0) && msg_readStringToken(m, 0) === 'bang')
                ) {
                    ${state.nextTick} = ${globs.frame}
                    ${state.realNextTick} = ${types.Float}(${globs.frame})
                    return
                }
            }
            throw new Error("Unexpected message")
        }

        const ${state.funcHandleMessage1} = ${macros.typedFuncHeader([
            macros.typedVar('m', 'Message')
        ], 'void')} => {
            if (msg_getLength(m) === 1 && msg_isFloatToken(m, 0)) {
                ${state.funcSetRate}(msg_readFloatToken(m, 0))
                
            } else {
                throw new Error("Unexpected message")
            }
        }
    `

// ------------------------------ initialize ------------------------------ //
export const initialize: MetroCodeGenerator = (node, {state}) => `
    ${node.args.rate !== undefined ? 
        `${state.funcSetRate}(${node.args.rate})`: ''}
`

// ------------------------------- loop ------------------------------ //
export const loop: MetroCodeGenerator = (_, {state, ins, outs, types, globs, macros}) => `
    while (${ins.$1}.length) {
        ${state.funcHandleMessage1}(${ins.$1}.shift())
    }
    while (${ins.$0}.length) {
        ${state.funcHandleMessage0}(${ins.$0}.shift())
    }
    if (${globs.frame} === ${state.nextTick}) {
        const ${macros.typedVar('m', 'Message')} = msg_create([MSG_TOKEN_TYPE_STRING, 4])
        msg_writeStringToken(m, 0, 'bang')
        ${outs.$0}.push(m)
        ${state.realNextTick} = ${state.realNextTick} + ${state.rate}
        ${state.nextTick} = ${types.Int}(Math.round(${state.realNextTick}))
    }
`

// ------------------------------------------------------------------- //
export const stateVariables: MetroNodeImplementation['stateVariables'] = [
    'rate',
    'nextTick',
    'realNextTick',
    'funcSetRate',
    'funcHandleMessage0',
    'funcHandleMessage1',
]