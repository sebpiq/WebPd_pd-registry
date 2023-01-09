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
`

// ------------------------------- initialize ------------------------------ //
export const initialize: TabplayTildeCodeGenerator = (
    _,
    {rcvs, state, macros},
) => `
    if (${state.arrayName}.length) {
        const ${macros.typedVar('m', 'Message')} = msg_create([
            MSG_STRING_TOKEN, 3,
            MSG_STRING_TOKEN, ${state.arrayName}.length
        ])
        msg_writeStringToken(m, 0, 'set')
        msg_writeStringToken(m, 1, ${state.arrayName})
        ${rcvs.$0}(m)
    }
`

// ------------------------------- loop ------------------------------ //
export const loop: TabplayTildeCodeGenerator = (
    _,
    {state, snds, outs},
) => `
    if (${state.readPosition} < ${state.readUntil}) {
        ${outs.$0} = ${state.array}[${state.readPosition}]
        ${state.readPosition}++
        if (${state.readPosition} >= ${state.readUntil}) {
            console.log('[tabplay~] END')
            ${snds.$1}(msg_bang())
        }
    } else {
        ${outs.$0} = 0
    }
`

// ------------------------------- messages ------------------------------ //
export const messages: TabplayTildeNodeImplementation['messages'] = (_, {state, types, globs}) => ({
    '0': `
    if (msg_getLength(${globs.m}) === 1) {
        if (
            msg_isStringToken(${globs.m}, 0)
            && msg_readStringToken(${globs.m}, 0) === 'bang'
        ) {
            // TODO : REMOVE, bug
            console.log('[tabplay~] start ' + ${state.arrayName})
            ${state.funcSetArrayName}(${state.arrayName})

            ${state.readPosition} = 0
            ${state.readUntil} = ${state.array}.length
            return 

        } else if (msg_isFloatToken(${globs.m}, 0)) {
            ${state.readPosition} = ${types.Int}(msg_readFloatToken(${globs.m}, 0))
            ${state.readUntil} = ${state.array}.length
            return 
        }
    
    } else if (msg_getLength(${globs.m}) === 2) {
        if (
            msg_isStringToken(${globs.m}, 0)
            && msg_readStringToken(${globs.m}, 0) === 'set'
        ) {
            ${state.funcSetArrayName}(msg_readStringToken(${globs.m}, 1))    
            return

        } else if (
            msg_isFloatToken(${globs.m}, 0)
            && msg_isFloatToken(${globs.m}, 1)
        ) {
            ${state.readPosition} = ${types.Int}(msg_readFloatToken(${globs.m}, 0))
            ${state.readUntil} = ${types.Int}(Math.min(
                ${types.Float}(${state.readPosition}) + msg_readFloatToken(${globs.m}, 1), 
                ${types.Float}(${state.array}.length)
            ))
            return
        }
    }
    throw new Error("Unexpected message")
    `
})


// ------------------------------------------------------------------- //
export const stateVariables: TabplayTildeNodeImplementation['stateVariables'] = () =>
    [
        'array',
        'arrayName',
        'readPosition',
        'readUntil',
        'funcSetArrayName',
        'funcPlay',
    ]