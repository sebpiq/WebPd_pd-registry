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

interface NodeArguments { rate: number }

// TODO : more complex ways to set rate

// ------------------------------- node builder ------------------------------ //
const builder: NodeBuilder<NodeArguments> = {
    translateArgs: (pdNode) => ({
        rate: validation.assertOptionalNumber(pdNode.args[0]),
    }),
    build: () => ({
        inlets: {
            '0': { type: 'message', id: '0' },
            '1': { type: 'message', id: '1' },
        },
        outlets: {
            '0': { type: 'message', id: '0' },
        },
        isMessageSource: true
    }),
}

// ------------------------------ declare ------------------------------ //
const declare: NodeCodeGenerator<NodeArguments> = (_, { state, globs, macros }) => 
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
const initialize: NodeCodeGenerator<NodeArguments> = (node, {state}) => `
    ${node.args.rate !== undefined ? 
        `${state.funcSetRate}(${node.args.rate})`: ''}
`

// ------------------------------ messages ------------------------------ //
const messages: NodeImplementation<NodeArguments>['messages'] = (_, {state, globs, types}) => ({
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
const loop: NodeCodeGenerator<NodeArguments> = (_, {state, snds, types, globs}) => `
    if (${globs.frame} === ${state.nextTick}) {
        ${snds.$0}(msg_bang())
        ${state.realNextTick} = ${state.realNextTick} + ${state.rate}
        ${state.nextTick} = ${types.Int}(Math.round(${state.realNextTick}))
    }
`

// ------------------------------------------------------------------- //
const stateVariables: NodeImplementation<NodeArguments>['stateVariables'] = () => [
    'rate',
    'nextTick',
    'realNextTick',
    'funcSetRate',
    'funcHandleMessage0',
    'funcHandleMessage1',
]

const nodeImplementation: NodeImplementation<NodeArguments> = {declare, initialize, messages, loop, stateVariables}

export { 
    builder,
    nodeImplementation,
    NodeArguments,
}