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

import { PdDspGraph } from '@webpd/dsp-graph'
import { NodeBuilders } from './types'

enum IdNamespaces {
    PD = 'pd',
    MIXER = 'mixer',
}

export class Compilation {
    readonly pd: PdJson.Pd
    readonly graph: PdDspGraph.Graph
    readonly nodeBuilders: NodeBuilders

    constructor(pd: PdJson.Pd, nodeBuilders: NodeBuilders) {
        this.pd = pd
        this.nodeBuilders = nodeBuilders
        this.graph = {}
    }

    getNodeBuilder(type: PdSharedTypes.NodeType) {
        const nodeBuilder = this.nodeBuilders[type]
        if (!nodeBuilder) {
            throw new Error(`unknown node type ${type}`)
        }
        return nodeBuilder
    }

    fixConnection(
        connection: [
            PdDspGraph.ConnectionEndpoint,
            PdDspGraph.ConnectionEndpoint
        ]
    ): [PdDspGraph.ConnectionEndpoint, PdDspGraph.ConnectionEndpoint] {
        const [source, sink] = connection
        const sinkNode = this.graph[sink.nodeId]
        const pdSinkNodeBuilder = this.getNodeBuilder(sinkNode.type)
        const sourceNode = this.graph[source.nodeId]
        if (pdSinkNodeBuilder.rerouteConnectionIn) {
            const newInletId = pdSinkNodeBuilder.rerouteConnectionIn(
                sourceNode.outlets[source.portletId],
                sink.portletId
            )
            if (newInletId !== undefined) {
                return [source, { nodeId: sink.nodeId, portletId: newInletId }]
            }
        }
        return connection
    }

    buildGraphNodeId(
        patchId: PdJson.ObjectGlobalId,
        nodeId: PdJson.ObjectLocalId
    ): PdDspGraph.NodeId {
        return `${IdNamespaces.PD}_${patchId}_${nodeId}`
    }

    buildMixerNodeId(
        sinkId: PdDspGraph.NodeId,
        inletId: PdDspGraph.PortletId
    ): PdDspGraph.NodeId {
        return `${IdNamespaces.MIXER}_${sinkId}_${inletId}`
    }
}
