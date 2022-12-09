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
import { DspGraph } from '@webpd/dsp-graph'
import NODE_ARGUMENTS_TYPES from '../node-arguments-types'

type MsgCodeGenerator = NodeCodeGenerator<NODE_ARGUMENTS_TYPES['msg']>

// ------------------------------- loop ------------------------------ //
export const loop: MsgCodeGenerator = (node, { ins, outs, macros }) => {
    const template = node.args.template as Array<DspGraph.NodeArgument>

    return `
        while (${ins.$0}.length) {
            const ${macros.typedVarMessage('inMessage')} = ${ins.$0}.shift()
            ${macros.messageTransfer(template, 'inMessage', 'outMessage')}
            ${outs.$0}.push(outMessage)
        }
    `
}
