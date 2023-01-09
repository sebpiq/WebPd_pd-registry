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
import { DspGraph } from '@webpd/dsp-graph'
import { NodeBuilder, validation } from '@webpd/pd-json'

interface NodeArguments { frequency: number }

// ------------------------------- node builder ------------------------------ //
const builder: NodeBuilder<NodeArguments> = {
    translateArgs: (pdNode) => ({
        frequency: validation.assertOptionalNumber(pdNode.args[0]),
    }),
    build: () => ({
        inlets: {
            '0_message': { type: 'message', id: '0_message' },
            '0_signal': { type: 'signal', id: '0_signal' },
            '1': { type: 'message', id: '1' },
        },
        outlets: {
            '0': { type: 'signal', id: '0' },
        },
    }),
    rerouteConnectionIn: (outlet, inletId): DspGraph.PortletId => {
        if (inletId === '0') {
            return outlet.type === 'message' ? '0_message' : '0_signal'
        }
        return undefined
    },
}

// ------------------------------ declare ------------------------------ //
const declare: NodeCodeGenerator<NodeArguments> = (node, ...args) => {
    return _hasSignalInput(node)
        ? declareSignal(node, ...args)
        : declareMessage(node, ...args)
}

const declareSignal: NodeCodeGenerator<NodeArguments> = (_, {state, macros}) => `
    let ${macros.typedVar(state.phase, 'Float')} = 0
    let ${macros.typedVar(state.J, 'Float')}
`

const declareMessage: NodeCodeGenerator<NodeArguments> = (_, {state, globs, macros}) => `
    let ${macros.typedVar(state.phase, 'Float')} = 0
    let ${macros.typedVar(state.currentFrequency, 'Float')}
    let ${macros.typedVar(state.K, 'Float')} = 0

    const ${state.refreshK} = ${macros.typedFuncHeader([], 'void')} => 
        ${state.K} = ${state.currentFrequency} * 2 * Math.PI / ${globs.sampleRate}
`

// ------------------------------ initialize ------------------------------ //
const initialize: NodeCodeGenerator<NodeArguments> = (node, ...args) =>
    _hasSignalInput(node)
        ? initializeSignal(node, ...args)
        : initializeMessage(node, ...args)

const initializeSignal: NodeCodeGenerator<NodeArguments> = (node, { state, globs, ins }) => `
    ${ins.$0_signal} = ${node.args.frequency || 0}
    ${state.J} = 2 * Math.PI / ${globs.sampleRate}
`

const initializeMessage: NodeCodeGenerator<NodeArguments> = (node, { state }) => `
    ${state.currentFrequency} = ${node.args.frequency || 0}
    ${state.refreshK}()
`

// ------------------------------- loop ------------------------------ //
const loop: NodeCodeGenerator<NodeArguments> = (node, ...args) => {
    return _hasSignalInput(node) 
        ? loopSignal(node, ...args) 
        : loopMessage(node, ...args)
}

const loopSignal: NodeCodeGenerator<NodeArguments> = (_, {ins, state, outs}) => `
    ${outs.$0} = Math.cos(${state.phase})
    ${state.phase} += ${state.J} * ${ins.$0_signal}
`

// Take only the last received frequency message (first in the list)
const loopMessage : NodeCodeGenerator<NodeArguments> = (_, {state, outs}) => `
    ${outs.$0} = Math.cos(${state.phase})
    ${state.phase} += ${state.K}
`

// ------------------------------- messages ------------------------------ //
const messages: NodeImplementation<NodeArguments>['messages'] = (node, {globs, state}) => ({
    '0_message': `
    if (msg_getLength(${globs.m}) === 1 && msg_isFloatToken(${globs.m}, 0)) {
        ${state.currentFrequency} = msg_readFloatToken(${globs.m}, 0)
        ${state.refreshK}()
        return 
    }
    throw new Error("${node.type} <${node.id}> inlet <0_message> invalid message received.")
    `,
    
    '1': `
    ${state.phase} = msg_readFloatToken(${globs.m}, 0) % 1.0 * 2 * Math.PI`
})

// ------------------------------------------------------------------- //
const stateVariables: NodeImplementation<NodeArguments>['stateVariables'] = () => [
    'phase',
    'currentFrequency',
    'J',
    'refreshK',
    'K',
]

const _hasSignalInput = (node: DspGraph.Node<NodeArguments>) =>
    node.sources['0_signal'] && node.sources['0_signal'].length

const nodeImplementation: NodeImplementation<NodeArguments> = {declare, initialize, messages, loop, stateVariables}

export { 
    builder,
    nodeImplementation,
    NodeArguments,
}