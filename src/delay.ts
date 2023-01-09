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
import { NodeBuilder, validation } from '@webpd/pd-json'

interface NodeArguments { delay: number }

// TODO : more complex ways to set delay
// TODO : tests (delay 0, several bangs at same tick) etc.

// ------------------------------- node builder ------------------------------ //
const builder: NodeBuilder<NodeArguments> = {
    translateArgs: (pdNode) => ({
        delay: validation.assertOptionalNumber(pdNode.args[0]),
    }),
    build: () => ({
        inlets: {
            '0': { type: 'message', id: '0' },
            '1': { type: 'message', id: '1' },
        },
        outlets: {
            '0': { type: 'message', id: '0' },
        },
    }),
}

// ------------------------------ declare ------------------------------ //
const declare: NodeCodeGenerator<NodeArguments> = (_, { state, globs, macros, types }) => 
    `
        let ${macros.typedVar(state.delay, 'Float')} = 0
        let ${macros.typedVar(state.scheduledBangs, 'Array<Float>')} = []

        const ${state.funcSetDelay} = ${macros.typedFuncHeader([
            macros.typedVar('delay', 'Float')
        ], 'void')} => {
            ${state.delay} = Math.max(0, delay / 1000 * ${globs.sampleRate})
        }
    `

// ------------------------------ initialize ------------------------------ //
const initialize: NodeCodeGenerator<NodeArguments> = (node, {state}) => `
    ${node.args.delay !== undefined ? 
        `${state.funcSetDelay}(${node.args.delay})`: ''}
`

// ------------------------------ messages ------------------------------ //
const messages: NodeImplementation<NodeArguments>['messages'] = (_, {state, types, globs}) => ({
    '0': `
        ${state.scheduledBangs}.push(
            ${types.Int}(Math.round(${globs.frame} + ${state.delay}))
        )`
})

// ------------------------------- loop ------------------------------ //
// We're careful to remove multiple bang at the same frame.
const loop: NodeCodeGenerator<NodeArguments> = (_, {state, snds, globs}) => `
    ${state.hasBanged} = false
    while (${state.scheduledBangs}.length && ${globs.frame} >= ${state.scheduledBangs}[0]) {
        ${state.scheduledBangs}.shift()
        if (!${state.hasBanged}) {${snds.$0}.push(msg_bang())}
        ${state.hasBanged} = true
    }
`

// ------------------------------------------------------------------- //
const stateVariables: NodeImplementation<NodeArguments>['stateVariables'] = () => [
    'funcSetDelay',
    'delay',
    'scheduledBangs',
    'hasBanged'
]

const nodeImplementation: NodeImplementation<NodeArguments> = {declare, initialize, messages, loop, stateVariables}

export { 
    builder,
    nodeImplementation,
    NodeArguments,
}