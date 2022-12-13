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

import { makeGraph } from '@webpd/dsp-graph/src/test-helpers'
import NODE_IMPLEMENTATIONS from '.'
import assert from 'assert'
import * as nodeImplementationsTestHelpers from '@webpd/compiler-js/src/test-helpers-node-implementations'
import NODE_ARGUMENTS_TYPES from '../node-arguments-types'

type EngineOutput = Array<Float32Array>

describe('adc~', () => {
    const generateFrames = async (
        target: 'javascript' | 'assemblyscript',
        args: any
    ) => {
        const graph = makeGraph({
            adc: {
                type: 'adc~',
                args,
                outlets: {
                    '0': { id: '0', type: 'signal' },
                    '1': { id: '1', type: 'signal' },
                    '2': { id: '2', type: 'signal' },
                },
                sinks: {
                    '0': [['dac', '0']],
                    '1': [['dac', '1']],
                    '2': [['dac', '2']],
                },
            },
            dac: {
                type: 'dac~',
                args: { channelMapping: [0, 1, 2] },
                isEndSink: true,
                inlets: {
                    '0': { id: '0', type: 'signal' },
                    '1': { id: '1', type: 'signal' },
                    '2': { id: '2', type: 'signal' },
                },
            },
        })

        const channelCount = { out: 3, in: 8 }
        const blockSize = 1
        const compilation = nodeImplementationsTestHelpers.makeCompilation({
            target,
            graph,
            nodeImplementations: NODE_IMPLEMENTATIONS,
            audioSettings: {
                channelCount,
                bitDepth: 32,
            },
        })

        const code =
            nodeImplementationsTestHelpers.executeCompilation(compilation)
        const engine = await nodeImplementationsTestHelpers.getEngine(
            compilation.target,
            code
        )
        const engineInput = [
            new Float32Array([0.1]),
            new Float32Array([1.1]),
            new Float32Array([2.1]),
            new Float32Array([3.1]),
            new Float32Array([4.1]),
            new Float32Array([5.1]),
            new Float32Array([6.1]),
            new Float32Array([7.1]),
        ]
        const engineOutput = nodeImplementationsTestHelpers.buildEngineBlock(
            Float32Array,
            channelCount.out,
            blockSize
        )
        engine.configure(44100, blockSize)
        engine.loop(engineInput, engineOutput)
        return engineOutput
    }

    const assertEngineOutputs = async (
        args: NODE_ARGUMENTS_TYPES['adc~'],
        expected: EngineOutput
    ) => {
        assert.deepStrictEqual(
            await generateFrames('javascript', args),
            expected
        )
        assert.deepStrictEqual(
            await generateFrames('assemblyscript', args),
            expected
        )
    }

    it('should route the channels according to arguments', async () => {
        await assertEngineOutputs({ channelMapping: [6, 3, 0] }, [
            new Float32Array([6.1]),
            new Float32Array([3.1]),
            new Float32Array([0.1]),
        ])
    })

    it('should ignore channels that are out of bounds', async () => {
        await assertEngineOutputs({ channelMapping: [-2, 13, 2] }, [
            new Float32Array([0]),
            new Float32Array([0]),
            new Float32Array([2.1]),
        ])
    })
})
