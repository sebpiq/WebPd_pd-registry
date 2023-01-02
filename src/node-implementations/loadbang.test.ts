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

describe('loadbang', () => {
    it.each<{ target: CompilerTarget }>([
        {target: 'javascript'},
        {target: 'assemblyscript'},
    ])('should output a bang on creation %s', async ({ target }) => {
        await nodeImplementationsTestHelpers.assertNodeOutput(
            {
                target,
                node: buildNode(NODE_BUILDERS['loadbang'], 'loadbang', {}),
                nodeImplementations: NODE_IMPLEMENTATIONS,
            },
            [{}, {}, {}],
            [{ '0': [['bang']] }, { '0': [] }, { '0': [] }]
        )
    })
})
