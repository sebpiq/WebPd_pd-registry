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
import { NodeBuilder, PdJson } from '@webpd/pd-json'
import { pdJsonNodeDefaults, pdJsonPatchDefaults } from '@webpd/pd-json/src/test-helpers'
import { PartialNode } from '@webpd/pd-json/src/types'
import assert from 'assert'

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

export const TEST_PATCH = pdJsonPatchDefaults('0')
export const TEST_NODE_ID = '0'

export const testNodeTranslateArgs = <NodeArguments>(
    nodeBuilder: NodeBuilder<NodeArguments>,
    args: PdJson.ObjectArgs,
    expectedNodeArgs: NodeArguments,
    patch = TEST_PATCH
) => {
    const pdNode = {
        ...pdJsonNodeDefaults(TEST_NODE_ID),
        args,
    }
    const nodeArgs = nodeBuilder.translateArgs(
        pdNode,
        patch
    )
    assert.deepStrictEqual(nodeArgs, expectedNodeArgs)
}

export const testNodeBuild = <NodeArguments>(
    nodeBuilder: NodeBuilder<NodeArguments>,
    nodeArgs: NodeArguments,
    expectedPartialNode: Partial<PartialNode>
) => {
    const partialNode = nodeBuilder.build(nodeArgs)
    Object.entries(expectedPartialNode).forEach(([key, value]) => {
        assert.ok(key in partialNode)
        assert.deepStrictEqual((partialNode as any)[key], value)
    })
}