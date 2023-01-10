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
import { nodeImplementation, builder } from './delay'
import { buildNode, testNodeTranslateArgs } from './test-helpers'

describe('delay', () => {

    describe('builder', () => {
        describe('translateArgs', () => {
            it('should have defaults', () => {
                testNodeTranslateArgs(builder, [], { 
                    delay: 0, 
                    unit: 'msec', 
                    unitAmount: 1 
                })
                testNodeTranslateArgs(builder, [100, 10, 'seconds'], { 
                    delay: 100, 
                    unit: 'seconds', 
                    unitAmount: 10 
                })
            })
        })
    })

    describe('implementation', () => {
        it.each<{ target: CompilerTarget }>([
            {target: 'javascript'},
            {target: 'assemblyscript'},
        ])('should start delay passed as arg on bang or start %s', async ({ target }) => {
            await nodeImplementationsTestHelpers.assertNodeOutput(
                {
                    target,
                    node: buildNode(builder, 'delay', {
                        delay: 2,
                        unit: 'samples',
                        unitAmount: 1,
                    }),
                    nodeImplementation,
                },
                [
                    {},
                    {'0': [['bang']]},
                    {},
                    {},
                    {'0': [['start']]},
                    {},
                    {},
                ],
                [
                    { '0': [] },
                    { '0': [] },
                    { '0': [] },
                    { '0': [['bang']] },
                    { '0': [] },
                    { '0': [] },
                    { '0': [['bang']] },
                ]
            )
        })

        it.each<{ target: CompilerTarget }>([
            {target: 'javascript'},
            {target: 'assemblyscript'},
        ])('should cancel previous delay %s', async ({ target }) => {
            await nodeImplementationsTestHelpers.assertNodeOutput(
                {
                    target,
                    node: buildNode(builder, 'delay', {
                        delay: 2,
                        unit: 'samples',
                        unitAmount: 1,
                    }),
                    nodeImplementation,
                },
                [
                    {},
                    {'0': [['bang']]},
                    {},
                    {'0': [['bang']]},
                    {},
                    {},
                ],
                [
                    { '0': [] },
                    { '0': [] },
                    { '0': [] },
                    { '0': [] },
                    { '0': [] },
                    { '0': [['bang']]},
                ]
            )
        })

        it.each<{ target: CompilerTarget }>([
            {target: 'javascript'},
            {target: 'assemblyscript'},
        ])('should stop the delay on stop %s', async ({ target }) => {
            await nodeImplementationsTestHelpers.assertNodeOutput(
                {
                    target,
                    node: buildNode(builder, 'delay', {
                        delay: 2,
                        unit: 'samples',
                        unitAmount: 1,
                    }),
                    nodeImplementation,
                },
                [
                    {},
                    {'0': [['bang']]},
                    {'0': [['stop']]},
                    {},
                    {},
                ],
                [
                    { '0': [] },
                    { '0': [] },
                    { '0': [] },
                    { '0': [] },
                    { '0': [] },
                ]
            )
        })

        it.each<{ target: CompilerTarget }>([
            {target: 'javascript'},
            {target: 'assemblyscript'},
        ])('should set the delay and start it on float %s', async ({ target }) => {
            await nodeImplementationsTestHelpers.assertNodeOutput(
                {
                    target,
                    node: buildNode(builder, 'delay', {
                        delay: 2,
                        unit: 'samples',
                        unitAmount: 1,
                    }),
                    nodeImplementation,
                },
                [
                    {},
                    {'0': [[3]]},
                    {},
                    {},
                    {},
                ],
                [
                    { '0': [] },
                    { '0': [] },
                    { '0': [] },
                    { '0': [] },
                    { '0': [['bang']] },
                ]
            )
        })

        it.each<{ target: CompilerTarget }>([
            {target: 'javascript'},
            {target: 'assemblyscript'},
        ])('should set the time unit on tempo message %s', async ({ target }) => {
            await nodeImplementationsTestHelpers.assertNodeOutput(
                {
                    target,
                    node: buildNode(builder, 'delay', {
                        delay: 2,
                        unit: 'samples',
                        unitAmount: 1,
                    }),
                    nodeImplementation,
                },
                [
                    {},
                    {'0': [['tempo', 2, 'samp'], ['bang']]},
                    {},
                    {},
                    {},
                    {},
                ],
                [
                    { '0': [] },
                    { '0': [] },
                    { '0': [] },
                    { '0': [] },
                    { '0': [] },
                    { '0': [['bang']] },
                ]
            )
        })

        it.each<{ target: CompilerTarget }>([
            {target: 'javascript'},
            {target: 'assemblyscript'},
        ])('should set the delay with message on inlet 1 %s', async ({ target }) => {
            await nodeImplementationsTestHelpers.assertNodeOutput(
                {
                    target,
                    node: buildNode(builder, 'delay', {
                        delay: 2,
                        unit: 'samples',
                        unitAmount: 1,
                    }),
                    nodeImplementation,
                },
                [
                    {'0': [['bang']]},
                    {'1': [[1]]},
                    {},
                    {},
                    {},
                ],
                [
                    { '0': [] },
                    { '0': [] },
                    { '0': [['bang']] },
                    { '0': [] },
                    { '0': [] },
                ]
            )
        })

    })
})
