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
import NODE_IMPLEMENTATIONS from '.'
import NODE_BUILDERS from '../node-builders'
import { buildNode } from './test-helpers'

describe('osc~', () => {
    it.each<{ target: CompilerTarget }>([
        {target: 'javascript'},
        {target: 'assemblyscript'},
    ])('should work with signal frequency %s', async ({ target }) => {
        const { sampleRate } = nodeImplementationsTestHelpers.ENGINE_DSP_PARAMS
        const frequency1 = 100
        const frequency2 = 200
        const frequency3 = 50
        const J = (2 * Math.PI) / sampleRate
        await nodeImplementationsTestHelpers.assertNodeOutput(
            {
                target,
                node: buildNode(NODE_BUILDERS['osc~'], 'osc~', {
                    frequency: 0,
                }),
                nodeImplementations: NODE_IMPLEMENTATIONS,
                connectedSources: ['0_signal'],
            },
            [
                { '0_signal': frequency1 },
                { '0_signal': frequency1 },
                { '0_signal': frequency2 },
                { '0_signal': frequency2 },
                { '0_signal': frequency3 },
                { '0_signal': frequency3 },
            ],
            [
                { '0': Math.cos(0) },
                { '0': Math.cos(100 * J) },
                { '0': Math.cos(200 * J) },
                { '0': Math.cos(400 * J) },
                { '0': Math.cos(600 * J) },
                { '0': Math.cos(650 * J) },
            ]
        )
    })

    it.each<{ target: CompilerTarget }>([
        {target: 'javascript'},
        {target: 'assemblyscript'},
    ])('should work with signal frequency settings phase %s', async ({ target }) => {
        const { sampleRate } = nodeImplementationsTestHelpers.ENGINE_DSP_PARAMS
        const frequency = 100
        const J = (2 * Math.PI * frequency) / sampleRate

        await nodeImplementationsTestHelpers.assertNodeOutput(
            {
                target,
                node: buildNode(NODE_BUILDERS['osc~'], 'osc~', { frequency }),
                nodeImplementations: NODE_IMPLEMENTATIONS,
                connectedSources: ['0_signal'],
            },
            [
                { '0_signal': frequency, '1': [] },
                { '0_signal': frequency, '1': [] },
                { '0_signal': frequency, '1': [[0]] },
                { '0_signal': frequency, '1': [[0.25]] },
                { '0_signal': frequency, '1': [[-2.5]] },
            ],
            [
                { '0': Math.cos(0) },
                { '0': Math.cos(1 * J) },
                { '0': 1.0 },
                { '0': 0.0 },
                { '0': -1.0 },
            ]
        )
    })

    it.each<{ target: CompilerTarget }>([
        {target: 'javascript'},
        {target: 'assemblyscript'},
    ])('should work with message frequency %s', async ({ target }) => {
        const { sampleRate } = nodeImplementationsTestHelpers.ENGINE_DSP_PARAMS
        const frequency1 = 100
        const frequency2 = 300
        const J = (2 * Math.PI * frequency1) / sampleRate

        await nodeImplementationsTestHelpers.assertNodeOutput(
            {
                target,
                node: buildNode(NODE_BUILDERS['osc~'], 'osc~', {
                    frequency: frequency1,
                }),
                nodeImplementations: NODE_IMPLEMENTATIONS,
            },
            [
                { '0_message': [] },
                { '0_message': [] },
                { '0_message': [[frequency2]] },
                { '0_message': [] },
                { '0_message': [] },
            ],
            [
                { '0': Math.cos(0) },
                { '0': Math.cos(1 * J) },
                { '0': Math.cos(2 * J) },
                { '0': Math.cos(5 * J) },
                { '0': Math.cos(8 * J) },
            ]
        )
    })

    it.each<{ target: CompilerTarget }>([
        {target: 'javascript'},
        {target: 'assemblyscript'},
    ])('should work with message frequency settings phase %s', async ({ target }) => {
        const { sampleRate } = nodeImplementationsTestHelpers.ENGINE_DSP_PARAMS
        const frequency = 100
        const J = (2 * Math.PI * frequency) / sampleRate

        await nodeImplementationsTestHelpers.assertNodeOutput(
            {
                target,
                node: buildNode(NODE_BUILDERS['osc~'], 'osc~', { frequency }),
                nodeImplementations: NODE_IMPLEMENTATIONS,
            },
            [
                { '1': [] },
                { '1': [] },
                { '1': [[0]] },
                { '1': [[0.25]] },
                { '1': [[-2.5]] },
            ],
            [
                { '0': Math.cos(0) },
                { '0': Math.cos(1 * J) },
                { '0': 1.0 },
                { '0': 0.0 },
                { '0': -1.0 },
            ]
        )
    })
})
