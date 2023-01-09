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

import { NodeCodeGenerator, NodeImplementation } from '@webpd/compiler-js/src/types'
import { NodeBuilder } from '@webpd/pd-json'

interface NodeArguments {}

// TODO : left inlet ?
// ------------------------------- node builder ------------------------------ //
const builder: NodeBuilder<NodeArguments> = {
    translateArgs: () => ({}),
    build: () => {
        return {
            inlets: {},
            outlets: {
                '0': { type: 'signal', id: '0' },
            },
        }
    },
}

// ------------------------------- loop ------------------------------ //
const loop: NodeCodeGenerator<NodeArguments> = (_, { outs, types }) => `
    ${outs.$0} = ${types.Float}(Math.random() * 2 - 1)
`

// ------------------------------------------------------------------- //
const nodeImplementation: NodeImplementation<NodeArguments> = {loop}

export { 
    builder,
    nodeImplementation,
    NodeArguments,
}