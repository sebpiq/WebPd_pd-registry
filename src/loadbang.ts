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

import {
    NodeCodeGenerator, NodeImplementation,
} from '@webpd/compiler-js/src/types'
import { NodeBuilder } from '@webpd/pd-json'

interface NodeArguments {}

// ------------------------------- node builder ------------------------------ //
const builder: NodeBuilder<NodeArguments> = {
    translateArgs: () => ({}),
    build: () => ({
        inlets: {},
        outlets: {
            '0': { type: 'message', id: '0' },
        },
        isMessageSource: true
    }),
}

// ------------------------------- initialize ------------------------------ //
const initialize: NodeCodeGenerator<NodeArguments> = (_, {snds}) => `
    ${snds.$0}(msg_bang())
`

// ------------------------------------------------------------------- //
const nodeImplementation: NodeImplementation<NodeArguments> = {initialize}

export { 
    builder,
    nodeImplementation,
    NodeArguments,
}