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
import NODE_ARGUMENTS_TYPES from '../node-arguments-types'

type TabplayTildeCodeGenerator = NodeCodeGenerator<
    NODE_ARGUMENTS_TYPES['tabplay~']
>
type TabplayTildeNodeImplementation = NodeImplementation<
    NODE_ARGUMENTS_TYPES['tabplay~']
>

// ------------------------------ declare ------------------------------ //
export const declare: TabplayTildeCodeGenerator = (
    node,
    {state, types, globs, macros},
) => `
    let ${macros.typedVar(state.array, 'FloatArray')} = new ${types.FloatArray}(0)
    let ${macros.typedVar(state.arrayName, 'string')} = "${node.args.arrayName}"
    let ${macros.typedVar(state.readPosition, 'Int')} = 0
    let ${macros.typedVar(state.readUntil, 'Int')} = 0

    const ${state.funcSetArrayName} = ${macros.typedFuncHeader([
        macros.typedVar('arrayName', 'string')
    ], 'void')} => {
        ${state.arrayName} = arrayName
        if (!${globs.arrays}.has(arrayName)) {
            ${state.array} = new ${types.FloatArray}(0)
        } else {
            ${state.array} = ${globs.arrays}.get(arrayName)
        }
        ${state.readPosition} = ${state.array}.length
        ${state.readUntil} = ${state.array}.length
    }

    const ${state.funcHandleMessage0} = ${macros.typedFuncHeader([
        macros.typedVar('m', 'Message')
    ], 'void')} => {
        
        if (msg_getLength(m) === 1) {
            if (
                msg_isStringToken(m, 0)
                && msg_readStringToken(m, 0) === 'bang'
            ) {
                // TODO : REMOVE, bug
                console.log('BANG ' + ${state.arrayName})
                ${state.funcSetArrayName}(${state.arrayName})

                ${state.readPosition} = 0
                ${state.readUntil} = ${state.array}.length
                return 

            } else if (msg_isFloatToken(m, 0)) {
                ${state.readPosition} = ${types.Int}(msg_readFloatToken(m, 0))
                ${state.readUntil} = ${state.array}.length
                return 
            }
        
        } else if (msg_getLength(m) === 2) {
            if (
                msg_isStringToken(m, 0)
                && msg_readStringToken(m, 0) === 'set'
            ) {
                ${state.funcSetArrayName}(msg_readStringToken(m, 1))    
                return

            } else if (
                msg_isFloatToken(m, 0)
                && msg_isFloatToken(m, 1)
            ) {
                ${state.readPosition} = ${types.Int}(msg_readFloatToken(m, 0))
                ${state.readUntil} = ${types.Int}(Math.min(
                    ${types.Float}(${state.readPosition}) + msg_readFloatToken(m, 1), 
                    ${types.Float}(${state.array}.length)
                ))
                return
            }
        }
        throw new Error("Unexpected message")
    }
`

// ------------------------------- initialize ------------------------------ //
export const initialize: TabplayTildeCodeGenerator = (
    _,
    {ins, state, macros},
) => `
    if (${state.arrayName}.length) {
        const ${macros.typedVar('m', 'Message')} = msg_create([
            MSG_TOKEN_TYPE_STRING, 3,
            MSG_TOKEN_TYPE_STRING, ${state.arrayName}.length
        ])
        msg_writeStringToken(m, 0, 'set')
        msg_writeStringToken(m, 1, ${state.arrayName})
        ${ins.$0}.push(m)
    }
`

// ------------------------------- loop ------------------------------ //
export const loop: TabplayTildeCodeGenerator = (
    _,
    {ins, state, outs, macros},
) => `
    while (${ins.$0}.length) {
        ${state.funcHandleMessage0}(${ins.$0}.shift())
    }

    if (${state.readPosition} < ${state.readUntil}) {
        ${outs.$0} = ${state.array}[${state.readPosition}]
        ${state.readPosition}++
        if (${state.readPosition} >= ${state.readUntil}) {
            const ${macros.typedVar('m', 'Message')} = msg_create([
                MSG_TOKEN_TYPE_STRING, 4
            ])
            msg_writeStringToken(m, 0, 'bang')
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
        'funcHandleMessage0',
    ]