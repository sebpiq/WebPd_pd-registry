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

import { NodeCodeGenerator, NodeImplementation } from '@webpd/compiler-js/src/types'
import { DspGraph } from '@webpd/dsp-graph'
import { NodeBuilder, validation } from '@webpd/pd-json'

interface NodeArguments { channelCount: number }

// ------------------------------- node builder ------------------------------ //
const builder: NodeBuilder<NodeArguments> = {
    translateArgs: (pdNode) => ({
        channelCount: validation.assertNumber(pdNode.args[0]),
    }),
    build: (nodeArgs) => {
        const inlets: DspGraph.PortletMap = {}
        for (let ch = 0; ch < nodeArgs.channelCount; ch++) {
            const inletId = ch.toString(10)
            inlets[inletId] = { type: 'signal', id: inletId }
        }
        return {
            inlets,
            outlets: {
                '0': { type: 'signal', id: '0' },
            },
        }
    },
}

// ------------------------------- loop ------------------------------ //
const loop: NodeCodeGenerator<NodeArguments> = (node, { ins, outs }) => {
    return `
        ${outs.$0} = ${Object.keys(node.inlets)
        .map((inletId) => ins[inletId])
        .join(' + ')}
    `
}

// ------------------------------------------------------------------- //
const nodeImplementation: NodeImplementation<NodeArguments> = {loop}

export { 
    builder,
    nodeImplementation,
    NodeArguments,
}