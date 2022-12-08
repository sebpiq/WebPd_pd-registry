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
    translateArgs: (objectArgs: PdJson.ObjectArgs) => ({
        value: validation.assertNumber(objectArgs[0]),
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

const oscTildeBuilder: NodeBuilder<NODE_ARGUMENTS_TYPES['osc~']> = {
    translateArgs: (objectArgs: PdJson.ObjectArgs) => ({
        frequency: validation.assertNumber(objectArgs[0]),
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
    translateArgs: (objectArgs: PdJson.ObjectArgs) => ({
        channels: validation.assertNumber(objectArgs[0]),
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

const tabplayTildeBuilder: NodeBuilder<NODE_ARGUMENTS_TYPES['tabplay~']> = {
    translateArgs: (objectArgs: PdJson.ObjectArgs, patch: PdJson.Patch) => ({
        arrayName: pdJsonHelpers.resolveDollarArg(
            objectArgs[0].toString(),
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
    translateArgs: (objectArgs: PdJson.ObjectArgs) => ({
        // Channels are provided as 1-indexed, so we translate them back to 0-indexed.
        channels: objectArgs.map(
            (channel) => validation.assertNumber(channel) - 1
        ),
    }),
    build: (nodeArgs: DspGraph.NodeArguments) => ({
        inlets: (nodeArgs.channels as Array<number>).reduce((inlets, _, i) => {
            return {
                ...inlets,
                [i]: { type: 'signal', id: i },
            }
        }, {} as DspGraph.PortletMap),
        outlets: {},
        isEndSink: true,
    }),
}

const msgBuilder: NodeBuilder<NODE_ARGUMENTS_TYPES['msg']> = {
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

const metroBuilder: NodeBuilder<NODE_ARGUMENTS_TYPES['metro']> = {
    translateArgs: (objectArgs: PdJson.ObjectArgs) => ({
        rate: validation.assertNumber(objectArgs[0]),
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
