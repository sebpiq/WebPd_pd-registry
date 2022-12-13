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

type AdcTildeCodeGenerator = NodeCodeGenerator<NODE_ARGUMENTS_TYPES['adc~']>

// ------------------------------- loop ------------------------------ //
// TODO : set message not supported
export const loop: AdcTildeCodeGenerator = (
    node,
    { outs, macros },
    { audioSettings }
) => {
    let loopStr = ''
    const defaultChannelMapping: Array<number> = []
    for (let channel = 0; channel < audioSettings.channelCount.in; channel++) {
        defaultChannelMapping.push(channel)
    }
    // Map source channel to corresponding node outlet
    const channelMapping: Array<number> =
        node.args.channelMapping || defaultChannelMapping
    for (let i = 0; i < channelMapping.length; i++) {
        const source = channelMapping[i]
        // Ignore channels that are out of bounds
        if (source < 0 || audioSettings.channelCount.in <= source) {
            continue
        }
        loopStr += `\n${macros.fillInLoopInput(source, outs[`${i}`])}`
    }
    return loopStr
}
