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
import { nodeDefaults } from '@webpd/dsp-graph/src/test-helpers'
import { NodeBuilder } from '@webpd/pd-json'

export const buildNode = <NodeArgsType>(
    nodeBuilder: NodeBuilder<NodeArgsType>,
    type: DspGraph.NodeType,
    args: NodeArgsType
): DspGraph.Node => {
    return {
        ...nodeDefaults('DUMMY', type),
        type,
        args: args as unknown as DspGraph.NodeArguments,
        ...nodeBuilder.build(args),
    }
}
