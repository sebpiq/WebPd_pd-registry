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

import { MSG_DATUM_TYPE_STRING } from '@webpd/compiler-js/src/constants'
import { MSG_DATUM_TYPES_ASSEMBLYSCRIPT } from '@webpd/compiler-js/src/engine-assemblyscript/constants'
import {
    NodeCodeGenerator,
    NodeCodeSnippet,
    NodeImplementation,
} from '@webpd/compiler-js/src/types'
import NODE_ARGUMENTS_TYPES from '../node-arguments-types'

type MetroCodeGenerator = NodeCodeGenerator<NODE_ARGUMENTS_TYPES['metro']>
type MetroNodeImplementation = NodeImplementation<NODE_ARGUMENTS_TYPES['metro']>

const ASC_MSG_STRING_TOKEN = MSG_DATUM_TYPES_ASSEMBLYSCRIPT[MSG_DATUM_TYPE_STRING]

// ------------------------------ declare ------------------------------ //
export const declare: MetroCodeGenerator = (_, variableNames, { snippet }) => declareSnippet(snippet, variableNames)

const declareSnippet: NodeCodeSnippet = (snippet, {state, types, globs, ins }) => 
    // TODO : more complex ways to set rate
    // Time units are all expressed in frames here
    snippet`
        let ${state.rate}: ${types.FloatType}
        let ${state.nextTick}: i32
        let ${state.realNextTick}: ${types.FloatType}

        const ${state.funcSetRate} = (rate: ${types.FloatType}): void => {
            ${state.rate} = rate / 1000 * ${globs.sampleRate}
        }

        const ${state.funcHandleMessage0} = (): void => {
            let m = ${ins.$0}.shift()
            if (msg_getLength(m) === 1) {
                if (
                    (msg_isFloatToken(m, 0) && msg_readFloatDatum(m, 0) === 0)
                    || (msg_isStringToken(m, 0) && msg_readStringDatum(m, 0) === 'stop')
                ) {
                    ${state.nextTick} = 0
                    ${state.realNextTick} = 0
                    return

                } else if (
                    msg_isFloatToken(m, 0)
                    || (msg_isStringToken(m, 0) && msg_readStringDatum(m, 0) === 'bang')
                ) {
                    ${state.nextTick} = ${globs.frame}
                    ${state.realNextTick} = ${types.FloatType}(${globs.frame})
                    return
                }
            }
            throw new Error("Unexpected message")
        }

        const ${state.funcHandleMessage1} = (): void => {
            let m = ${ins.$1}.shift()
            if (msg_getLength(m) === 1 && msg_isFloatToken(m, 0)) {
                ${state.funcSetRate}(msg_readFloatDatum(m, 0))
                
            } else {
                throw new Error("Unexpected message")
            }
        }
    `


// ------------------------------ initialize ------------------------------ //
export const initialize: MetroCodeGenerator = (node, variableNames, { snippet }) => {
    const rate = node.args.rate === undefined ? -1 : node.args.rate
    return initializeSnippet(snippet, {...variableNames, rate: rate.toString()})
}

const initializeSnippet: NodeCodeSnippet<{rate: string}> = (snippet, { state, rate }) =>
    snippet`
        ${state.rate} = 0
        ${state.nextTick} = -1
        ${state.realNextTick} = -1
        if (${rate} > 0) {
            ${state.funcSetRate}(${rate})
        }
    `

// ------------------------------- loop ------------------------------ //
export const loop: MetroCodeGenerator = (_, variableNames, { snippet }) => 
    loopSnippet(snippet, variableNames)

const loopSnippet: NodeCodeSnippet = (snippet, { state, ins, outs, globs  }) =>
    snippet`
        while (${ins.$1}.length) {
            ${state.funcHandleMessage1}()
        }
        while (${ins.$0}.length) {
            ${state.funcHandleMessage0}()
        }
        if (${globs.frame} === ${state.nextTick}) {
            const m: Message = msg_create([${ASC_MSG_STRING_TOKEN}, 4])
            msg_writeStringDatum(m, 0, 'bang')
            ${outs.$0}.push(m)
            ${state.realNextTick} = ${state.realNextTick} + ${state.rate}
            ${state.nextTick} = i32(Math.round(${state.realNextTick}))
        }
    `

// ------------------------------------------------------------------- //
export const stateVariables: MetroNodeImplementation['stateVariables'] = [
    'rate',
    'nextTick',
    'realNextTick',
    'funcSetRate',
    'funcHandleMessage0',
    'funcHandleMessage1',
]

export const snippets = { declareSnippet, initializeSnippet, loopSnippet }