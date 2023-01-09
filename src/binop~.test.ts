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
import { builder, nodeImplementations } from './binop~'
import { buildNode, testNodeTranslateArgs } from './test-helpers'

describe('binop~', () => {
    
    describe('builder', () => {
        describe('translateArgs', () => {
            it('should have optional first arg', () => {
                testNodeTranslateArgs(builder, [], { value: undefined })
            })
        })
    })

    describe('implementation', () => {

        describe('+~', () => {
            it.each<{ target: CompilerTarget }>([
                {target: 'javascript'},
                {target: 'assemblyscript'},
            ])('should work with signal as inlet 1 %s', async ({ target }) => {
                await nodeImplementationsTestHelpers.assertNodeOutput(
                    {
                        target,
                        node: buildNode(builder, '+~', { value: 1 }),
                        nodeImplementation: nodeImplementations['+~'],
                    },
                    [
                        { '0': 1, '1_signal': 0.1 },
                        { '0': 2, '1_signal': 0.2 },
                        { '0': 3, '1_signal': 0.3 },
                    ],
                    [{ '0': 1.1 }, { '0': 2.2 }, { '0': 3.3 }]
                )
            })
    
            it.each<{ target: CompilerTarget }>([
                {target: 'javascript'},
                {target: 'assemblyscript'},
            ])('should have default message value 0 %s', async ({ target }) => {
                await nodeImplementationsTestHelpers.assertNodeOutput(
                    {
                        target,
                        node: buildNode(builder, '+~', {}),
                        nodeImplementation: nodeImplementations['+~'],
                    },
                    [{ '0': 123 }],
                    [{ '0': 123 }]
                )
            })
    
            it.each<{ target: CompilerTarget }>([
                {target: 'javascript'},
                {target: 'assemblyscript'},
            ])('should work with message messages to inlet 1 %s', async ({ target }) => {
                await nodeImplementationsTestHelpers.assertNodeOutput(
                    {
                        target,
                        node: buildNode(builder, '+~', { value: 10 }),
                        nodeImplementation: nodeImplementations['+~'],
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
            it.each<{ target: CompilerTarget }>([
                {target: 'javascript'},
                {target: 'assemblyscript'},
            ])('should work with signal as inlet 1 %s', async ({ target }) => {
                await nodeImplementationsTestHelpers.assertNodeOutput(
                    {
                        target,
                        node: buildNode(builder, '*~', { value: 1 }),
                        nodeImplementation: nodeImplementations['*~'],
                    },
                    [
                        { '0': 1, '1_signal': 1 },
                        { '0': 10, '1_signal': 2 },
                        { '0': 100, '1_signal': 3 },
                    ],
                    [{ '0': 1 }, { '0': 20 }, { '0': 300 }]
                )
            })
    
            it.each<{ target: CompilerTarget }>([
                {target: 'javascript'},
                {target: 'assemblyscript'},
            ])('should have default message value 1 %s', async ({ target }) => {
                await nodeImplementationsTestHelpers.assertNodeOutput(
                    {
                        target,
                        node: buildNode(builder, '*~', {}),
                        nodeImplementation: nodeImplementations['*~'],
                    },
                    [{ '0': 123 }],
                    [{ '0': 123 }]
                )
            })
    
            it.each<{ target: CompilerTarget }>([
                {target: 'javascript'},
                {target: 'assemblyscript'},
            ])('should work with messages to inlet 1 %s', async ({ target }) => {
                await nodeImplementationsTestHelpers.assertNodeOutput(
                    {
                        target,
                        node: buildNode(builder, '*~', { value: 2 }),
                        nodeImplementation: nodeImplementations['*~'],
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
})