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
            const dacInletIds = new Set<number>()
            patch.connections.forEach((connection) => {
                if (connection.sink.nodeId === pdNode.id) {
                    dacInletIds.add(connection.sink.portletId)
                }
            })
            const maxInlet = Math.max(...dacInletIds)
            channelMapping = []
            for (let channel = 0; channel <= maxInlet; channel++) {
                channelMapping.push(channel)
            }
        }
        return { channelMapping }
    },
    build: (nodeArgs) => ({
        inlets: nodeArgs.channelMapping.reduce((inlets, _, i) => {
            return {
                ...inlets,
                [i]: { type: 'signal', id: i.toString() },
            }
        }, {} as DspGraph.PortletMap),
        outlets: {},
        isSignalSink: true,
    }),
}

// ------------------------------- loop ------------------------------ //
// TODO : set message not supported
const loop: NodeCodeGenerator<NodeArguments> = (
    node,
    { ins, globs },
    { audioSettings, target }
) => {
    let loopStr = ''
    const defaultChannelMapping: Array<number> = []
    for (let channel = 0; channel < audioSettings.channelCount.out; channel++) {
        defaultChannelMapping.push(channel)
    }
    // Map node inlet to corresponding destination channel
    const channelMapping: Array<number> =
        node.args.channelMapping || defaultChannelMapping
    for (let i = 0; i < channelMapping.length; i++) {
        const destination = channelMapping[i]
        // Ignore channels that are out of bounds
        if (destination < 0 || audioSettings.channelCount.out <= destination) {
            continue
        }
        if (target === 'javascript') {
            loopStr += `\n${globs.output}[${destination}][${globs.iterFrame}] = ${ins[`${i}`]}`
        } else {
            loopStr += `\n${globs.output}[${globs.iterFrame} + ${globs.blockSize} * ${destination}] = ${ins[`${i}`]}`
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