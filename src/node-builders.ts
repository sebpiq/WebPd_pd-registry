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

import { DspGraph } from '@webpd/dsp-graph'
import { NodeBuilder, PdJson, pdJsonHelpers, validation } from '@webpd/pd-json'
import NODE_ARGUMENTS_TYPES from './node-arguments-types'

// Same builder for [+~], [*~], etc ...
const binaryOperatortildeBuilder: NodeBuilder<
    NODE_ARGUMENTS_TYPES['_BINOP_TILDE']
> = {
    translateArgs: (pdNode) => ({
        value: validation.assertNumber(pdNode.args[0]),
    }),
    build: () => ({
        inlets: {
            '0': { type: 'signal', id: '0' },
            '1_message': { type: 'message', id: '1_message' },
            '1_signal': { type: 'signal', id: '1_signal' },
        },
        outlets: {
            '0': { type: 'signal', id: '0' },
        },
    }),
    rerouteConnectionIn: (
        outlet,
        inletId,
    ): DspGraph.PortletId => {
        if (inletId === '1') {
            return outlet.type === 'message' ? '1_message' : '1_signal'
        }
        return undefined
    },
}

const oscTildeBuilder: NodeBuilder<NODE_ARGUMENTS_TYPES['osc~']> = {
    translateArgs: (pdNode) => ({
        frequency: validation.assertNumber(pdNode.args[0]),
    }),
    build: () => ({
        inlets: {
            '0_message': { type: 'message', id: '0_message' },
            '0_signal': { type: 'signal', id: '0_signal' },
            '1': { type: 'message', id: '1' },
        },
        outlets: {
            '0': { type: 'signal', id: '0' },
        },
    }),
    rerouteConnectionIn: (
        outlet,
        inletId,
    ): DspGraph.PortletId => {
        if (inletId === '0') {
            return outlet.type === 'message' ? '0_message' : '0_signal'
        }
        return undefined
    },
}

const noiseTildeBuilder: NodeBuilder<NODE_ARGUMENTS_TYPES['_NO_ARGS']> = {
    translateArgs: () => ({}),
    build: () => {
        return {
            inlets: {},
            outlets: {
                '0': { type: 'signal', id: '0' },
            },
        }
    },
}

const mixerTildeBuilder: NodeBuilder<NODE_ARGUMENTS_TYPES['mixer~']> = {
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

const tabplayTildeBuilder: NodeBuilder<NODE_ARGUMENTS_TYPES['tabplay~']> = {
    translateArgs: (pdNode, patch) => ({
        arrayName: pdJsonHelpers.resolveDollarArg(
            pdNode.args[0].toString(),
            patch
        ),
    }),
    build: () => ({
        inlets: {
            '0': { type: 'message', id: '0' },
        },
        outlets: {
            '0': { type: 'signal', id: '0' },
            '1': { type: 'message', id: '1' },
        },
    }),
}

const dacTildeBuilder: NodeBuilder<NODE_ARGUMENTS_TYPES['dac~']> = {
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
            patch.connections.forEach(connection => {
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
        isEndSink: true,
    }),
}

const msgBuilder: NodeBuilder<NODE_ARGUMENTS_TYPES['msg']> = {
    translateArgs: (pdNode) => ({
        template: pdNode.args,
    }),
    build: () => ({
        inlets: {
            '0': { type: 'message', id: '0' },
        },
        outlets: {
            '0': { type: 'message', id: '0' },
        },
    }),
}

const metroBuilder: NodeBuilder<NODE_ARGUMENTS_TYPES['metro']> = {
    translateArgs: (pdNode) => ({
        rate: validation.assertNumber(pdNode.args[0]),
    }),
    build: () => ({
        inlets: {
            '0': { type: 'message', id: '0' },
            '1': { type: 'message', id: '1' },
        },
        outlets: {
            '0': { type: 'message', id: '0' },
        },
    }),
}

const loadbangBuilder: NodeBuilder<NODE_ARGUMENTS_TYPES['_NO_ARGS']> = {
    translateArgs: () => ({}),
    build: () => ({
        inlets: {},
        outlets: {
            '0': { type: 'message', id: '0' },
        },
    }),
}

const NODE_BUILDERS = {
    'osc~': oscTildeBuilder,
    '+~': binaryOperatortildeBuilder,
    '*~': binaryOperatortildeBuilder,
    'noise~': noiseTildeBuilder,
    'mixer~': mixerTildeBuilder,
    'dac~': dacTildeBuilder,
    'tabplay~': tabplayTildeBuilder,
    msg: msgBuilder,
    metro: metroBuilder,
    loadbang: loadbangBuilder,
}

export default NODE_BUILDERS
