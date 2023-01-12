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
import { nodeImplementation, builder } from './osc~'
import { buildNode, testNodeTranslateArgs } from './test-helpers'

describe('osc~', () => {
    describe('builder', () => {
        describe('translateArgs', () => {
            it('should have optional first arg', () => {
                testNodeTranslateArgs(builder, [], { frequency: undefined })
            })
        })
    })

    describe('implementation', () => {
        it.each<{ target: CompilerTarget }>([
            { target: 'javascript' },
            { target: 'assemblyscript' },
        ])('should work with signal frequency %s', async ({ target }) => {
            const { sampleRate } =
                nodeImplementationsTestHelpers.ENGINE_DSP_PARAMS
            const frequency1 = 100
            const frequency2 = 200
            const frequency3 = 50
            const J = (2 * Math.PI) / sampleRate
            await nodeImplementationsTestHelpers.assertNodeOutput(
                {
                    target,
                    node: buildNode(builder, 'osc~', {
                        frequency: 0,
                    }),
                    nodeImplementation,
                },
                [
                    { ins: { '0_signal': frequency1 } },
                    { outs: { '0': Math.cos(0) } },
                ],
                [
                    { ins: { '0_signal': frequency1 } },
                    { outs: { '0': Math.cos(100 * J) } },
                ],
                [
                    { ins: { '0_signal': frequency2 } },
                    { outs: { '0': Math.cos(200 * J) } },
                ],
                [
                    { ins: { '0_signal': frequency2 } },
                    { outs: { '0': Math.cos(400 * J) } },
                ],
                [
                    { ins: { '0_signal': frequency3 } },
                    { outs: { '0': Math.cos(600 * J) } },
                ],
                [
                    { ins: { '0_signal': frequency3 } },
                    { outs: { '0': Math.cos(650 * J) } },
                ]
            )
        })

        it.each<{ target: CompilerTarget }>([
            { target: 'javascript' },
            { target: 'assemblyscript' },
        ])(
            'should work with signal frequency settings phase %s',
            async ({ target }) => {
                const { sampleRate } =
                    nodeImplementationsTestHelpers.ENGINE_DSP_PARAMS
                const frequency = 100
                const J = (2 * Math.PI * frequency) / sampleRate

                await nodeImplementationsTestHelpers.assertNodeOutput(
                    {
                        target,
                        node: buildNode(builder, 'osc~', { frequency }),
                        nodeImplementation,
                    },
                    [
                        { ins: { '0_signal': frequency, '1': [] } },
                        { outs: { '0': Math.cos(0) } },
                    ],
                    [
                        { ins: { '0_signal': frequency, '1': [] } },
                        { outs: { '0': Math.cos(1 * J) } },
                    ],
                    [
                        { ins: { '0_signal': frequency, '1': [[0]] } },
                        { outs: { '0': 1.0 } },
                    ],
                    [
                        { ins: { '0_signal': frequency, '1': [[0.25]] } },
                        { outs: { '0': 0.0 } },
                    ],
                    [
                        { ins: { '0_signal': frequency, '1': [[-2.5]] } },
                        { outs: { '0': -1.0 } },
                    ]
                )
            }
        )

        it.each<{ target: CompilerTarget }>([
            { target: 'javascript' },
            { target: 'assemblyscript' },
        ])('should work with message frequency %s', async ({ target }) => {
            const { sampleRate } =
                nodeImplementationsTestHelpers.ENGINE_DSP_PARAMS
            const frequency1 = 100
            const frequency2 = 300
            const J = (2 * Math.PI * frequency1) / sampleRate

            await nodeImplementationsTestHelpers.assertNodeOutput(
                {
                    target,
                    node: buildNode(builder, 'osc~', {
                        frequency: frequency1,
                    }),
                    nodeImplementation,
                },
                [{ ins: { '0_message': [] } }, { outs: { '0': Math.cos(0) } }],
                [
                    { ins: { '0_message': [] } },
                    { outs: { '0': Math.cos(1 * J) } },
                ],
                [
                    { ins: { '0_message': [[frequency2]] } },
                    { outs: { '0': Math.cos(2 * J) } },
                ],
                [
                    { ins: { '0_message': [] } },
                    { outs: { '0': Math.cos(5 * J) } },
                ],
                [
                    { ins: { '0_message': [] } },
                    { outs: { '0': Math.cos(8 * J) } },
                ]
            )
        })

        it.each<{ target: CompilerTarget }>([
            { target: 'javascript' },
            { target: 'assemblyscript' },
        ])(
            'should work with message frequency settings phase %s',
            async ({ target }) => {
                const { sampleRate } =
                    nodeImplementationsTestHelpers.ENGINE_DSP_PARAMS
                const frequency = 100
                const J = (2 * Math.PI * frequency) / sampleRate

                await nodeImplementationsTestHelpers.assertNodeOutput(
                    {
                        target,
                        node: buildNode(builder, 'osc~', { frequency }),
                        nodeImplementation,
                    },
                    [{ ins: { '1': [] } }, { outs: { '0': Math.cos(0) } }],
                    [{ ins: { '1': [] } }, { outs: { '0': Math.cos(1 * J) } }],
                    [{ ins: { '1': [[0]] } }, { outs: { '0': 1.0 } }],
                    [{ ins: { '1': [[0.25]] } }, { outs: { '0': 0.0 } }],
                    [{ ins: { '1': [[-2.5]] } }, { outs: { '0': -1.0 } }]
                )
            }
        )
    })
})
