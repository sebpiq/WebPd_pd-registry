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

interface NODE_ARGUMENTS_TYPES {
    'osc~': { frequency: number }
    'dac~': { channels: Array<number> }
    'mixer~': { channels: number }
    'tabplay~': { arrayName: string }
    msg: { template: Array<string | number> }
    metro: { rate: number }

    // Generic arguments types
    _BINOP_TILDE: { value?: number }
    _NO_ARGS: {}
}

export default NODE_ARGUMENTS_TYPES
