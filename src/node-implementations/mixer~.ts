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

import { NodeCodeGenerator } from '@webpd/compiler-js'
import NODE_ARGUMENTS_TYPES from '../node-arguments-types'

type MixerTildeCodeGenerator = NodeCodeGenerator<NODE_ARGUMENTS_TYPES['mixer~']>

// ------------------------------- loop ------------------------------ //
export const loop: MixerTildeCodeGenerator = (node, { ins, outs }) => {
    return `
        ${outs.$0} = ${Object.keys(node.inlets)
        .map((inletId) => ins[inletId])
        .join(' + ')}
    `
}