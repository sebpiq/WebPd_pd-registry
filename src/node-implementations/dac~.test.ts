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
import { CompilerTarget, NodeImplementations } from '@webpd/compiler-js/src/types'
import * as nodeImplementationsTestHelpers from '@webpd/compiler-js/src/test-helpers-node-implementations'
import { createEngine } from '@webpd/compiler-js/src/test-helpers'

type EngineOutputs = Array<Array<number>>

describe('dac~', () => {
    const generateFrames = async (
        target: 'javascript' | 'assemblyscript',
        args: any
    ) => {
        const nodeImplementations: NodeImplementations = {
            ...NODE_IMPLEMENTATIONS,
            counter: {
                loop: (_, { globs, outs }) => `
                    ${outs.$0} = f32(${globs.frame})
                    ${outs.$1} = f32(${globs.frame} * 10)
                    ${outs.$2} = f32(${globs.frame} * 100)
                    ${outs.$3} = f32(${globs.frame} * 1000)
                `,
            },
        }

        const graph = makeGraph({
            counter: {
                type: 'counter',
                outlets: {
                    '0': { type: 'signal', id: '0' },
                    '1': { type: 'signal', id: '1' },
                    '2': { type: 'signal', id: '2' },
                    '3': { type: 'signal', id: '3' },
                },
                sinks: {
                    '0': [['dac', '0']],
                    '1': [['dac', '1']],
                    '2': [['dac', '2']],
                    '3': [['dac', '3']],
                },
            },
            dac: {
                type: 'dac~',
                args,
                isEndSink: true,
                inlets: {
                    '0': { id: '0', type: 'signal' },
                    '1': { id: '1', type: 'signal' },
                    '2': { id: '2', type: 'signal' },
                    '3': { id: '3', type: 'signal' },
                },
            },
        })

        const channelCount = { out: 4, in: 0 }
        const blockSize = 1
        const iterations = 4
        const compilation = nodeImplementationsTestHelpers.makeCompilation({
            target,
            graph,
            nodeImplementations,
            audioSettings: {
                channelCount,
                bitDepth: 32,
            },
        })

        const code =
            nodeImplementationsTestHelpers.executeCompilation(compilation)
        const engine = await createEngine(
            compilation.target,
            code
        )
        const engineInput = nodeImplementationsTestHelpers.buildEngineBlock(
            Float32Array,
            channelCount.in,
            blockSize
        )
        const engineOutput = nodeImplementationsTestHelpers.buildEngineBlock(
            Float32Array,
            channelCount.out,
            blockSize
        )
        engine.configure(44100, blockSize)

        const results: EngineOutputs = []
        for (let i = 0; i < iterations; i++) {
            engine.loop(engineInput, engineOutput)
            // Block size 1, so we flatten the array and get just the first sample
            results.push(engineOutput.map((channelValues) => channelValues[0]))
        }
        return results
    }

    it.each<{ target: CompilerTarget }>([
        {target: 'javascript'},
        {target: 'assemblyscript'},
    ])('should route the channels according to arguments %s', async ({target}) => {
        assert.deepStrictEqual(
            await generateFrames(target, { channelMapping: [0, 3] }),
            [
                [0, 0, 0, 0],
                [1, 0, 0, 10],
                [2, 0, 0, 20],
                [3, 0, 0, 30],
            ]
        )
    })

    it.each<{ target: CompilerTarget }>([
        {target: 'javascript'},
        {target: 'assemblyscript'},
    ])('should ignore channels that are out of bounds %s', async ({target}) => {
        assert.deepStrictEqual(
            await generateFrames(target, { channelMapping: [-1, 2, 10] }),
            [
                [0, 0, 0, 0],
                [0, 0, 10, 0],
                [0, 0, 20, 0],
                [0, 0, 30, 0],
            ]
        )
    })
})
