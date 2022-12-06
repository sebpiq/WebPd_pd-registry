import { DspGraph } from '@webpd/dsp-graph'

// Patch translation PdJson -> DspGraph
interface PartialNode {
    inlets: DspGraph.Node['inlets']
    outlets: DspGraph.Node['outlets']
    isEndSink?: DspGraph.Node['isEndSink']
}

export interface NodeBuilder {
    translateArgs: (
        objectArgs: PdJson.ObjectArgs,
        patch: PdJson.Patch
    ) => DspGraph.NodeArguments
    build: (nodeArgs: DspGraph.NodeArguments) => PartialNode

    // Hook that allows to re-route a connection from the node to a different inlet.
    // Useful for example for inlets in Pd that receive both signal and control,
    // allows to split connections into pure signal and pure control connection instead.
    rerouteConnectionIn?: (
        outlet: DspGraph.Portlet,
        inletId: DspGraph.PortletId
    ) => DspGraph.PortletId | undefined
}

export interface NodeBuilders {
    [nodeType: string]: NodeBuilder
}
