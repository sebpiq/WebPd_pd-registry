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
    MSG_DATUM_TYPE_STRING,
} from '@webpd/compiler-js/src/constants'
import { MSG_DATUM_TYPES_ASSEMBLYSCRIPT } from '@webpd/compiler-js/src/engine-assemblyscript/constants'
import {
    NodeCodeGenerator,
    NodeCodeSnippet,
    NodeImplementation,
} from '@webpd/compiler-js/src/types'
import NODE_ARGUMENTS_TYPES from '../node-arguments-types'

type TabplayTildeCodeGenerator = NodeCodeGenerator<
    NODE_ARGUMENTS_TYPES['tabplay~']
>
type TabplayTildeNodeImplementation = NodeImplementation<
    NODE_ARGUMENTS_TYPES['tabplay~']
>

const ASC_MSG_STRING_TOKEN = MSG_DATUM_TYPES_ASSEMBLYSCRIPT[MSG_DATUM_TYPE_STRING]

// ------------------------------ declare ------------------------------ //
export const declare: TabplayTildeCodeGenerator = (
    _,
    variableNames,
    { snippet },
) => snippetDeclare(snippet, variableNames)

const snippetDeclare: NodeCodeSnippet = (snippet, { state, ins, globs, types }) => snippet`
    let ${state.array}: ${types.FloatArrayType} = new ${types.FloatArrayType}(0)
    let ${state.arrayName}: string = ''
    let ${state.readPosition}: i32
    let ${state.readUntil}: i32

    const ${state.funcSetArrayName} = (arrayName: string): void => {
        ${state.arrayName} = arrayName
        if (!${globs.arrays}.has(arrayName)) {
            ${state.array} = new ${types.FloatArrayType}(0)
        } else {
            ${state.array} = ${globs.arrays}.get(arrayName)
        }
        ${state.readPosition} = ${state.array}.length
        ${state.readUntil} = ${state.array}.length
    }

    const ${state.funcHandleMessage} = (): void => {
        let m: Message = ${ins.$0}.shift()
        
        if (msg_getLength(m) === 1) {
            if (
                msg_isStringToken(m, 0)
                && msg_readStringDatum(m, 0) === 'bang'
            ) {
                // TODO : REMOVE, bug
                console.log('BANG ' + ${state.arrayName})
                ${state.funcSetArrayName}(${state.arrayName})

                ${state.readPosition} = 0
                ${state.readUntil} = ${state.array}.length
                return 

            } else if (msg_isFloatToken(m, 0)) {
                ${state.readPosition} = i32(msg_readFloatDatum(m, 0))
                ${state.readUntil} = ${state.array}.length
                return 
            }
        
        } else if (msg_getLength(m) === 2) {
            if (
                msg_isStringToken(m, 0)
                && msg_readStringDatum(m, 0) === 'set'
            ) {
                ${state.funcSetArrayName}(msg_readStringDatum(m, 1))    
                return

            } else if (
                msg_isFloatToken(m, 0)
                && msg_isFloatToken(m, 1)
            ) {
                ${state.readPosition} = i32(msg_readFloatDatum(m, 0))
                ${state.readUntil} = i32(Math.min(
                    ${types.FloatType}(${state.readPosition}) + msg_readFloatDatum(m, 1), 
                    ${types.FloatType}(${state.array}.length)
                ))
                return
            }
        }
        throw new Error("Unexpected message")
    }
`

// ------------------------------ initialize ------------------------------ //
export const initialize: TabplayTildeCodeGenerator = (
    node,
    variableNames,
    { snippet },
) => snippetInitialize(snippet, {...variableNames, arrayName: node.args.arrayName})

const snippetInitialize: NodeCodeSnippet<{arrayName: string}> = (snippet, { state, ins, types, arrayName }) => snippet`
    ${state.array} = new ${types.FloatArrayType}(0)
    ${state.arrayName} = "${arrayName}"
    ${state.readPosition} = 0
    ${state.readUntil} = 0

    if (${state.arrayName}.length) {
        const m: Message = msg_create([
            ${ASC_MSG_STRING_TOKEN}, 3,
            ${ASC_MSG_STRING_TOKEN}, ${state.arrayName}.length
        ])
        msg_writeStringDatum(m, 0, 'set')
        msg_writeStringDatum(m, 1, ${state.arrayName})
        ${ins.$0}.push(m)
    }
`

// ------------------------------- loop ------------------------------ //
export const loop: TabplayTildeCodeGenerator = (
    _,
    variableNames,
    { snippet },
) => snippetLoop(snippet, variableNames)

export const snippetLoop: NodeCodeSnippet = (
    snippet,
    { state, ins, outs },
) => snippet`
    while (${ins.$0}.length) {
        ${state.funcHandleMessage}()
    }

    if (${state.readPosition} < ${state.readUntil}) {
        ${outs.$0} = ${state.array}[${state.readPosition}]
        ${state.readPosition}++
        if (${state.readPosition} >= ${state.readUntil}) {
            const m: Message = msg_create([
                ${ASC_MSG_STRING_TOKEN}, 4
            ])
            msg_writeStringDatum(m, 0, 'bang')
            ${outs.$1}.push(m)
        }
    } else {
        ${outs.$0} = 0
    }
`

// ------------------------------------------------------------------- //
export const stateVariables: TabplayTildeNodeImplementation['stateVariables'] =
    [
        'array',
        'arrayName',
        'readPosition',
        'readUntil',
        'funcSetArrayName',
        'funcPlay',
        'funcHandleMessage',
    ]

export const snippets = { snippetDeclare, snippetInitialize, snippetLoop }