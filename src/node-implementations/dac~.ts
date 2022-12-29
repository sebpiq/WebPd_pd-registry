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

import { NodeCodeGenerator } from '@webpd/compiler-js/src/types'
import NODE_ARGUMENTS_TYPES from '../node-arguments-types'

type DacTildeCodeGenerator = NodeCodeGenerator<NODE_ARGUMENTS_TYPES['dac~']>

// ------------------------------- loop ------------------------------ //
// TODO : set message not supported
export const loop: DacTildeCodeGenerator = (
    node,
    { ins, globs },
    { audioSettings, target }
) => {
    let loopStr = ''
    const defaultChannelMapping: Array<number> = []
    for (let channel = 0; channel < audioSettings.channelCount.out; channel++) {
        defaultChannelMapping.push(channel)
    }
    // Map node inlet to corresponding destination channel
    const channelMapping: Array<number> =
        node.args.channelMapping || defaultChannelMapping
    for (let i = 0; i < channelMapping.length; i++) {
        const destination = channelMapping[i]
        // Ignore channels that are out of bounds
        if (destination < 0 || audioSettings.channelCount.out <= destination) {
            continue
        }
        if (target === 'javascript') {
            loopStr += `\n${globs.output}[${destination}][${globs.iterFrame}] = ${ins[`${i}`]}`
        } else {
            loopStr += `\n${globs.output}[${globs.iterFrame} + ${globs.blockSize} * ${destination}] = ${ins[`${i}`]}`
        }
    }
    return loopStr + '\n'
}
