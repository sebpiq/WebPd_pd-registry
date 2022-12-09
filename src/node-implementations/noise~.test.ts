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

import assert from 'assert'
import * as nodeImplementationsTestHelpers from '@webpd/compiler-js/src/test-helpers-node-implementations'
import NODE_IMPLEMENTATIONS from '.'
import NODE_BUILDERS from '../node-builders'
import { buildNode } from './test-helpers'

describe('noise~', () => {
    const testOutputFrames = (
        frames: Array<nodeImplementationsTestHelpers.Frame>
    ) => {
        const values = new Set(frames.map((frame) => frame['0']))
        values.forEach((value) => {
            assert.ok(-1 < value && value < 1)
        })
        // Test that all values are different
        assert.deepStrictEqual(values.size, 3)
    }

    it('should output white noise', async () => {
        const nodeTestSettings = {
            node: buildNode(NODE_BUILDERS['noise~'], 'noise~', {}),
            nodeImplementations: NODE_IMPLEMENTATIONS,
        }
        const inputFrames = [{}, {}, {}]
        testOutputFrames(
            await nodeImplementationsTestHelpers.generateFramesForNode(
                'javascript',
                nodeTestSettings,
                inputFrames
            )
        )
        testOutputFrames(
            await nodeImplementationsTestHelpers.generateFramesForNode(
                'assemblyscript',
                nodeTestSettings,
                inputFrames
            )
        )
    })
})
