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
import { nodeImplementation, builder } from './msg'
import { buildNode } from './test-helpers'

describe('msg', () => {

    describe('implementation', () => {
        it.each<{ target: CompilerTarget }>([
            {target: 'javascript'},
            {target: 'assemblyscript'},
        ])('should transfer directly messages without dollar strings %s', async ({ target }) => {
            await nodeImplementationsTestHelpers.assertNodeOutput(
                {
                    target,
                    node: buildNode(builder, 'msg', {
                        template: [123, 'hello'],
                    }),
                    nodeImplementation,
                },
                [
                    {ins: { '0': [['bang'], ['blabla'], ['quoi?', 456]] }},
                    {outs: {
                        '0': [
                            [123, 'hello'],
                            [123, 'hello'],
                            [123, 'hello'],
                        ],
                    }},
                ]
            )
        })
    
        it.each<{ target: CompilerTarget }>([
            {target: 'javascript'},
            {target: 'assemblyscript'},
        ])('should substitute entire dollar strings %s', async ({ target }) => {
            await nodeImplementationsTestHelpers.assertNodeOutput(
                {
                    target,
                    node: buildNode(builder, 'msg', {
                        template: [123, '$2', '$1'],
                    }),
                    nodeImplementation,
                },
                [
                    {ins: {
                        '0': [
                            ['wow', 'hehe', 'hoho'],
                            ['blabla', 456],
                        ],
                    }},
                    {outs: {
                        '0': [
                            [123, 'hehe', 'wow'],
                            [123, 456, 'blabla'],
                        ],
                    }},
                ]
            )
        })
    
        it.each<{ target: CompilerTarget }>([
            {target: 'javascript'},
            {target: 'assemblyscript'},
        ])('should substitute dollar strings within strings %s', async ({ target }) => {
            await nodeImplementationsTestHelpers.assertNodeOutput(
                {
                    target,
                    node: buildNode(builder, 'msg', {
                        template: ['hello_$2', '$1', 'greetings'],
                    }),
                    nodeImplementation,
                },
                [
                    {ins: {
                        '0': [
                            ['earth', 'saturn'],
                            ['satan', 666],
                        ],
                    }},
                    {outs: {
                        '0': [
                            ['hello_saturn', 'earth', 'greetings'],
                            ['hello_666', 'satan', 'greetings'],
                        ],
                    }},
                ]
            )
        })
    })
})
