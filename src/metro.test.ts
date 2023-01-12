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

import * as nodeImplementationsTestHelpers from '@webpd/compiler-js/src/test-helpers-node-implementations'
import { CompilerTarget } from '@webpd/compiler-js/src/types'
import { nodeImplementation, builder } from './metro'
import { buildNode, testNodeTranslateArgs } from './test-helpers'

const SAMPLE_RATE = nodeImplementationsTestHelpers.ENGINE_DSP_PARAMS.sampleRate

describe('metro', () => {
    describe('builder', () => {
        describe('translateArgs', () => {
            it('should have optional first arg', () => {
                testNodeTranslateArgs(builder, [], { rate: undefined })
            })
        })
    })

    describe('implementation', () => {
        it.each<{ target: CompilerTarget }>([
            { target: 'javascript' },
            { target: 'assemblyscript' },
        ])(
            'should start metro at rate passed as arg %s',
            async ({ target }) => {
                await nodeImplementationsTestHelpers.assertNodeOutput(
                    {
                        target,
                        node: buildNode(builder, 'metro', {
                            rate: (2 * 1000) / SAMPLE_RATE,
                        }),
                        nodeImplementation,
                    },
                    [{ ins: {} }, { outs: { '0': [] } }],
                    [{ ins: {} }, { outs: { '0': [] } }],
                    [
                        { ins: { '0': [['bang']] } },
                        { outs: { '0': [['bang']] } },
                    ],
                    [{ ins: {} }, { outs: { '0': [] } }],
                    [{ ins: {} }, { outs: { '0': [['bang']] } }]
                )
            }
        )

        it.each<{ target: CompilerTarget }>([
            { target: 'javascript' },
            { target: 'assemblyscript' },
        ])('should start metro when sent 1 %s', async ({ target }) => {
            await nodeImplementationsTestHelpers.assertNodeOutput(
                {
                    target,
                    node: buildNode(builder, 'metro', {
                        rate: (1 * 1000) / SAMPLE_RATE,
                    }),
                    nodeImplementation,
                },
                [{ ins: { '0': [[1]] } }, { outs: { '0': [['bang']] } }],
                [{ ins: {} }, { outs: { '0': [['bang']] } }]
            )
        })

        it.each<{ target: CompilerTarget }>([
            { target: 'javascript' },
            { target: 'assemblyscript' },
        ])(
            'should start metro at rate passed to inlet 1 %s',
            async ({ target }) => {
                await nodeImplementationsTestHelpers.assertNodeOutput(
                    {
                        target,
                        node: buildNode(builder, 'metro', {
                            rate: (2 * 1000) / SAMPLE_RATE,
                        }),
                        nodeImplementation,
                    },
                    [
                        { ins: { '0': [['bang']] } },
                        { outs: { '0': [['bang']] } },
                    ],
                    [{ ins: {} }, { outs: { '0': [] } }],
                    [
                        { ins: { '1': [[1000 / SAMPLE_RATE]] } },
                        { outs: { '0': [['bang']] } },
                    ],
                    [{ ins: {} }, { outs: { '0': [['bang']] } }],
                    [{ ins: {} }, { outs: { '0': [['bang']] } }]
                )
            }
        )

        it.each<{ target: CompilerTarget }>([
            { target: 'javascript' },
            { target: 'assemblyscript' },
        ])('should stop metro when receiving stop %s', async ({ target }) => {
            await nodeImplementationsTestHelpers.assertNodeOutput(
                {
                    target,
                    node: buildNode(builder, 'metro', {
                        rate: (1 * 1000) / SAMPLE_RATE,
                    }),
                    nodeImplementation,
                },
                [{ ins: { '0': [['bang']] } }, { outs: { '0': [['bang']] } }],
                [{ ins: {} }, { outs: { '0': [['bang']] } }],
                [{ ins: { '0': [['stop']] } }, { outs: { '0': [] } }]
            )
        })

        it.each<{ target: CompilerTarget }>([
            { target: 'javascript' },
            { target: 'assemblyscript' },
        ])('should stop metro when receiving 0 %s', async ({ target }) => {
            await nodeImplementationsTestHelpers.assertNodeOutput(
                {
                    target,
                    node: buildNode(builder, 'metro', {
                        rate: (1 * 1000) / SAMPLE_RATE,
                    }),
                    nodeImplementation,
                },
                [{ ins: { '0': [['bang']] } }, { outs: { '0': [['bang']] } }],
                [{ ins: {} }, { outs: { '0': [['bang']] } }],
                [{ ins: { '0': [[0]] } }, { outs: { '0': [] } }]
            )
        })
    })
})
