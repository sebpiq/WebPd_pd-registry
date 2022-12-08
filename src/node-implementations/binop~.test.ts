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

import { nodeImplementationsTestHelpers } from '@webpd/compiler-js'
import NODE_IMPLEMENTATIONS from '.'
import NODE_BUILDERS from '../node-builders'
import { buildNode } from './test-helpers'

describe('binop~', () => {
    describe('+~', () => {
        it('should work with signal as inlet 1', async () => {
            await nodeImplementationsTestHelpers.assertNodeOutput(
                {
                    node: buildNode(NODE_BUILDERS['+~'], '+~', { value: 1 }),
                    nodeImplementations: NODE_IMPLEMENTATIONS,
                    connectedSources: ['1_signal'],
                },
                [
                    { '0': 1, '1_signal': 0.1 },
                    { '0': 2, '1_signal': 0.2 },
                    { '0': 3, '1_signal': 0.3 },
                ],
                [{ '0': 1.1 }, { '0': 2.2 }, { '0': 3.3 }]
            )
        })

        it('should have default message value 0', async () => {
            await nodeImplementationsTestHelpers.assertNodeOutput(
                {
                    node: buildNode(NODE_BUILDERS['+~'], '+~', {}),
                    nodeImplementations: NODE_IMPLEMENTATIONS,
                    connectedSources: ['1_message'],
                },
                [{ '0': 123 }],
                [{ '0': 123 }]
            )
        })

        it('should work with message messages to inlet 1', async () => {
            await nodeImplementationsTestHelpers.assertNodeOutput(
                {
                    node: buildNode(NODE_BUILDERS['+~'], '+~', { value: 10 }),
                    nodeImplementations: NODE_IMPLEMENTATIONS,
                    connectedSources: ['1_message'],
                },
                [
                    { '0': 1 },
                    { '0': 2, '1_message': [[0.1]] },
                    { '0': 3 },
                    { '0': 4, '1_message': [[0.2]] },
                    { '0': 5 },
                ],
                [
                    { '0': 11 },
                    { '0': 2.1 },
                    { '0': 3.1 },
                    { '0': 4.2 },
                    { '0': 5.2 },
                ]
            )
        })
    })

    describe('*~', () => {
        it('should work with signal as inlet 1', async () => {
            await nodeImplementationsTestHelpers.assertNodeOutput(
                {
                    node: buildNode(NODE_BUILDERS['*~'], '*~', { value: 1 }),
                    nodeImplementations: NODE_IMPLEMENTATIONS,
                    connectedSources: ['1_signal'],
                },
                [
                    { '0': 1, '1_signal': 1 },
                    { '0': 10, '1_signal': 2 },
                    { '0': 100, '1_signal': 3 },
                ],
                [{ '0': 1 }, { '0': 20 }, { '0': 300 }]
            )
        })

        it('should have default message value 1', async () => {
            await nodeImplementationsTestHelpers.assertNodeOutput(
                {
                    node: buildNode(NODE_BUILDERS['*~'], '*~', {}),
                    nodeImplementations: NODE_IMPLEMENTATIONS,
                    connectedSources: ['1_message'],
                },
                [{ '0': 123 }],
                [{ '0': 123 }]
            )
        })

        it('should work with messages to inlet 1', async () => {
            await nodeImplementationsTestHelpers.assertNodeOutput(
                {
                    node: buildNode(NODE_BUILDERS['*~'], '*~', { value: 2 }),
                    nodeImplementations: NODE_IMPLEMENTATIONS,
                    connectedSources: ['1_message'],
                },
                [
                    { '0': 1 },
                    { '0': 2, '1_message': [[3]] },
                    { '0': 3 },
                    { '0': 4, '1_message': [[4]] },
                    { '0': 5 },
                ],
                [{ '0': 2 }, { '0': 6 }, { '0': 9 }, { '0': 16 }, { '0': 20 }]
            )
        })
    })
})
