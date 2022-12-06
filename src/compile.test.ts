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
import compile, {
    buildGraph,
    flattenGraph,
    _inlineSubpatchInlets,
    _inlineSubpatchOutlets,
    _inlineSubpatch,
} from './compile'
import {
    assertGraphsEqual,
    makeGraph,
    nodeDefaults,
} from '@webpd/dsp-graph/src/test-helpers'
import {
    pdJsonPatchDefaults,
    pdJsonNodeDefaults,
    makePd,
} from '@webpd/shared/test-helpers'
import { getReferencesToSubpatch } from './pdjson-helpers'
import { Compilation } from './compilation'
import NODE_BUILDERS from './node-builders'
import { PdDspGraph } from '@webpd/dsp-graph'
import { makeNodeBuilders } from './test-helpers'
import { NodeBuilders } from './types'

const DUMMY_NODE_BUILDERS = makeNodeBuilders({
    [pdJsonNodeDefaults('').type]: {},
})
const DUMMY_NODE_TYPE = pdJsonNodeDefaults('').type

describe('compile', () => {
    describe('default', () => {
        const NODE_BUILDERS: NodeBuilders = makeNodeBuilders({
            [DUMMY_NODE_TYPE]: {
                inletTypes: ['message'],
                outletTypes: ['message'],
            },
        })

        const EXPECTED_INLETS_OUTLETS = {
            inlets: {
                '0': {
                    type: 'message',
                    id: '0',
                },
            } as PdDspGraph.PortletMap,
            outlets: {
                '0': {
                    type: 'message',
                    id: '0',
                },
            } as PdDspGraph.PortletMap,
        }

        it('should compile the graph', () => {
            const pd: PdJson.Pd = makePd({
                patches: {
                    p: {
                        nodes: {
                            n1: pdJsonNodeDefaults('n1'),
                            sp: {
                                ...pdJsonNodeDefaults('sp'),
                                refId: 'sp',
                            },
                            n2: pdJsonNodeDefaults('n2'),
                        },
                        connections: [
                            ['n1', 0, 'sp', 0],
                            ['sp', 0, 'n2', 0],
                        ],
                    },
                    sp: {
                        nodes: {
                            inletNode: pdJsonNodeDefaults('inletNode'),
                            n1: pdJsonNodeDefaults('n1'),
                            outletNode: pdJsonNodeDefaults('outletNode'),
                        },
                        connections: [
                            ['inletNode', 0, 'n1', 0],
                            ['n1', 0, 'outletNode', 0],
                        ],
                        inlets: ['inletNode'],
                        outlets: ['outletNode'],
                    },
                },
            })
            const graph = compile(pd, NODE_BUILDERS)

            const expectedGraph: PdDspGraph.Graph = makeGraph({
                pd_p_n1: {
                    ...EXPECTED_INLETS_OUTLETS,
                    sinks: { '0': [['pd_sp_n1', '0']] },
                },
                pd_sp_n1: {
                    ...EXPECTED_INLETS_OUTLETS,
                    sinks: { '0': [['pd_p_n2', '0']] },
                },
                pd_p_n2: {
                    ...EXPECTED_INLETS_OUTLETS,
                },
            })
            assertGraphsEqual(graph, expectedGraph)
        })
    })

    describe('buildGraph', () => {
        it('should build the basic graph from a pd json object', () => {
            const pd: PdJson.Pd = makePd({
                patches: {
                    // Connected nodes
                    p1: {
                        nodes: {
                            n1: {
                                ...pdJsonNodeDefaults('n1'),
                                refId: 'p2',
                            },
                            n2: pdJsonNodeDefaults('n2'),
                        },
                        connections: [['n1', 0, 'n2', 0]],
                    },
                    // A node with no connections
                    p2: {
                        nodes: {
                            n1: pdJsonNodeDefaults('n1'),
                        },
                        connections: [],
                    },
                },
            })
            const compilation: Compilation = new Compilation(
                pd,
                DUMMY_NODE_BUILDERS
            )

            buildGraph(compilation)

            assert.deepStrictEqual(compilation.graph, {
                pd_p1_n1: {
                    args: {},
                    id: 'pd_p1_n1',
                    type: DUMMY_NODE_TYPE,
                    sources: {},
                    sinks: {
                        0: [{ nodeId: 'pd_p1_n2', portletId: '0' }],
                    },
                    inlets: {
                        '0': {
                            id: '0',
                            type: 'message',
                        },
                    },
                    outlets: {
                        '0': {
                            id: '0',
                            type: 'message',
                        },
                    },
                },
                pd_p1_n2: {
                    args: {},
                    id: 'pd_p1_n2',
                    type: DUMMY_NODE_TYPE,
                    sources: {
                        0: [{ nodeId: 'pd_p1_n1', portletId: '0' }],
                    },
                    sinks: {},
                    inlets: {
                        '0': {
                            id: '0',
                            type: 'message',
                        },
                    },
                    outlets: {
                        '0': {
                            id: '0',
                            type: 'message',
                        },
                    },
                },
                pd_p2_n1: {
                    args: {},
                    id: 'pd_p2_n1',
                    type: DUMMY_NODE_TYPE,
                    sinks: {},
                    sources: {},
                    inlets: {
                        '0': {
                            id: '0',
                            type: 'message',
                        },
                    },
                    outlets: {
                        '0': {
                            id: '0',
                            type: 'message',
                        },
                    },
                },
            })
        })

        it('should add mixer nodes if several signal connections to the same sink', () => {
            const pd: PdJson.Pd = makePd({
                patches: {
                    p: {
                        nodes: {
                            nodeSource1: {
                                ...pdJsonNodeDefaults('nodeSource1'),
                                type: 'signalType',
                            },
                            nodeSource2: {
                                ...pdJsonNodeDefaults('nodeSource2'),
                                type: 'signalType',
                            },
                            nodeSource3: {
                                ...pdJsonNodeDefaults('nodeSource3'),
                                type: 'signalType',
                            },
                            nodeSink: {
                                ...pdJsonNodeDefaults('nodeSink'),
                                type: 'signalType',
                            },
                        },
                        connections: [
                            ['nodeSource1', 0, 'nodeSink', 0],
                            ['nodeSource2', 0, 'nodeSink', 0],
                            ['nodeSource3', 0, 'nodeSink', 0],
                        ],
                    },
                },
            })
            const nodeBuilders: NodeBuilders = makeNodeBuilders({
                signalType: {
                    inletTypes: ['signal'],
                    outletTypes: ['signal', 'signal'],
                },
                'mixer~': NODE_BUILDERS['mixer~'],
            })
            const compilation: Compilation = new Compilation(pd, nodeBuilders)

            buildGraph(compilation)

            assert.deepStrictEqual(Object.keys(compilation.graph).sort(), [
                'mixer_pd_p_nodeSink_0',
                'pd_p_nodeSink',
                'pd_p_nodeSource1',
                'pd_p_nodeSource2',
                'pd_p_nodeSource3',
            ])
            assert.deepStrictEqual(compilation.graph['mixer_pd_p_nodeSink_0'], {
                ...nodeDefaults('mixer_pd_p_nodeSink_0', 'mixer~'),
                args: { channels: 3 },
                sources: {
                    0: [{ nodeId: 'pd_p_nodeSource1', portletId: '0' }],
                    1: [{ nodeId: 'pd_p_nodeSource2', portletId: '0' }],
                    2: [{ nodeId: 'pd_p_nodeSource3', portletId: '0' }],
                },
                sinks: {
                    0: [{ nodeId: 'pd_p_nodeSink', portletId: '0' }],
                },
                inlets: {
                    '0': {
                        id: '0',
                        type: 'signal',
                    },
                    '1': {
                        id: '1',
                        type: 'signal',
                    },
                    '2': {
                        id: '2',
                        type: 'signal',
                    },
                },
                outlets: {
                    '0': {
                        id: '0',
                        type: 'signal',
                    },
                },
            })
        })

        it('should connect directly nodes if several message connections to the same sink', () => {
            const pd: PdJson.Pd = makePd({
                patches: {
                    p: {
                        nodes: {
                            nodeSource1: {
                                ...pdJsonNodeDefaults('nodeSource1'),
                                type: 'controlType',
                            },
                            nodeSource2: {
                                ...pdJsonNodeDefaults('nodeSource2'),
                                type: 'controlType',
                            },
                            nodeSink: {
                                ...pdJsonNodeDefaults('nodeSink'),
                                type: 'controlType',
                            },
                        },
                        connections: [
                            ['nodeSource1', 0, 'nodeSink', 0],
                            ['nodeSource2', 0, 'nodeSink', 0],
                        ],
                    },
                },
            })
            const nodeBuilders = makeNodeBuilders({
                controlType: {
                    inletTypes: ['message'],
                    outletTypes: ['message'],
                },
            })
            const compilation = new Compilation(pd, nodeBuilders)

            buildGraph(compilation)

            assert.deepStrictEqual(Object.keys(compilation.graph).sort(), [
                'pd_p_nodeSink',
                'pd_p_nodeSource1',
                'pd_p_nodeSource2',
            ])
            assert.deepStrictEqual(compilation.graph['pd_p_nodeSink'].sources, {
                0: [
                    { nodeId: 'pd_p_nodeSource1', portletId: '0' },
                    { nodeId: 'pd_p_nodeSource2', portletId: '0' },
                ],
            })
        })
    })

    describe('flattenGraph', () => {
        const NODE_BUILDERS: NodeBuilders = makeNodeBuilders({
            [DUMMY_NODE_TYPE]: {
                inletTypes: ['message', 'message', 'message', 'message'],
                outletTypes: ['message', 'message', 'message', 'message'],
            },
        })

        const EXPECTED_INLETS_OUTLETS = {
            inlets: {
                '0': {
                    type: 'message',
                    id: '0',
                },
                '1': {
                    type: 'message',
                    id: '1',
                },
                '2': {
                    type: 'message',
                    id: '2',
                },
                '3': {
                    type: 'message',
                    id: '3',
                },
            } as PdDspGraph.PortletMap,
            outlets: {
                '0': {
                    type: 'message',
                    id: '0',
                },
                '1': {
                    type: 'message',
                    id: '1',
                },
                '2': {
                    type: 'message',
                    id: '2',
                },
                '3': {
                    type: 'message',
                    id: '3',
                },
            } as PdDspGraph.PortletMap,
        }

        describe('_inlineSubpatchInlets', () => {
            it('should establish connections from outer patch to subpatch through inlets', () => {
                const pd: PdJson.Pd = makePd({
                    patches: {
                        p: {
                            ...pdJsonPatchDefaults('p'),
                            nodes: {
                                n1: pdJsonNodeDefaults('n1'),
                                n2: pdJsonNodeDefaults('n2'),
                                sp: {
                                    ...pdJsonNodeDefaults('sp'),
                                    refId: 'sp',
                                },
                            },
                            connections: [
                                ['n1', 0, 'sp', 0],
                                ['n2', 0, 'sp', 0],
                                ['n1', 0, 'sp', 1],
                            ],
                        },
                        sp: {
                            ...pdJsonPatchDefaults('sp'),
                            nodes: {
                                inlet1: pdJsonNodeDefaults('inlet1'),
                                inlet2: pdJsonNodeDefaults('inlet2'),
                                n1: pdJsonNodeDefaults('n1'),
                                n2: pdJsonNodeDefaults('n2'),
                            },
                            connections: [
                                ['inlet1', 0, 'n1', 0],
                                ['inlet2', 0, 'n2', 3],
                            ],
                            inlets: ['inlet1', 'inlet2'],
                        },
                    },
                })
                const compilation = new Compilation(pd, NODE_BUILDERS)

                buildGraph(compilation)
                const referencesToSubpatch = getReferencesToSubpatch(pd, 'sp')
                _inlineSubpatchInlets(
                    compilation,
                    pd.patches['sp'],
                    referencesToSubpatch
                )

                // inlet nodes should be deleted
                assert.strictEqual(compilation.graph['sp:inlet1'], undefined)
                assert.strictEqual(compilation.graph['sp:inlet2'], undefined)

                const expectedGraph = makeGraph({
                    pd_p_n1: {
                        ...EXPECTED_INLETS_OUTLETS,
                        sinks: {
                            0: [
                                ['pd_p_sp', '0'],
                                ['pd_p_sp', '1'],
                                ['pd_sp_n1', '0'],
                                ['pd_sp_n2', '3'],
                            ],
                        },
                    },
                    pd_p_n2: {
                        ...EXPECTED_INLETS_OUTLETS,
                        sinks: {
                            0: [
                                ['pd_p_sp', '0'],
                                ['pd_sp_n1', '0'],
                            ],
                        },
                    },
                    // subpatch node is not deleted by _inlineSubpatchInlets
                    pd_p_sp: { ...EXPECTED_INLETS_OUTLETS },
                    pd_sp_n1: { ...EXPECTED_INLETS_OUTLETS },
                    pd_sp_n2: { ...EXPECTED_INLETS_OUTLETS },
                })

                assertGraphsEqual(compilation.graph, expectedGraph)
            })
        })

        describe('_inlineSubpatchOutlets', () => {
            it('should get lists of nodes to connect to collapse inlets', () => {
                const pd: PdJson.Pd = makePd({
                    patches: {
                        p: {
                            ...pdJsonPatchDefaults('p'),
                            nodes: {
                                sp: {
                                    ...pdJsonNodeDefaults('sp'),
                                    refId: 'sp',
                                },
                                n1: pdJsonNodeDefaults('n1'),
                                n2: pdJsonNodeDefaults('n2'),
                            },
                            connections: [
                                ['sp', 0, 'n1', 0],
                                ['sp', 1, 'n1', 1],
                                ['sp', 0, 'n2', 1],
                            ],
                        },
                        sp: {
                            ...pdJsonPatchDefaults('sp'),
                            nodes: {
                                n1: pdJsonNodeDefaults('n1'),
                                n2: pdJsonNodeDefaults('n2'),
                                outlet1: pdJsonNodeDefaults('outlet1'),
                                outlet2: pdJsonNodeDefaults('outlet2'),
                            },
                            connections: [
                                ['n1', 3, 'outlet1', 0],
                                ['n1', 3, 'outlet2', 0],
                                ['n2', 0, 'outlet2', 0],
                            ],
                            outlets: ['outlet1', 'outlet2'],
                        },
                    },
                })
                const compilation = new Compilation(pd, NODE_BUILDERS)

                buildGraph(compilation)

                // outlet nodes should be created
                assert.strictEqual(!!compilation.graph['pd_sp_outlet1'], true)
                assert.strictEqual(!!compilation.graph['pd_sp_outlet2'], true)

                const referencesToSubpatch = getReferencesToSubpatch(pd, 'sp')
                _inlineSubpatchOutlets(
                    compilation,
                    pd.patches['sp'],
                    referencesToSubpatch
                )

                // outlet nodes should be deleted
                assert.strictEqual(
                    compilation.graph['pd_sp_outlet1'],
                    undefined
                )
                assert.strictEqual(
                    compilation.graph['pd_sp_outlet2'],
                    undefined
                )

                const expectedGraph = makeGraph({
                    pd_sp_n1: {
                        ...EXPECTED_INLETS_OUTLETS,
                        sinks: {
                            3: [
                                ['pd_p_n1', '0'],
                                ['pd_p_n2', '1'],
                                ['pd_p_n1', '1'],
                            ],
                        },
                    },
                    pd_sp_n2: {
                        ...EXPECTED_INLETS_OUTLETS,
                        sinks: { 0: [['pd_p_n1', '1']] },
                    },
                    pd_p_n1: { ...EXPECTED_INLETS_OUTLETS },
                    pd_p_n2: { ...EXPECTED_INLETS_OUTLETS },
                    pd_p_sp: {
                        ...EXPECTED_INLETS_OUTLETS,
                        sinks: {
                            0: [
                                ['pd_p_n1', '0'],
                                ['pd_p_n2', '1'],
                            ],
                            1: [['pd_p_n1', '1']],
                        },
                    },
                })
                assertGraphsEqual(compilation.graph, expectedGraph)
            })
        })

        describe('_inlineSubpatch', () => {
            it('inline a simple subpatch', () => {
                const pd: PdJson.Pd = makePd({
                    patches: {
                        p: {
                            nodes: {
                                n1: pdJsonNodeDefaults('n1'),
                                sp: {
                                    ...pdJsonNodeDefaults('sp'),
                                    refId: 'sp',
                                },
                                n2: pdJsonNodeDefaults('n2'),
                                n3: pdJsonNodeDefaults('n3'),
                            },
                            connections: [
                                ['n1', 2, 'sp', 0],
                                ['sp', 0, 'n2', 1],
                                ['n2', 0, 'n3', 1],
                            ],
                        },
                        sp: {
                            nodes: {
                                inletNode: pdJsonNodeDefaults('inletNode'),
                                n1: pdJsonNodeDefaults('n1'),
                                outletNode: pdJsonNodeDefaults('outletNode'),
                            },
                            connections: [
                                ['inletNode', 0, 'n1', 1],
                                ['n1', 3, 'outletNode', 0],
                            ],
                            inlets: ['inletNode'],
                            outlets: ['outletNode'],
                        },
                    },
                })

                const compilation = new Compilation(pd, NODE_BUILDERS)
                buildGraph(compilation)
                _inlineSubpatch(compilation, pd.patches['sp'])

                const expectedGraph: PdDspGraph.Graph = makeGraph({
                    pd_p_n1: {
                        ...EXPECTED_INLETS_OUTLETS,
                        sinks: { 2: [['pd_sp_n1', '1']] },
                    },
                    pd_sp_n1: {
                        ...EXPECTED_INLETS_OUTLETS,
                        sinks: { 3: [['pd_p_n2', '1']] },
                    },
                    pd_p_n2: {
                        ...EXPECTED_INLETS_OUTLETS,
                        sinks: { 0: [['pd_p_n3', '1']] },
                    },
                    pd_p_n3: { ...EXPECTED_INLETS_OUTLETS },
                })
                assertGraphsEqual(compilation.graph, expectedGraph)
            })

            it('should inline graph with passthrough connections', () => {
                const pd: PdJson.Pd = makePd({
                    patches: {
                        p: {
                            nodes: {
                                n1: pdJsonNodeDefaults('n1'),
                                sp: {
                                    ...pdJsonNodeDefaults('sp'),
                                    refId: 'sp',
                                },
                                n2: pdJsonNodeDefaults('n2'),
                            },
                            connections: [
                                ['n1', 1, 'sp', 0],
                                ['sp', 0, 'n2', 1],
                            ],
                        },
                        sp: {
                            nodes: {
                                inlet: pdJsonNodeDefaults('inlet'),
                                outlet: pdJsonNodeDefaults('outlet'),
                            },
                            connections: [['inlet', 0, 'outlet', 0]],
                            inlets: ['inlet'],
                            outlets: ['outlet'],
                        },
                    },
                })
                const compilation = new Compilation(pd, NODE_BUILDERS)

                buildGraph(compilation)
                _inlineSubpatch(compilation, pd.patches['sp'])

                const expectedGraph: PdDspGraph.Graph = makeGraph({
                    pd_p_n1: {
                        ...EXPECTED_INLETS_OUTLETS,
                        sinks: { 1: [['pd_p_n2', '1']] },
                    },
                    pd_p_n2: { ...EXPECTED_INLETS_OUTLETS },
                })
                assertGraphsEqual(compilation.graph, expectedGraph)
            })
        })

        it('should flatten graph and remove subpatches', () => {
            const pd: PdJson.Pd = makePd({
                patches: {
                    // Connected nodes
                    p: {
                        nodes: {
                            n1: pdJsonNodeDefaults('n1'),
                            sp: {
                                ...pdJsonNodeDefaults('sp'),
                                refId: 'sp',
                            },
                            n2: pdJsonNodeDefaults('n2'),
                        },
                        connections: [
                            ['n1', 1, 'sp', 0],
                            ['sp', 0, 'n2', 3],
                        ],
                    },
                    sp: {
                        nodes: {
                            inletNode: pdJsonNodeDefaults('inletNode'),
                            ssp: {
                                ...pdJsonNodeDefaults('ssp'),
                                refId: 'ssp',
                            },
                            outletNode: pdJsonNodeDefaults('outletNode'),
                        },
                        connections: [
                            ['inletNode', 0, 'ssp', 0],
                            ['ssp', 0, 'outletNode', 0],
                        ],
                        inlets: ['inletNode'],
                        outlets: ['outletNode'],
                    },
                    ssp: {
                        ...pdJsonPatchDefaults('ssp'),
                        nodes: {
                            inletNode: pdJsonNodeDefaults('inletNode'),
                            n1: pdJsonNodeDefaults('n1'),
                            outletNode: pdJsonNodeDefaults('outletNode'),
                        },
                        connections: [
                            ['inletNode', 0, 'n1', 1],
                            ['n1', 2, 'outletNode', 0],
                        ],
                        inlets: ['inletNode'],
                        outlets: ['outletNode'],
                    },
                },
            })

            const compilation = new Compilation(pd, NODE_BUILDERS)

            buildGraph(compilation)
            flattenGraph(compilation)

            const expectedGraph: PdDspGraph.Graph = makeGraph({
                pd_p_n1: {
                    ...EXPECTED_INLETS_OUTLETS,
                    sinks: { 1: [['pd_ssp_n1', '1']] },
                },
                pd_p_n2: { ...EXPECTED_INLETS_OUTLETS },
                pd_ssp_n1: {
                    ...EXPECTED_INLETS_OUTLETS,
                    sinks: { 2: [['pd_p_n2', '3']] },
                },
            })
            assertGraphsEqual(compilation.graph, expectedGraph)
        })

        it('should flatten complex graph and remove subpatches', () => {
            const pd: PdJson.Pd = makePd({
                patches: {
                    // Connected nodes
                    p: {
                        nodes: {
                            n1: pdJsonNodeDefaults('n1'),
                            sp: {
                                ...pdJsonNodeDefaults('sp'),
                                refId: 'sp',
                            },
                            n4: pdJsonNodeDefaults('n4'),
                            n5: pdJsonNodeDefaults('n5'),
                        },
                        connections: [
                            // Connections from nodes to subpatch
                            ['n1', 0, 'sp', 0],
                            ['n1', 0, 'sp', 1],
                            // Connections from subpatch to nodes
                            ['sp', 0, 'n4', 0],
                            ['sp', 1, 'n4', 1],
                            ['sp', 0, 'n5', 0],
                        ],
                    },
                    sp: {
                        ...pdJsonPatchDefaults('sp'),
                        nodes: {
                            inlet1: pdJsonNodeDefaults('inlet1'),
                            inlet2: pdJsonNodeDefaults('inlet2'),
                            n1: pdJsonNodeDefaults('n1'),
                            n2: pdJsonNodeDefaults('n2'),
                            ssp: {
                                ...pdJsonNodeDefaults('ssp'),
                                refId: 'ssp',
                            },
                            outlet1: pdJsonNodeDefaults('outlet1'),
                            outlet2: pdJsonNodeDefaults('outlet2'),
                        },
                        connections: [
                            // inlets to nodes
                            ['inlet1', 0, 'n1', 0],
                            ['inlet2', 0, 'n2', 3],
                            // connections to subsubpatch
                            ['inlet2', 0, 'ssp', 0],
                            // Outlets to nodes
                            ['n1', 1, 'outlet1', 0],
                        ],
                        inlets: ['inlet1', 'inlet2'],
                        outlets: ['outlet1', 'outlet2'],
                    },
                    ssp: {
                        ...pdJsonPatchDefaults('ssp'),
                        nodes: {
                            inlet1: pdJsonNodeDefaults('inlet1'),
                            n1: pdJsonNodeDefaults('n1'),
                        },
                        connections: [['inlet1', 0, 'n1', 3]],
                        inlets: ['inlet1'],
                    },
                },
            })
            const compilation = new Compilation(pd, NODE_BUILDERS)

            buildGraph(compilation)
            flattenGraph(compilation)

            const expectedGraph: PdDspGraph.Graph = makeGraph({
                pd_p_n1: {
                    ...EXPECTED_INLETS_OUTLETS,
                    sinks: {
                        0: [
                            ['pd_sp_n1', '0'],
                            ['pd_sp_n2', '3'],
                            ['pd_ssp_n1', '3'],
                        ],
                    },
                },
                // Subpatch
                pd_sp_n1: {
                    ...EXPECTED_INLETS_OUTLETS,
                    sinks: {
                        1: [
                            ['pd_p_n4', '0'],
                            ['pd_p_n5', '0'],
                        ],
                    },
                },
                pd_sp_n2: {
                    ...EXPECTED_INLETS_OUTLETS,
                    sinks: {},
                },
                // Sub-subpatch
                pd_ssp_n1: { ...EXPECTED_INLETS_OUTLETS },
                // Sub-subpatch : END
                // Subpatch : END
                pd_p_n4: { ...EXPECTED_INLETS_OUTLETS },
                pd_p_n5: { ...EXPECTED_INLETS_OUTLETS },
            })

            assertGraphsEqual(compilation.graph, expectedGraph)
        })
    })
})
