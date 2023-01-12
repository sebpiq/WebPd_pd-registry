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
import { nodeImplementation, builder } from './mixer~'
import { buildNode, testNodeBuild } from './test-helpers'

describe('mixer~', () => {
    describe('builer', () => {
        describe('build', () => {
            it('should create inlets for channelCount', () => {
                testNodeBuild(
                    builder,
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

    describe('implementation', () => {
        it.each<{ target: CompilerTarget }>([
            { target: 'javascript' },
            { target: 'assemblyscript' },
        ])('should sum incoming signals together %s', async ({ target }) => {
            await nodeImplementationsTestHelpers.assertNodeOutput(
                {
                    target,
                    node: buildNode(builder, 'mixer~', {
                        channelCount: 3,
                    }),
                    nodeImplementation,
                },
                [
                    { ins: { '0': 10, '1': 1, '2': 0.1 } },
                    { outs: { '0': 11.1 } },
                ],
                [
                    { ins: { '0': 20, '1': 2, '2': 0.2 } },
                    { outs: { '0': 22.2 } },
                ],
                [
                    { ins: { '0': 30, '1': 3, '2': 0.3 } },
                    { outs: { '0': 33.3 } },
                ]
            )
        })
    })
})
