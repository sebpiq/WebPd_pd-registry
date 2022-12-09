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


import assert from "assert"
import NODE_BUILDERS from "./node-builders"
import { pdJsonNodeDefaults, pdJsonPatchDefaults } from '@webpd/pd-json/src/test-helpers'
import { PdJson } from "@webpd/pd-json"

describe('node-builders', () => {

    const PATCH = pdJsonPatchDefaults('0')

    describe('mixer~', () => {
        it('build should create inlets for channelCount', () => {
            const partialNode = NODE_BUILDERS['mixer~'].build({ channelCount: 3 })
            assert.deepStrictEqual(partialNode.inlets, {
                '0': { type: 'signal', id: '0' },
                '1': { type: 'signal', id: '1' },
                '2': { type: 'signal', id: '2' },
            })
        })
    })

    describe('dac~', () => {

        it('translateArgs should convert channel indices to 0-indexed', () => {
            const pdNode = {
                ...pdJsonNodeDefaults('0'),
                args: [ 1, 2 ]
            }
            const args = NODE_BUILDERS['dac~'].translateArgs(pdNode, PATCH)
            assert.deepStrictEqual(args, {
                channelMapping: [0, 1]
            })
        })

        it('translateArgs should infer default channelMapping from incoming connections', () => {
            const patch: PdJson.Patch = {
                ...PATCH,
                connections: [
                    {source: {nodeId: 'someNode', portletId: 0}, sink: { nodeId: 'dac', portletId: 0 }},
                    {source: {nodeId: 'someNode', portletId: 0}, sink: { nodeId: 'dac', portletId: 2 }},
                ]
            }
            const pdNode = {
                ...pdJsonNodeDefaults('0'),
                id: 'dac',
                args: [] as Array<number>
            }
            const args = NODE_BUILDERS['dac~'].translateArgs(pdNode, patch)
            assert.deepStrictEqual(args, {
                channelMapping: [0, 1, 2]
            })
        })

        it('build should create inlets for channelMapping', () => {
            const partialNode = NODE_BUILDERS['dac~'].build({ channelMapping: [0, 2, 10] })
            assert.deepStrictEqual(partialNode.inlets, {
                '0': { type: 'signal', id: '0' },
                '1': { type: 'signal', id: '1' },
                '2': { type: 'signal', id: '2' },
            })
        })
    })

})