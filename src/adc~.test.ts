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
import assert from 'assert'
import * as nodeImplementationsTestHelpers from '@webpd/compiler-js/src/test-helpers-node-implementations'
import { createEngine } from '@webpd/compiler-js/src/test-helpers'
import { CompilerTarget } from '@webpd/compiler-js/src/types'
import { testNodeBuild, testNodeTranslateArgs, TEST_NODE_ID, TEST_PATCH } from './test-helpers'
import {builder, nodeImplementation as nodeImplementationAdc} from './adc~'
import {nodeImplementation as nodeImplementationDac} from './dac~'

const nodeImplementations = {
    'adc~': nodeImplementationAdc,
    'dac~': nodeImplementationDac,
}

describe('adc~', () => {

    describe('builder', () => {
        describe('translateArgs', () => {
            it('should convert channel indices to 0-indexed', () => {
                testNodeTranslateArgs(builder, [1, 2], {
                    channelMapping: [0, 1],
                })
            })

            it('should infer default channelMapping from incoming connections', () => {
                testNodeTranslateArgs(
                    builder,
                    [],
                    {
                        channelMapping: [0, 1, 2, 3],
                    },
                    {
                        ...TEST_PATCH,
                        connections: [
                            {
                                source: { nodeId: TEST_NODE_ID, portletId: 0 },
                                sink: { nodeId: 'someNode', portletId: 0 },
                            },
                            {
                                source: { nodeId: TEST_NODE_ID, portletId: 3 },
                                sink: { nodeId: 'someNode', portletId: 1 },
                            },
                        ],
                    }
                )
            })
        })

        describe('build', () => {
            it('should create inlets for channelMapping', () => {
                testNodeBuild(
                    builder,
                    { channelMapping: [12, 1, 6, 7] },
                    {
                        outlets: {
                            '0': { type: 'signal', id: '0' },
                            '1': { type: 'signal', id: '1' },
                            '2': { type: 'signal', id: '2' },
                            '3': { type: 'signal', id: '3' },
                        },
                    }
                )
            })
        })
    })

    describe('implementation', () => {
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
                    isSignalSink: true,
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
    
        it.each<{ target: CompilerTarget }>([
            {target: 'javascript'},
            {target: 'assemblyscript'},
        ])('should route the channels according to arguments %s', async ({target}) => {
            assert.deepStrictEqual(
                await generateFrames(target, { channelMapping: [6, 3, 0] }),
                [
                    new Float32Array([6.1]),
                    new Float32Array([3.1]),
                    new Float32Array([0.1]),
                ]
            )
        })
    
        it.each<{ target: CompilerTarget }>([
            {target: 'javascript'},
            {target: 'assemblyscript'},
        ])('should ignore channels that are out of bounds %s', async ({target}) => {
            assert.deepStrictEqual(
                await generateFrames(target, { channelMapping: [-2, 13, 2] }),
                [
                    new Float32Array([0]),
                    new Float32Array([0]),
                    new Float32Array([2.1]),
                ]
            )
        })

    })
})
