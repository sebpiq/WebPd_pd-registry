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

import assert from 'assert'
import { Compilation } from './compilation'
import { makeGraph } from '@webpd/dsp-graph/src/test-helpers'
import { pdJsonDefaults } from '@webpd/shared/test-helpers'
import { makeNodeBuilders, setCompilationGraph } from './test-helpers'
import { PdDspGraph } from '@webpd/dsp-graph'

describe('compilation', () => {
    let compilation: Compilation
    beforeEach(() => {
        compilation = new Compilation(pdJsonDefaults(), {})
    })

    describe('fixConnection', () => {
        const NODE_BUILDERS = makeNodeBuilders({
            someType: {
                rerouteConnectionIn: (
                    outlet: PdDspGraph.Portlet,
                    inletId: PdDspGraph.PortletId
                ) => {
                    if (inletId !== '0') {
                        return undefined
                    }
                    return outlet.type === 'message' ? '10' : '11'
                },
            },
            typeWithoutReroute: {},
        })

        const PD = pdJsonDefaults()

        beforeEach(() => (compilation = new Compilation(PD, NODE_BUILDERS)))

        it('should fix incoming connections if the node builder defines rerouteConnectionIn and it returns a new connection', () => {
            const graph = makeGraph({
                n1: {
                    type: 'someType',
                    outlets: {
                        '0': { type: 'message', id: '0' },
                        '1': { type: 'signal', id: '1' },
                    },
                },
                n2: {
                    type: 'someType',
                },
            })
            setCompilationGraph(compilation, graph)

            let fixedConnection = compilation.fixConnection([
                { nodeId: 'n1', portletId: '0' },
                { nodeId: 'n2', portletId: '0' },
            ])
            assert.deepStrictEqual(fixedConnection, [
                { nodeId: 'n1', portletId: '0' },
                { nodeId: 'n2', portletId: '10' },
            ])

            fixedConnection = compilation.fixConnection([
                { nodeId: 'n1', portletId: '1' },
                { nodeId: 'n2', portletId: '0' },
            ])
            assert.deepStrictEqual(fixedConnection, [
                { nodeId: 'n1', portletId: '1' },
                { nodeId: 'n2', portletId: '11' },
            ])
        })

        it('should do nothing if the node builder defines rerouteConnectionIn and it returns undefined', () => {
            const graph = makeGraph({
                n1: {
                    type: 'someType',
                },
                n2: {
                    type: 'someType',
                },
            })
            setCompilationGraph(compilation, graph)

            const fixedConnection = compilation.fixConnection([
                { nodeId: 'n1', portletId: '1' },
                { nodeId: 'n2', portletId: '1' },
            ])
            assert.deepStrictEqual(fixedConnection, [
                { nodeId: 'n1', portletId: '1' },
                { nodeId: 'n2', portletId: '1' },
            ])
        })

        it('should do nothing if the node builder defines no rerouteConnectionIn', () => {
            const graph = makeGraph({
                n1: {
                    type: 'typeWithoutReroute',
                },
                n2: {
                    type: 'typeWithoutReroute',
                },
            })
            setCompilationGraph(compilation, graph)

            const fixedConnection = compilation.fixConnection([
                { nodeId: 'n1', portletId: '1' },
                { nodeId: 'n2', portletId: '1' },
            ])
            assert.deepStrictEqual(fixedConnection, [
                { nodeId: 'n1', portletId: '1' },
                { nodeId: 'n2', portletId: '1' },
            ])
        })
    })

    describe('buildGraphNodeId', () => {
        it('should build a correct id', () => {
            assert.strictEqual(
                compilation.buildGraphNodeId('patch', 'node'),
                `pd_patch_node`
            )
        })
    })

    describe('buildMixerNodeId', () => {
        it('should build a correct id', () => {
            assert.strictEqual(
                compilation.buildMixerNodeId('node', '44'),
                `mixer_node_44`
            )
        })
    })
})
