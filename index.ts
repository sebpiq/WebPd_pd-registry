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

import * as oscTilde from './src/osc~'
import * as dacTilde from './src/dac~'
import * as adcTilde from './src/adc~'
import * as tabplayTilde from './src/tabplay~'
import * as readsfTilde from './src/readsf~'
import * as writesfTilde from './src/writesf~'
import * as metro from './src/metro'
import * as delay from './src/delay'
import * as loadbang from './src/loadbang'
import * as binopTilde from './src/binop~'
import * as mixerTilde from './src/mixer~'
import * as noiseTilde from './src/noise~'
import * as msg from './src/msg'
import * as soundfiler from './src/soundfiler'

const NODE_IMPLEMENTATIONS = {
    ...binopTilde.nodeImplementations,
    'osc~': oscTilde.nodeImplementation,
    'noise~': noiseTilde.nodeImplementation,
    'mixer~': mixerTilde.nodeImplementation,
    'dac~': dacTilde.nodeImplementation,
    'adc~': adcTilde.nodeImplementation,
    'tabplay~': tabplayTilde.nodeImplementation,
    'readsf~': readsfTilde.nodeImplementation,
    'writesf~': writesfTilde.nodeImplementation,
    loadbang: loadbang.nodeImplementation,
    msg: msg.nodeImplementation,
    metro: metro.nodeImplementation,
    delay: delay.nodeImplementation,
    soundfiler: soundfiler.nodeImplementation,
}

const NODE_BUILDERS = {
    '+~': binopTilde.builder,
    '*~': binopTilde.builder,
    'osc~': oscTilde.builder,
    'noise~': noiseTilde.builder,
    'mixer~': mixerTilde.builder,
    'dac~': dacTilde.builder,
    'adc~': adcTilde.builder,
    'tabplay~': tabplayTilde.builder,
    'readsf~': readsfTilde.builder,
    'writesf~': writesfTilde.builder,
    loadbang: loadbang.builder,
    msg: msg.builder,
    metro: metro.builder,
    delay: delay.builder,
    soundfiler: soundfiler.builder,
}

export { NODE_IMPLEMENTATIONS, NODE_BUILDERS }