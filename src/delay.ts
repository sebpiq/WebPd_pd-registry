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

interface NodeArguments { 
    delay: number,
    unitAmount: number,
    unit: string,
}

// TODO : abstract funcSetUnit for reusability
// TODO : alias [del]
// ------------------------------- node builder ------------------------------ //
const builder: NodeBuilder<NodeArguments> = {
    translateArgs: (pdNode) => ({
        delay: validation.assertOptionalNumber(pdNode.args[0]) || 0,
        unitAmount: validation.assertOptionalNumber(pdNode.args[1]) || 1,
        unit: validation.assertOptionalString(pdNode.args[2]) || 'msec',
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
        let ${macros.typedVar(state.sampleRatio, 'Float')} = 1
        let ${macros.typedVar(state.scheduledBang, 'Int')} = -1

        const ${state.funcSetDelay} = ${macros.typedFuncHeader([
            macros.typedVar('delay', 'Float')
        ], 'void')} => {
            ${state.delay} = Math.max(0, delay * ${state.sampleRatio})
        }

        const ${state.funcScheduleDelay} = ${macros.typedFuncHeader([
        ], 'void')} => {
            ${state.scheduledBang} = ${types.Int}(Math.round(
                ${globs.frame} + ${state.delay} * ${state.sampleRatio}))
        }

        const ${state.funcStopDelay} = ${macros.typedFuncHeader([], 'void')} => {
            ${state.scheduledBang} = -1
        }

        const ${state.funcSetUnit} = ${macros.typedFuncHeader([
            macros.typedVar('amount', 'Float'),
            macros.typedVar('unit', 'string'),
        ], 'void')} => {
            if (unit === 'msec' || unit === 'millisecond') {
                ${state.sampleRatio} = amount / 1000 * ${globs.sampleRate}
            } else if (unit === 'sec' || unit === 'seconds' || unit === 'second') {
                ${state.sampleRatio} = amount * ${globs.sampleRate}
            } else if (unit === 'min' || unit === 'minutes' || unit === 'minute') {
                ${state.sampleRatio} = amount * 60 * ${globs.sampleRate}
            } else if (unit === 'samp' || unit === 'samples' || unit === 'sample') {
                ${state.sampleRatio} = amount
            } else {
                throw new Error("invalid time unit : " + unit)
            }
        }
    `

// ------------------------------ initialize ------------------------------ //
const initialize: NodeCodeGenerator<NodeArguments> = (node, {state}) => `
    ${state.funcSetUnit}(${node.args.unitAmount}, "${node.args.unit}")
    ${state.funcSetDelay}(${node.args.delay})
`

// ------------------------------ messages ------------------------------ //
const messages: NodeImplementation<NodeArguments>['messages'] = (node, {state, globs, macros}) => ({
    '0': `
        if (msg_getLength(${globs.m}) === 1) {
            if (msg_isStringToken(${globs.m}, 0)) {
                const ${macros.typedVar('action', 'string')} = msg_readStringToken(${globs.m}, 0)
                if (action === 'bang' || action === 'start') {
                    ${state.funcScheduleDelay}()
                    return
                } else if (action === 'stop') {
                    ${state.funcStopDelay}()
                    return
                }
                
            } else if (msg_isFloatToken(${globs.m}, 0)) {
                ${state.funcSetDelay}(msg_readFloatToken(${globs.m}, 0))
                ${state.funcScheduleDelay}()
                return 
            }
        
        } else if (
            msg_isMatching(${globs.m}, [MSG_STRING_TOKEN, MSG_FLOAT_TOKEN, MSG_STRING_TOKEN])
            && msg_readStringToken(${globs.m}, 0) === 'tempo'
        ) {
            ${state.funcSetUnit}(
                msg_readFloatToken(${globs.m}, 1), 
                msg_readStringToken(${globs.m}, 2)
            )
            return
        }
        throw new Error("${node.type} <${node.id}> inlet <0_message> invalid message received.")
    `,
    '1': `
        if (msg_isMatching(${globs.m}, [MSG_FLOAT_TOKEN])) {
            ${state.funcSetDelay}(msg_readFloatToken(${globs.m}, 0))
            return
        }
        throw new Error("${node.type} <${node.id}> inlet <1_message> invalid message received.")
    `
})

// ------------------------------- loop ------------------------------ //
// We're careful to remove multiple bang at the same frame.
const loop: NodeCodeGenerator<NodeArguments> = (_, {state, snds, globs}) => `
    if (
        ${state.scheduledBang} > -1 
        && ${state.scheduledBang} <= ${globs.frame}
    ) {
        ${snds.$0}(msg_bang())
        ${state.scheduledBang} = -1
    }
`

// ------------------------------------------------------------------- //
const stateVariables: NodeImplementation<NodeArguments>['stateVariables'] = () => [
    'funcSetDelay',
    'funcScheduleDelay',
    'funcStopDelay',
    'funcSetUnit',
    'delay',
    'scheduledBang',
    'sampleRatio',
]

const nodeImplementation: NodeImplementation<NodeArguments> = {declare, initialize, messages, loop, stateVariables}

export { 
    builder,
    nodeImplementation,
    NodeArguments,
}