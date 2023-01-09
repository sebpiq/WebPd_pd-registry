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

// TODO : more complex ways to set rate
// ------------------------------ declare ------------------------------ //
export const declare: MetroCodeGenerator = (_, { state, globs, macros }) => 
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
    `

// ------------------------------ initialize ------------------------------ //
export const initialize: MetroCodeGenerator = (node, {state}) => `
    ${node.args.rate !== undefined ? 
        `${state.funcSetRate}(${node.args.rate})`: ''}
`

// ------------------------------ messages ------------------------------ //
export const messages: MetroNodeImplementation['messages'] = (_, {state, globs, types}) => ({
    '0': `
    if (msg_getLength(${globs.m}) === 1) {
        if (
            (msg_isFloatToken(${globs.m}, 0) && msg_readFloatToken(${globs.m}, 0) === 0)
            || (msg_isStringToken(${globs.m}, 0) && msg_readStringToken(${globs.m}, 0) === 'stop')
        ) {
            ${state.nextTick} = 0
            ${state.realNextTick} = 0
            return

        } else if (
            msg_isFloatToken(${globs.m}, 0)
            || (msg_isStringToken(${globs.m}, 0) && msg_readStringToken(${globs.m}, 0) === 'bang')
        ) {
            ${state.nextTick} = ${globs.frame} + 1
            ${state.realNextTick} = ${types.Float}(${globs.frame} + 1)
            return
        }
    }
    throw new Error("Unexpected message")`,

    '1': `
    if (msg_getLength(${globs.m}) === 1 && msg_isFloatToken(${globs.m}, 0)) {
        ${state.funcSetRate}(msg_readFloatToken(${globs.m}, 0))
        return
    }
    throw new Error("Unexpected message")
    `
})

// ------------------------------- loop ------------------------------ //
export const loop: MetroCodeGenerator = (_, {state, snds, types, globs}) => `
    if (${globs.frame} === ${state.nextTick}) {
        ${snds.$0}(msg_bang())
        ${state.realNextTick} = ${state.realNextTick} + ${state.rate}
        ${state.nextTick} = ${types.Int}(Math.round(${state.realNextTick}))
    }
`

// ------------------------------------------------------------------- //
export const stateVariables: MetroNodeImplementation['stateVariables'] = () => [
    'rate',
    'nextTick',
    'realNextTick',
    'funcSetRate',
    'funcHandleMessage0',
    'funcHandleMessage1',
]