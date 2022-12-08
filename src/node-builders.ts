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
import { PdJson } from '@webpd/pd-json/src/types'
import { resolveDollarArg } from './pdjson-helpers'
import { NodeBuilder, NodeBuilders } from './types'
import { assertNumber } from './validation'

export interface OscTildeArgs { frequency: number }
export interface BinaryOperatorTildeArgs { value: number }
export interface DacTildeArgs { channels: Array<number> }
export interface MixerTildeArgs { channels: number }
export interface TabplayTildeArgs { arrayName: string }
export interface MsgArgs { template: Array<string | number> }
export interface MetroArgs { rate: number }
export interface NoArgs {}

// Same builder for [+~], [*~], etc ...
const binaryOperatortildeBuilder: NodeBuilder<BinaryOperatorTildeArgs> = {
    translateArgs: (objectArgs: PdJson.ObjectArgs) => ({
        value: assertNumber(objectArgs[0]),
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
        outlet: DspGraph.Portlet,
        inletId: DspGraph.PortletId
    ): DspGraph.PortletId => {
        if (inletId === '1') {
            return outlet.type === 'message' ? '1_message' : '1_signal'
        }
        return undefined
    },
}

const oscTildeBuilder: NodeBuilder<OscTildeArgs> = {
    translateArgs: (objectArgs: PdJson.ObjectArgs) => ({
        frequency: assertNumber(objectArgs[0]),
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
        outlet: DspGraph.Portlet,
        inletId: DspGraph.PortletId
    ): DspGraph.PortletId => {
        if (inletId === '0') {
            return outlet.type === 'message' ? '0_message' : '0_signal'
        }
        return undefined
    },
}

const noiseTildeBuilder: NodeBuilder<NoArgs> = {
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

const mixerTildeBuilder: NodeBuilder<MixerTildeArgs> = {
    translateArgs: (objectArgs: PdJson.ObjectArgs) => ({
        channels: assertNumber(objectArgs[0]),
    }),
    build: (nodeArgs: DspGraph.NodeArguments) => {
        const inlets: DspGraph.PortletMap = {}
        for (let ch = 0; ch < nodeArgs.channels; ch++) {
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

const tabplayTildeBuilder: NodeBuilder<TabplayTildeArgs> = {
    translateArgs: (
        objectArgs: PdJson.ObjectArgs,
        patch: PdJson.Patch
    ) => ({
        arrayName: resolveDollarArg(objectArgs[0].toString(), patch),
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

const dacTildeBuilder: NodeBuilder<DacTildeArgs> = {
    translateArgs: (objectArgs: PdJson.ObjectArgs) => ({
        // Channels are provided as 1-indexed, so we translate them back to 0-indexed.
        channels: (objectArgs)
            .map(channel => assertNumber(channel) - 1),
    }),
    build: (nodeArgs: DspGraph.NodeArguments) => ({
        inlets: (nodeArgs.channels as Array<number>).reduce((inlets, _, i) => {
            return {
                ...inlets,
                [i]: { type: 'signal', id: i }
            }
        }, {} as DspGraph.PortletMap),
        outlets: {},
        isEndSink: true,
    }),
}

const msgBuilder: NodeBuilder<MsgArgs> = {
    translateArgs: (objectArgs: PdJson.ObjectArgs) => ({
        template: objectArgs,
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

const metroBuilder: NodeBuilder<MetroArgs> = {
    translateArgs: (objectArgs: PdJson.ObjectArgs) => ({
        rate: assertNumber(objectArgs[0]),
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

const loadbangBuilder: NodeBuilder<NoArgs> = {
    translateArgs: () => ({}),
    build: () => ({
        inlets: {},
        outlets: {
            '0': { type: 'message', id: '0' },
        },
    }),
}

const NODE_BUILDERS: NodeBuilders = {
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
