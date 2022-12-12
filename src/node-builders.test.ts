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
import NODE_BUILDERS from './node-builders'
import {
    pdJsonNodeDefaults,
    pdJsonPatchDefaults,
} from '@webpd/pd-json/src/test-helpers'
import { PdJson } from '@webpd/pd-json'
import { PartialNode } from '@webpd/pd-json/src/types'
import { DspGraph } from '@webpd/dsp-graph'

describe('node-builders', () => {
    const PATCH = pdJsonPatchDefaults('0')

    const NODE_ID = '0'

    const testNodeTranslateArgs = (
        objectType: keyof typeof NODE_BUILDERS,
        args: PdJson.ObjectArgs,
        expectedNodeArgs: DspGraph.NodeArguments,
        patch = PATCH
    ) => {
        const pdNode = {
            ...pdJsonNodeDefaults(NODE_ID),
            args,
        }
        const nodeArgs = (NODE_BUILDERS as any)[objectType].translateArgs(
            pdNode,
            patch
        )
        assert.deepStrictEqual(nodeArgs, expectedNodeArgs)
    }

    const testNodeBuild = (
        objectType: keyof typeof NODE_BUILDERS,
        nodeArgs: DspGraph.NodeArguments,
        expectedPartialNode: Partial<PartialNode>
    ) => {
        const partialNode = NODE_BUILDERS[objectType].build(nodeArgs as any)
        Object.entries(expectedPartialNode).forEach(([key, value]) => {
            assert.ok(key in partialNode)
            assert.deepStrictEqual((partialNode as any)[key], value)
        })
    }

    describe('binop~', () => {
        describe('translateArgs', () => {
            it('should have optional first arg', () => {
                testNodeTranslateArgs('+~', [], { value: undefined })
            })
        })
    })

    describe('osc~', () => {
        describe('translateArgs', () => {
            it('should have optional first arg', () => {
                testNodeTranslateArgs('osc~', [], { frequency: undefined })
            })
        })
    })

    describe('mixer~', () => {
        describe('build', () => {
            it('should create inlets for channelCount', () => {
                testNodeBuild(
                    'mixer~',
                    {
                        channelCount: 3,
                    },
                    {
                        inlets: {
                            '0': { type: 'signal', id: '0' },
                            '1': { type: 'signal', id: '1' },
                            '2': { type: 'signal', id: '2' },
                        },
                    }
                )
            })
        })
    })

    describe('dac~', () => {
        describe('translateArgs', () => {
            it('should convert channel indices to 0-indexed', () => {
                testNodeTranslateArgs('dac~', [1, 2], {
                    channelMapping: [0, 1],
                })
            })

            it('should infer default channelMapping from incoming connections', () => {
                testNodeTranslateArgs(
                    'dac~',
                    [],
                    {
                        channelMapping: [0, 1, 2],
                    },
                    {
                        ...PATCH,
                        connections: [
                            {
                                source: { nodeId: 'someNode', portletId: 0 },
                                sink: { nodeId: NODE_ID, portletId: 0 },
                            },
                            {
                                source: { nodeId: 'someNode', portletId: 0 },
                                sink: { nodeId: NODE_ID, portletId: 2 },
                            },
                        ],
                    }
                )
            })
        })

        describe('build', () => {
            it('should create inlets for channelMapping', () => {
                testNodeBuild(
                    'dac~',
                    { channelMapping: [0, 2, 10] },
                    {
                        inlets: {
                            '0': { type: 'signal', id: '0' },
                            '1': { type: 'signal', id: '1' },
                            '2': { type: 'signal', id: '2' },
                        },
                    }
                )
            })
        })
    })

    describe('metro', () => {
        describe('translateArgs', () => {
            it('should have optional first arg', () => {
                testNodeTranslateArgs('metro', [], { rate: undefined })
            })
        })
    })
})
