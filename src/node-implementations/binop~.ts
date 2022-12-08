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
    NodeImplementation,
    NodeImplementations,
} from '@webpd/compiler-js'
import NODE_ARGUMENTS_TYPES from '../node-arguments-types'

type BinopTildeCodeGenerator = NodeCodeGenerator<
    NODE_ARGUMENTS_TYPES['_BINOP_TILDE']
>
type BinopTildeNodeImplementation = NodeImplementation<
    NODE_ARGUMENTS_TYPES['_BINOP_TILDE']
>

// ------------------------------ declare ------------------------------ //
export const makeDeclare = (): BinopTildeCodeGenerator => (...args) => {
    const [node] = args
    return _hasSignalInput(node)
        ? declareSignal(...args)
        : declareMessage(...args)
}

const declareSignal: BinopTildeCodeGenerator = () => ``

const declareMessage: BinopTildeCodeGenerator = (_, { state, macros }) =>
    `let ${macros.typedVarFloat(state.rightOp)}`

// ------------------------------ initialize ------------------------------ //
export const makeInitialize = (
    defaultValue: number
): BinopTildeCodeGenerator => (...args) => {
    const [node] = args
    const initializeSignal = makeInitializeSignal(defaultValue)
    const initializeMessage = makeInitializeMessage(defaultValue)
    return _hasSignalInput(node)
        ? initializeSignal(...args)
        : initializeMessage(...args)
}

const makeInitializeSignal = (
    defaultValue: number
): BinopTildeCodeGenerator => (node, { ins }) =>
    `${ins.$1_signal} = ${node.args.value || defaultValue}`

const makeInitializeMessage = (
    defaultValue: number
): BinopTildeCodeGenerator => (node, { state }) =>
    `${state.rightOp} = ${
        node.args.value ? node.args.value.toString(10) : defaultValue
    }`

// ------------------------------- loop ------------------------------ //
export const makeLoop = (operator: string): BinopTildeCodeGenerator => {
    const loopSignal = makeLoopSignal(operator)
    const loopMessage = makeLoopMessage(operator)
    return (...args) => {
        const [node] = args
        return _hasSignalInput(node)
            ? loopSignal(...args)
            : loopMessage(...args)
    }
}

const makeLoopSignal = (operator: string): BinopTildeCodeGenerator => (
    _,
    { ins, outs }
) => `${outs.$0} = ${ins.$0} ${operator} ${ins.$1_signal}`

const makeLoopMessage = (operator: string): BinopTildeCodeGenerator => (
    _,
    { ins, outs, state, macros }
) =>
    // prettier-ignore
    `
        if (${ins.$1_message}.length) {
            const ${macros.typedVarMessage('inMessage')} = ${ins.$1_message}.pop()
            ${state.rightOp} = ${macros.readMessageFloatDatum('inMessage', 0)}
        }
        ${outs.$0} = ${ins.$0} ${operator} ${state.rightOp}
    `

// ------------------------------------------------------------------- //
export const stateVariables: BinopTildeNodeImplementation['stateVariables'] = [
    'rightOp',
]

const _hasSignalInput = (node: DspGraph.Node) =>
    node.sources['1_signal'] && node.sources['1_signal'].length

const binopTilde: NodeImplementations = {
    '+~': {
        initialize: makeInitialize(0),
        declare: makeDeclare(),
        loop: makeLoop('+'),
        stateVariables,
    },
    '*~': {
        initialize: makeInitialize(1),
        declare: makeDeclare(),
        loop: makeLoop('*'),
        stateVariables,
    },
}

export default binopTilde
