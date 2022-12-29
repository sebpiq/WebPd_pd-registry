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
    NodeCodeSnippet,
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
export const declare: OscTildeCodeGenerator = (node, variableNames, {snippet}) => {
    return _hasSignalInput(node)
        ? declareSignal(snippet, variableNames)
        : declareMessage(snippet, variableNames)
}

const declareSignal: NodeCodeSnippet = (snippet, { state, types }) => snippet`
    let ${state.phase}: ${types.FloatType}
    let ${state.J}: ${types.FloatType}
`

const declareMessage: NodeCodeSnippet = (snippet, { state, globs, types }) => snippet`
    let ${state.phase}: ${types.FloatType}
    let ${state.currentFrequency}: ${types.FloatType}
    let ${state.K}: ${types.FloatType}
    const ${state.refreshK} = (): void => 
        ${state.K} = ${state.currentFrequency} * 2 * Math.PI / ${globs.sampleRate}
`

// ------------------------------ initialize ------------------------------ //
export const initialize: OscTildeCodeGenerator = (node, variableNames, {snippet}) => {
    const frequency = (node.args.frequency || 0).toString()
    return _hasSignalInput(node)
        ? initializeSignal(snippet, {...variableNames, frequency})
        : initializeMessage(snippet, {...variableNames, frequency})
}

const initializeSignal: NodeCodeSnippet<{frequency: string}> = (
    snippet,
    { ins, state, globs, frequency },
) => snippet`
    ${state.phase} = 0
    ${state.J} = 2 * Math.PI / ${globs.sampleRate}
    ${ins.$0_signal} = ${frequency}
`

const initializeMessage: NodeCodeSnippet<{frequency: string}> = (snippet, { state, frequency }) => snippet`
    ${state.phase} = 0
    ${state.currentFrequency} = ${frequency}
    ${state.K} = 0
    ${state.refreshK}()
`

// ------------------------------- loop ------------------------------ //
export const loop: OscTildeCodeGenerator = (node, variableNames, {snippet}) => {
    return _hasSignalInput(node) 
        ? loopSignal(snippet, variableNames) 
        : loopMessage(snippet, variableNames)
}

const loopSignal: NodeCodeSnippet = (snippet, { state, ins, outs }) => snippet`
    if (${ins.$1}.length) {
        ${state.phase} = msg_readFloatDatum(${ins.$1}.pop(), 0) % 1.0 * 2 * Math.PI
    }
    ${outs.$0} = Math.cos(${state.phase})
    ${state.phase} += ${state.J} * ${ins.$0_signal}
`

// Take only the last received frequency message (first in the list)
const loopMessage: NodeCodeSnippet = (
    snippet,
    { state, ins, outs },
) => snippet`
    if (${ins.$0_message}.length) {
        ${state.currentFrequency} = msg_readFloatDatum(${ins.$0_message}.pop(), 0)
        ${state.refreshK}()
    }
    if (${ins.$1}.length) {
        ${state.phase} = msg_readFloatDatum(${ins.$1}.pop(), 0) % 1.0 * 2 * Math.PI
    }
    ${outs.$0} = Math.cos(${state.phase})
    ${state.phase} += ${state.K}
`

// ------------------------------------------------------------------- //
export const stateVariables: OscTildeNodeImplementation['stateVariables'] = [
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