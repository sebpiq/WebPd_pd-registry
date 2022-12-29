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

import { DspGraph } from '@webpd/dsp-graph'
import {
    NodeCodeGenerator,
    NodeCodeSnippet,
    NodeImplementation,
    NodeImplementations,
} from '@webpd/compiler-js/src/types'
import NODE_ARGUMENTS_TYPES from '../node-arguments-types'

type BinopTildeCodeGenerator = NodeCodeGenerator<
    NODE_ARGUMENTS_TYPES['_BINOP_TILDE']
>
type BinopTildeNodeImplementation = NodeImplementation<
    NODE_ARGUMENTS_TYPES['_BINOP_TILDE']
>

// ------------------------------ declare ------------------------------ //
export const makeDeclare =
    (): BinopTildeCodeGenerator =>
        (node, variableNames, {snippet}) =>
            _hasSignalInput(node)
                ? ''
                : declareMessage(snippet, variableNames)

const declareMessage: NodeCodeSnippet = (snippet, { state, types }) =>
    snippet`let ${state.rightOp}: ${types.FloatType}`

// ------------------------------ initialize ------------------------------ //
export const makeInitialize =
    (defaultValue: number): BinopTildeCodeGenerator =>
        (node, variableNames, {snippet}) => {
            const initialValue = (node.args.value || defaultValue).toString(10)
            return _hasSignalInput(node)
                ? signalInitializeSnippet(snippet, {...variableNames, initialValue})
                : messageInitializeSnippet(snippet, {...variableNames, initialValue})
        }

const signalInitializeSnippet: NodeCodeSnippet<{ initialValue: string }> = (snippet, { ins, initialValue }) =>
    snippet`${ins.$1_signal} = ${initialValue}`

const messageInitializeSnippet: NodeCodeSnippet<{ initialValue: string }> = (snippet, { state, initialValue }) =>
    snippet`${state.rightOp} = ${initialValue}`


// ------------------------------- loop ------------------------------ //
export const makeLoop = (operatorSnippet: NodeCodeSnippet<{ rightOp: string }>): BinopTildeCodeGenerator => {
    return (node, variableNames, { snippet }) =>
        _hasSignalInput(node)
            ? operatorSnippet(snippet, { ...variableNames, rightOp: variableNames.ins.$1_signal })
            : `
                ${loopMessageSnippet(snippet, variableNames)}
                ${operatorSnippet(snippet, {...variableNames, rightOp: variableNames.state.rightOp})}
            `
}

const loopMessageSnippet: NodeCodeSnippet = (snippet, { ins, state }) =>
    // prettier-ignore
    snippet`
        if (${ins.$1_message}.length) {
            ${state.rightOp} = msg_readFloatDatum(${ins.$1_message}.pop(), 0)
        }
    `

const addSnippet: NodeCodeSnippet<{ rightOp: string }> = (snippet, { ins, outs, rightOp }) =>
    snippet`${outs.$0} = ${ins.$0} + ${rightOp}`

const multSnippet: NodeCodeSnippet<{ rightOp: string }> = (snippet, { ins, outs, rightOp }) =>
    snippet`${outs.$0} = ${ins.$0} * ${rightOp}`

// ------------------------------------------------------------------- //
export const stateVariables: BinopTildeNodeImplementation['stateVariables'] = [
    'rightOp',
]

const _hasSignalInput = (node: DspGraph.Node) =>
    node.sources['1_signal'] && node.sources['1_signal'].length

const snippets = { declareMessage, signalInitializeSnippet, messageInitializeSnippet, loopMessageSnippet, addSnippet, multSnippet }

const binopTilde: NodeImplementations = {
    '+~': {
        initialize: makeInitialize(0),
        declare: makeDeclare(),
        loop: makeLoop(addSnippet),
        stateVariables,
        snippets
    },
    '*~': {
        initialize: makeInitialize(1),
        declare: makeDeclare(),
        loop: makeLoop(multSnippet),
        stateVariables,
        snippets
    },
}

export default binopTilde
