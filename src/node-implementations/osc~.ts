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
import NODE_ARGUMENTS_TYPES from '../node-arguments-types'

type OscTildeCodeGenerator = NodeCodeGenerator<NODE_ARGUMENTS_TYPES['osc~']>
type OscTildeNodeImplementation = NodeImplementation<
    NODE_ARGUMENTS_TYPES['osc~']
>

// ------------------------------ declare ------------------------------ //
export const declare: OscTildeCodeGenerator = (node, ...args) => {
    return _hasSignalInput(node)
        ? declareSignal(node, ...args)
        : declareMessage(node, ...args)
}

const declareSignal: OscTildeCodeGenerator = (_, {state, macros}) => `
    let ${macros.typedVar(state.phase, 'Float')} = 0
    let ${macros.typedVar(state.J, 'Float')}
`

const declareMessage: OscTildeCodeGenerator = (_, {state, globs, macros}) => `
    let ${macros.typedVar(state.phase, 'Float')} = 0
    let ${macros.typedVar(state.currentFrequency, 'Float')}
    let ${macros.typedVar(state.K, 'Float')} = 0

    const ${state.refreshK} = ${macros.typedFuncHeader([], 'void')} => 
        ${state.K} = ${state.currentFrequency} * 2 * Math.PI / ${globs.sampleRate}
`

// ------------------------------ initialize ------------------------------ //
export const initialize: OscTildeCodeGenerator = (node, ...args) =>
    _hasSignalInput(node)
        ? initializeSignal(node, ...args)
        : initializeMessage(node, ...args)

const initializeSignal: OscTildeCodeGenerator = (node, { state, globs, ins }) => `
    ${ins.$0_signal} = ${node.args.frequency || 0}
    ${state.J} = 2 * Math.PI / ${globs.sampleRate}
`

const initializeMessage: OscTildeCodeGenerator = (node, { state }) => `
    ${state.currentFrequency} = ${node.args.frequency || 0}
    ${state.refreshK}()
`

// ------------------------------- loop ------------------------------ //
export const loop: OscTildeCodeGenerator = (node, ...args) => {
    return _hasSignalInput(node) 
        ? loopSignal(node, ...args) 
        : loopMessage(node, ...args)
}

const loopSignal: OscTildeCodeGenerator = (_, {ins, state, outs}) => `
    ${outs.$0} = Math.cos(${state.phase})
    ${state.phase} += ${state.J} * ${ins.$0_signal}
`

// Take only the last received frequency message (first in the list)
const loopMessage : OscTildeCodeGenerator = (_, {state, outs}) => `
    ${outs.$0} = Math.cos(${state.phase})
    ${state.phase} += ${state.K}
`

// ------------------------------- messages ------------------------------ //
export const messages: OscTildeNodeImplementation['messages'] = (node, {globs, state}) => ({
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
export const stateVariables: OscTildeNodeImplementation['stateVariables'] = () => [
    'phase',
    'currentFrequency',
    'J',
    'refreshK',
    'K',
]

const _hasSignalInput = (node: DspGraph.Node) =>
    node.sources['0_signal'] && node.sources['0_signal'].length

export const snippets = {
    declareSignal, declareMessage, initializeSignal, initializeMessage, loopSignal, loopMessage
}