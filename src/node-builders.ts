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

import { resolveDollarArg } from './pdjson-helpers'

// Same builder for [+~], [*~], etc ...
const tildeBinaryOperatorBuilder: PdDspGraph.NodeBuilder = {
    translateArgs: (objectArgs: PdJson.ObjectArgs) => ({
        value: objectArgs[0],
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
        outlet: PdDspGraph.Portlet,
        inletId: PdDspGraph.PortletId
    ): PdDspGraph.PortletId => {
        if (inletId === '1') {
            return outlet.type === 'message' ? '1_message' : '1_signal'
        }
        return undefined
    },
}

const NODE_BUILDERS: PdDspGraph.NodeBuilders = {
    'osc~': {
        translateArgs: (objectArgs: PdJson.ObjectArgs) => ({
            frequency: objectArgs[0],
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
            outlet: PdDspGraph.Portlet,
            inletId: PdDspGraph.PortletId
        ): PdDspGraph.PortletId => {
            if (inletId === '0') {
                return outlet.type === 'message' ? '0_message' : '0_signal'
            }
            return undefined
        },
    },

    '+~': tildeBinaryOperatorBuilder,
    '*~': tildeBinaryOperatorBuilder,

    'noise~': {
        translateArgs: () => ({}),
        build: () => {
            return {
                inlets: {},
                outlets: {
                    '0': { type: 'signal', id: '0' },
                },
            }
        },
    },

    'mixer~': {
        translateArgs: (objectArgs: PdJson.ObjectArgs) => ({
            channels: objectArgs[0],
        }),
        build: (nodeArgs: PdDspGraph.NodeArguments) => {
            const inlets: PdDspGraph.PortletMap = {}
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
    },

    'dac~': {
        // TODO depends on engine channelCount
        build: () => ({
            inlets: {
                '0': { type: 'signal', id: '0' },
                '1': { type: 'signal', id: '1' },
            },
            outlets: {},
            isEndSink: true,
        }),
        translateArgs: (objectArgs: PdJson.ObjectArgs) => ({
            frequency: objectArgs[0],
        }),
    },

    'tabplay~': {
        build: () => ({
            inlets: {
                '0': { type: 'message', id: '0' },
            },
            outlets: {
                '0': { type: 'signal', id: '0' },
                '1': { type: 'message', id: '1' },
            },
        }),
        translateArgs: (
            objectArgs: PdJson.ObjectArgs,
            patch: PdJson.Patch
        ) => ({
            arrayName: resolveDollarArg(objectArgs[0].toString(), patch),
        }),
    },

    msg: {
        build: () => ({
            inlets: {
                '0': { type: 'message', id: '0' },
            },
            outlets: {
                '0': { type: 'message', id: '0' },
            },
        }),
        translateArgs: (objectArgs: PdJson.ObjectArgs) => ({
            template: objectArgs,
        }),
    },

    metro: {
        build: () => ({
            inlets: {
                '0': { type: 'message', id: '0' },
                '1': { type: 'message', id: '1' },
            },
            outlets: {
                '0': { type: 'message', id: '0' },
            },
        }),
        translateArgs: (objectArgs: PdJson.ObjectArgs) => ({
            rate: objectArgs[0],
        }),
    },

    loadbang: {
        build: () => ({
            inlets: {},
            outlets: {
                '0': { type: 'message', id: '0' },
            },
        }),
        translateArgs: () => ({}),
    },
}

export default NODE_BUILDERS
