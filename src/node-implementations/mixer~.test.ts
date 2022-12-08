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

describe('mixer~', () => {
    it('should sum incoming signals together', async () => {
        await nodeImplementationsTestHelpers.assertNodeOutput(
            {
                node: buildNode(NODE_BUILDERS['mixer~'], 'mixer~', {
                    channels: 3,
                }),
                nodeImplementations: NODE_IMPLEMENTATIONS,
            },
            [
                { '0': 10, '1': 1, '2': 0.1 },
                { '0': 20, '1': 2, '2': 0.2 },
                { '0': 30, '1': 3, '2': 0.3 },
            ],
            [{ '0': 11.1 }, { '0': 22.2 }, { '0': 33.3 }]
        )
    })
})
