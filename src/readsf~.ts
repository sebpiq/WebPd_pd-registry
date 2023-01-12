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
    NodeCodeGenerator,
    NodeImplementation,
} from '@webpd/compiler-js/src/types'
import { DspGraph } from '@webpd/dsp-graph'
import { NodeBuilder, validation } from '@webpd/pd-json'
import { GLOBS_parseReadWriteFsOpts, GLOB_parseSoundFileOpenOpts } from './global'
import { nLines } from './utils'

interface NodeArguments { channelCount: number }

// TODO : check the real state machine of readsf
//      - what happens when start / stopping / start stream ? 
//      - what happens when stream ended and starting again ? 
//      - etc ...
// TODO : second arg : "buffer channel size" not implemented
// TODO : implement raw

// ------------------------------- node builder ------------------------------ //
const builder: NodeBuilder<NodeArguments> = {
    translateArgs: (pdNode) => ({
        channelCount: validation.assertOptionalNumber(pdNode.args[0]) || 1
    }),
    build: (nodeArgs) => {
        const outlets: DspGraph.PortletMap = {}
        for (let i = 0; i < nodeArgs.channelCount; i++) {
            outlets[`${i}`] = { type: 'signal', id: `${i}` }
        }
        outlets[`${nodeArgs.channelCount}`] = { type: 'message', id: `${nodeArgs.channelCount}` }
        return {
            inlets: {
                '0': { type: 'message', id: '0' },
            },
            outlets,
        }
    },
}

// ------------------------------ declare ------------------------------ //
const declare: NodeCodeGenerator<NodeArguments> = (_, {macros, globs, state}) => `
    let ${macros.typedVar(state.buffer, '_fs_SoundBuffer')} = new _fs_SoundBuffer(0)
    let ${macros.typedVar(state.operationId, 'fs_OperationId')} = -1
    let ${macros.typedVar(state.isReading, 'Int')} = 0
    let ${macros.typedVar(state.readingStage, 'Int')} = 1
    const ${state.GLOB_parseSoundFileOpenOpts} = ${GLOB_parseSoundFileOpenOpts(macros)}
    const ${state.GLOBS_parseReadWriteFsOpts} = ${GLOBS_parseReadWriteFsOpts(state, globs, macros)}
`

// ------------------------------- loop ------------------------------ //
const loop: NodeCodeGenerator<NodeArguments> = ({args: {channelCount}}, { state, snds, outs, macros }) => `
    if (${state.isReading} === 1) {
        const ${macros.typedVar('frame', 'FloatArray')} = ${state.buffer}.pullFrame()
        ${nLines(channelCount, (i) => 
            `${outs[i]} = frame[${i}]`)}
        
    } else if (${state.isReading} === 2) {
        const ${macros.typedVar('frame', 'FloatArray')} = ${state.buffer}.pullFrame()
        ${nLines(channelCount, (i) => 
            `${outs[i]} = frame[${i}]`)}
        if (${state.buffer}.availableFrameCount() === 0) {
            ${snds[channelCount]}(msg_bang())
            ${state.isReading} = 0
        }
    }
`

// ------------------------------- messages ------------------------------ //
const messages: NodeImplementation<NodeArguments>['messages'] = (node, {state, globs, macros}) => ({
    '0': `
    if (msg_getLength(${globs.m}) >= 2) {
        if (msg_isStringToken(${globs.m}, 0) 
            && msg_readStringToken(${globs.m}, 0) === 'open'
        ) {
            if (${state.operationId} !== -1) {
                fs_closeSoundStream(${state.operationId}, FS_OPERATION_SUCCESS)
            }

            const ${macros.typedVar('soundInfo', '_fs_SoundInfo')} = {
                channelCount: ${node.args.channelCount},
                sampleRate: ${globs.sampleRate},
                bitDepth: 32,
                encodingFormat: '',
                endianness: '',
                extraOptions: '',
            }
            const ${macros.typedVar('unhandledOptions', 'Set<Int>')} = ${state.GLOB_parseSoundFileOpenOpts}(
                ${globs.m},
                soundInfo,
            )
            const ${macros.typedVar('url', 'string')} = ${state.GLOBS_parseReadWriteFsOpts}(
                ${globs.m},
                soundInfo,
                unhandledOptions
            )
            if (url.length === 0) {
                return
            }
            ${state.operationId} = fs_openSoundReadStream(
                url,
                soundInfo,
                () => {
                    ${state.operationId} = -1
                    ${state.readingStage} = 2
                    if (${state.isReading} > 0) {
                        ${state.isReading} = ${state.readingStage}
                    }
                }
            )
            ${state.buffer} = _FS_SOUND_STREAM_BUFFERS.get(${state.operationId})
            return
        }

    } else if (msg_isMatching(${globs.m}, [MSG_FLOAT_TOKEN])) {
        if (msg_readFloatToken(${globs.m}, 0) === 0) {
            ${state.isReading} = 0
            return

        } else {
            ${state.isReading} = ${state.readingStage}
            return

        }
    } else if (msg_isMatching(${globs.m}, [MSG_STRING_TOKEN])) {
        const ${macros.typedVar('action', 'string')} = msg_readStringToken(${globs.m}, 0)

        if (action === 'print') {
            console.log('[readsf~] reading = ' + ${state.isReading}.toString())
            return
        }
    }
    
    throw new Error("${node.type} <${node.id}> inlet <0> invalid message received.")
    `
})

// ------------------------------------------------------------------- //
const stateVariables: NodeImplementation<NodeArguments>['stateVariables'] = () => [
    'buffer', 'isReading', 'readingStage', 'operationId', 
    'GLOB_parseSoundFileOpenOpts', 'GLOBS_parseReadWriteFsOpts']

const nodeImplementation: NodeImplementation<NodeArguments> = {declare, messages, loop, stateVariables}

export { 
    builder,
    nodeImplementation,
    NodeArguments,
}
