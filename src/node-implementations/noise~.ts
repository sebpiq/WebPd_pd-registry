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

import { NodeCodeGenerator } from '@webpd/compiler-js/src/types'
import NODE_ARGUMENTS_TYPES from '../node-arguments-types'

type NoiseTildeCodeGenerator = NodeCodeGenerator<
    NODE_ARGUMENTS_TYPES['_NO_ARGS']
>

// TODO : left inlet ?
// ------------------------------- loop ------------------------------ //
export const loop: NoiseTildeCodeGenerator = (_, { outs, types }) => `
    ${outs.$0} = ${types.FloatType}(Math.random() * 2 - 1)
`