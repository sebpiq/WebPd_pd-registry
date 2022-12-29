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
    NodeImplementation,
} from '@webpd/compiler-js/src/types'
import NODE_ARGUMENTS_TYPES from '../node-arguments-types'

type LoadbangCodeGenerator = NodeCodeGenerator<NODE_ARGUMENTS_TYPES['_NO_ARGS']>
type LoadbangNodeImplementation = NodeImplementation<
    NODE_ARGUMENTS_TYPES['_NO_ARGS']
>

const ASC_MSG_STRING_TOKEN = MSG_DATUM_TYPES_ASSEMBLYSCRIPT[MSG_DATUM_TYPE_STRING]

// ------------------------------ declare ------------------------------ //
export const declare: LoadbangCodeGenerator = (_, {state, macros}) => `
    let ${macros.typedVar(state.init, 'Int')} = 1
`

// ------------------------------- loop ------------------------------ //
export const loop: LoadbangCodeGenerator = (_, {state, outs, macros}) => `
    if (${state.init}) {
        ${state.init} = 0
        const ${macros.typedVar('m', 'Message')} = msg_create([${ASC_MSG_STRING_TOKEN}, 4])
        msg_writeStringDatum(m, 0, 'bang')
        ${outs.$0}.push(m)
    }
`

// ------------------------------------------------------------------- //
export const stateVariables: LoadbangNodeImplementation['stateVariables'] = [
    'init',
]