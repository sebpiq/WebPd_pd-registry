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

import { NodeCodeGenerator, NodeImplementation } from '@webpd/compiler-js'
import NODE_ARGUMENTS_TYPES from '../node-arguments-types'

type LoadbangCodeGenerator = NodeCodeGenerator<NODE_ARGUMENTS_TYPES['_NO_ARGS']>
type LoadbangNodeImplementation = NodeImplementation<
    NODE_ARGUMENTS_TYPES['_NO_ARGS']
>

// ------------------------------ declare ------------------------------ //
export const declare: LoadbangCodeGenerator = (_, { state, macros }) => `
    let ${macros.typedVarInt(state.init)}
`

// ------------------------------ initialize ------------------------------ //
export const initialize: LoadbangCodeGenerator = (_, { state }) => `
    ${state.init} = 1
`

// ------------------------------- loop ------------------------------ //
export const loop: LoadbangCodeGenerator = (_, { outs, state, macros }) => {
    return `
        if (${state.init}) {
            ${state.init} = 0
            ${macros.createMessage('m', ['bang'])}
            ${outs.$0}.push(m)
        }
    `
}

// ------------------------------------------------------------------- //
export const stateVariables: LoadbangNodeImplementation['stateVariables'] = [
    'init',
]
