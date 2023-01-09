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

interface NodeArguments { channelMapping: Array<number> }

// ------------------------------- node builder ------------------------------ //
const builder: NodeBuilder<NodeArguments> = {
    translateArgs: (pdNode, patch) => {
        let channelMapping: Array<number>
        if (pdNode.args.length) {
            // Channels are provided as 1-indexed, so we translate them back to 0-indexed.
            channelMapping = pdNode.args.map(
                (channel) => validation.assertNumber(channel) - 1
            )
        } else {
            // If no channel is provided, since a patch doesn't contain the channel count info,
            // we just guess the `channelMapping` according to inlets that are defined on the dac.
            const adcOutletIds = new Set<number>()
            patch.connections.forEach((connection) => {
                if (connection.source.nodeId === pdNode.id) {
                    adcOutletIds.add(connection.source.portletId)
                }
            })
            const maxOutlet = Math.max(...adcOutletIds)
            channelMapping = []
            for (let channel = 0; channel <= maxOutlet; channel++) {
                channelMapping.push(channel)
            }
        }
        return { channelMapping }
    },
    build: (nodeArgs) => ({
        inlets: {},
        outlets: nodeArgs.channelMapping.reduce((outlets, _, i) => {
            return {
                ...outlets,
                [i]: { type: 'signal', id: i.toString() },
            }
        }, {} as DspGraph.PortletMap),
    }),
}

// ------------------------------- loop ------------------------------ //
// TODO : set message not supported
const loop: NodeCodeGenerator<NodeArguments> = (
    node,
    {outs, globs},
    { audioSettings, target }
) => {
    let loopStr = ''
    const defaultChannelMapping: Array<number> = []
    for (let channel = 0; channel < audioSettings.channelCount.in; channel++) {
        defaultChannelMapping.push(channel)
    }
    // Map source channel to corresponding node outlet
    const channelMapping: Array<number> =
        node.args.channelMapping || defaultChannelMapping
    for (let i = 0; i < channelMapping.length; i++) {
        const source = channelMapping[i]
        // Ignore channels that are out of bounds
        if (source < 0 || audioSettings.channelCount.in <= source) {
            continue
        }
        if (target === 'javascript') {
            loopStr += `\n${outs[`${i}`]} = ${globs.input}[${source}][${globs.iterFrame}]`
        } else {
            loopStr += `\n${outs[`${i}`]} = ${globs.input}[${globs.iterFrame} + ${globs.blockSize} * ${source}]`
        }
    }
    return loopStr + '\n'
}

// ------------------------------------------------------------------- //
const nodeImplementation: NodeImplementation<NodeArguments> = {loop}

export { 
    builder,
    nodeImplementation,
    NodeArguments,
}