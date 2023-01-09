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

type DelayCodeGenerator = NodeCodeGenerator<NODE_ARGUMENTS_TYPES['delay']>
type DelayNodeImplementation = NodeImplementation<NODE_ARGUMENTS_TYPES['delay']>

// TODO : more complex ways to set delay
// TODO : tests (delay 0, several bangs at same tick) etc.


// ------------------------------ declare ------------------------------ //
export const declare: DelayCodeGenerator = (_, { state, globs, macros, types }) => 
    `
        let ${macros.typedVar(state.delay, 'Float')} = 0
        let ${macros.typedVar(state.scheduledBangs, 'Array<Float>')} = []

        const ${state.funcSetDelay} = ${macros.typedFuncHeader([
            macros.typedVar('delay', 'Float')
        ], 'void')} => {
            ${state.delay} = Math.max(0, delay / 1000 * ${globs.sampleRate})
        }
    `

// ------------------------------ messages ------------------------------ //
export const messages: DelayNodeImplementation['messages'] = (_, {state, types, globs}) => ({
    '0': `
        ${state.scheduledBangs}.push(
            ${types.Int}(Math.round(${globs.frame} + ${state.delay}))
        )`
})

// ------------------------------ initialize ------------------------------ //
export const initialize: DelayCodeGenerator = (node, {state}) => `
    ${node.args.delay !== undefined ? 
        `${state.funcSetDelay}(${node.args.delay})`: ''}
`

// ------------------------------- loop ------------------------------ //
// We're careful to remove multiple bang at the same frame.
export const loop: DelayCodeGenerator = (_, {state, snds, globs}) => `
    ${state.hasBanged} = false
    while (${state.scheduledBangs}.length && ${globs.frame} >= ${state.scheduledBangs}[0]) {
        ${state.scheduledBangs}.shift()
        if (!${state.hasBanged}) {${snds.$0}.push(msg_bang())}
        ${state.hasBanged} = true
    }
`

// ------------------------------------------------------------------- //
export const stateVariables: DelayNodeImplementation['stateVariables'] = () => [
    'funcSetDelay',
    'delay',
    'scheduledBangs',
    'hasBanged'
]