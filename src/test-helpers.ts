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
import { Compilation } from './compilation'
import { NodeBuilder, NodeBuilders } from './types'

type ConciseNodeBuilders = {
    [nodeType: string]: {
        inletTypes?: Array<DspGraph.PortletType>
        outletTypes?: Array<DspGraph.PortletType>
        isEndSink?: boolean
        translateArgs?: NodeBuilder<any>['translateArgs']
        rerouteConnectionIn?: NodeBuilder<any>['rerouteConnectionIn']
        build?: NodeBuilder<any>['build']
    }
}

// Necessary because `Compilation.graph` is readonly
export const setCompilationGraph = (
    compilation: Compilation,
    graph: DspGraph.Graph
) => {
    Object.keys(compilation.graph).forEach(
        (key) => delete compilation.graph[key]
    )
    Object.keys(graph).forEach((key) => (compilation.graph[key] = graph[key]))
}

export const makeNodeBuilders = (
    conciseNodeBuilders: ConciseNodeBuilders
): NodeBuilders => {
    const nodeBuilders: NodeBuilders = {}
    Object.entries(conciseNodeBuilders).forEach(([nodeType, entryParams]) => {
        let build: NodeBuilder<any>['build']
        if (!entryParams.build) {
            const defaultPortletsTemplate: Array<DspGraph.PortletType> = [
                'message',
            ]

            const inletsTemplate: DspGraph.PortletMap = {}
            ;(entryParams.inletTypes || defaultPortletsTemplate).map(
                (inletType, i) => {
                    inletsTemplate[`${i}`] = {
                        type: inletType,
                        id: i.toString(10),
                    }
                }
            )

            const outletsTemplate: DspGraph.PortletMap = {}
            ;(entryParams.outletTypes || defaultPortletsTemplate).map(
                (outletType, i) => {
                    outletsTemplate[`${i}`] = {
                        type: outletType,
                        id: i.toString(10),
                    }
                }
            )

            build = () => {
                let extraArgs: Partial<DspGraph.Node> = {}
                if (entryParams.isEndSink) {
                    extraArgs = { isEndSink: entryParams.isEndSink }
                }
                return {
                    ...extraArgs,
                    inlets: inletsTemplate,
                    outlets: outletsTemplate,
                }
            }
        }

        nodeBuilders[nodeType] = {
            build: entryParams.build || build,
            translateArgs: entryParams.translateArgs || (() => ({})),
            rerouteConnectionIn: entryParams.rerouteConnectionIn || undefined,
        }
    })
    return nodeBuilders
}
