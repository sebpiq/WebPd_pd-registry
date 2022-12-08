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

describe('msg', () => {
    it('should transfer directly messages without dollar strings', async () => {
        await nodeImplementationsTestHelpers.assertNodeOutput(
            {
                node: buildNode(NODE_BUILDERS['msg'], 'msg', {
                    template: [123, 'hello'],
                }),
                nodeImplementations: NODE_IMPLEMENTATIONS,
            },
            [{ '0': [['bang'], ['blabla'], ['quoi?', 456]] }],
            [
                {
                    '0': [
                        [123, 'hello'],
                        [123, 'hello'],
                        [123, 'hello'],
                    ],
                },
            ]
        )
    })

    it('should substitute entire dollar strings', async () => {
        await nodeImplementationsTestHelpers.assertNodeOutput(
            {
                node: buildNode(NODE_BUILDERS['msg'], 'msg', {
                    template: [123, '$2', '$1'],
                }),
                nodeImplementations: NODE_IMPLEMENTATIONS,
            },
            [
                {
                    '0': [
                        ['wow', 'hehe', 'hoho'],
                        ['blabla', 456],
                    ],
                },
            ],
            [
                {
                    '0': [
                        [123, 'hehe', 'wow'],
                        [123, 456, 'blabla'],
                    ],
                },
            ]
        )
    })

    it('should substitute dollar strings within strings', async () => {
        await nodeImplementationsTestHelpers.assertNodeOutput(
            {
                node: buildNode(NODE_BUILDERS['msg'], 'msg', {
                    template: ['hello_$2', '$1', 'greetings'],
                }),
                nodeImplementations: NODE_IMPLEMENTATIONS,
            },
            [
                {
                    '0': [
                        ['earth', 'saturn'],
                        ['satan', 666],
                    ],
                },
            ],
            [
                {
                    '0': [
                        ['hello_saturn', 'earth', 'greetings'],
                        ['hello_666', 'satan', 'greetings'],
                    ],
                },
            ]
        )
    })
})
