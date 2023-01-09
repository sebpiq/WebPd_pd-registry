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
} from '@webpd/compiler-js/src/types'
import NODE_ARGUMENTS_TYPES from '../node-arguments-types'

type BinopTildeCodeGenerator = NodeCodeGenerator<
    NODE_ARGUMENTS_TYPES['_BINOP_TILDE']
>
type BinopTildeNodeImplementation = NodeImplementation<
    NODE_ARGUMENTS_TYPES['_BINOP_TILDE']
>

// ------------------------------ declare ------------------------------ //
const declare: BinopTildeCodeGenerator = (node, {state, macros}) =>
    _hasSignalInput(node)
        ? ''
        : `
            let ${macros.typedVar(state.rightOp, 'Float')}
        `

// ------------------------------ initialize ------------------------------ //
export const makeInitialize =
    (defaultValue: number): BinopTildeCodeGenerator =>
        (node, {ins, state}) => {
            const initialValue = (node.args.value || defaultValue).toString(10)
            return _hasSignalInput(node)
                ? `${ins.$1_signal} = ${initialValue}`
                : `${state.rightOp} = ${initialValue}`
        }

// ------------------------------- loop ------------------------------ //
export const makeLoop = (operator: string): BinopTildeCodeGenerator => {
    return (node, {ins, outs, state}) =>
        _hasSignalInput(node)
            ? `${outs.$0} = ${ins.$0} ${operator} ${ins.$1_signal}`
            : `${outs.$0} = ${ins.$0} ${operator} ${state.rightOp}`
}

// ------------------------------- messages ------------------------------ //
const messages: BinopTildeNodeImplementation['messages'] = (node, {state, globs}) => ({
    '1_message': !_hasSignalInput(node) ? `
        ${state.rightOp} = msg_readFloatToken(${globs.m}, 0)
    `: ''
})

// ------------------------------------------------------------------- //
export const stateVariables: BinopTildeNodeImplementation['stateVariables'] = () => [
    'rightOp'
]

const _hasSignalInput = (node: DspGraph.Node) =>
    node.sources['1_signal'] && node.sources['1_signal'].length

const binopTilde: NodeImplementations = {
    '+~': {
        initialize: makeInitialize(0),
        declare,
        loop: makeLoop('+'),
        messages,
        stateVariables,
    },
    '*~': {
        initialize: makeInitialize(1),
        declare,
        loop: makeLoop('*'),
        messages,
        stateVariables,
    },
}

export default binopTilde
