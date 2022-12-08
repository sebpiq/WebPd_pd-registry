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

import { NodeCodeGenerator } from '@webpd/compiler-js'
import NODE_ARGUMENTS_TYPES from '../node-arguments-types'

type DacTildeCodeGenerator = NodeCodeGenerator<NODE_ARGUMENTS_TYPES['dac~']>

// ------------------------------- loop ------------------------------ //
export const loop: DacTildeCodeGenerator = (
    node,
    { ins, macros },
    { audioSettings }
) => {
    let loopStr = ''
    const defaultChannelMapping: Array<number> = []
    for (let channel = 0; channel < audioSettings.channelCount; channel++) {
        defaultChannelMapping.push(channel)
    }
    // Map inputs to corresponding channel
    const channelMapping: Array<number> =
        node.args.channels || defaultChannelMapping
    for (let i = 0; i < channelMapping.length; i++) {
        const destination = channelMapping[i]
        // Ignore channels that are out of bounds
        if (destination < 0 || audioSettings.channelCount <= destination) {
            continue
        }
        loopStr += `\n${macros.fillInLoopOutput(destination, ins[`${i}`])}`
    }
    return loopStr
}