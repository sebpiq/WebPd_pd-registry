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
import { NodeBuilder, validation } from '@webpd/pd-json'

interface NodeArguments { value?: number }

// ------------------------------- node builder ------------------------------ //
const builder: NodeBuilder<NodeArguments> = {
    translateArgs: (pdNode) => ({
        value: validation.assertOptionalNumber(pdNode.args[0]),
    }),
    build: () => ({
        inlets: {
            '0': { type: 'signal', id: '0' },
            '1_message': { type: 'message', id: '1_message' },
            '1_signal': { type: 'signal', id: '1_signal' },
        },
        outlets: {
            '0': { type: 'signal', id: '0' },
        },
    }),
    rerouteConnectionIn: (outlet, inletId): DspGraph.PortletId => {
        if (inletId === '1') {
            return outlet.type === 'message' ? '1_message' : '1_signal'
        }
        return undefined
    },
}

// ------------------------------ declare ------------------------------ //
const declare: NodeCodeGenerator<NodeArguments> = (node, {state, macros}) =>
    _hasSignalInput(node)
        ? ''
        : `
            let ${macros.typedVar(state.rightOp, 'Float')}
        `

// ------------------------------ initialize ------------------------------ //
const makeInitialize =
    (defaultValue: number): NodeCodeGenerator<NodeArguments> =>
        (node, {ins, state}) => {
            const initialValue = (node.args.value || defaultValue).toString(10)
            return _hasSignalInput(node)
                ? `${ins.$1_signal} = ${initialValue}`
                : `${state.rightOp} = ${initialValue}`
        }

// ------------------------------- loop ------------------------------ //
const makeLoop = (operator: string): NodeCodeGenerator<NodeArguments> => {
    return (node, {ins, outs, state}) =>
        _hasSignalInput(node)
            ? `${outs.$0} = ${ins.$0} ${operator} ${ins.$1_signal}`
            : `${outs.$0} = ${ins.$0} ${operator} ${state.rightOp}`
}

// ------------------------------- messages ------------------------------ //
const messages: NodeImplementation<NodeArguments>['messages'] = (node, {state, globs}) => ({
    '1_message': !_hasSignalInput(node) ? `
        ${state.rightOp} = msg_readFloatToken(${globs.m}, 0)
    `: ''
})

// ------------------------------------------------------------------- //
const stateVariables: NodeImplementation<NodeArguments>['stateVariables'] = () => [
    'rightOp'
]

const _hasSignalInput = (node: DspGraph.Node<NodeArguments>) =>
    node.sources['1_signal'] && node.sources['1_signal'].length


const nodeImplementations: NodeImplementations = {
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

export { 
    builder,
    nodeImplementations,
    NodeArguments,
}
