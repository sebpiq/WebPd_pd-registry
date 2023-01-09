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
import NODE_ARGUMENTS_TYPES from '../node-arguments-types'

type ReadsfTildeCodeGenerator = NodeCodeGenerator<NODE_ARGUMENTS_TYPES['_NO_ARGS']>
type ReadsfTildeNodeImplementation = NodeImplementation<NODE_ARGUMENTS_TYPES['_NO_ARGS']>

// TODO: lots of things left to implement
// TODO : multi-channe;
// TODO : check the real state machine of readsf
//      - what happens when start / stopping / start stream ? 
//      - what happens when stream ended and starting again ? 
//      - etc ...

// ------------------------------ declare ------------------------------ //
export const declare: ReadsfTildeCodeGenerator = (_, {macros, state}) => `
    let ${macros.typedVar(state.buffer, '_fs_SoundBuffer')}
    let ${macros.typedVar(state.operationId, 'fs_OperationId')} = -1
    let ${macros.typedVar(state.isReading, 'Int')} = 0
    let ${macros.typedVar(state.readingStage, 'Int')} = 1
`

// ------------------------------- loop ------------------------------ //
export const loop: ReadsfTildeCodeGenerator = (_, { state, ins, outs }) => `
    while (${ins.$0}.length) {
        ${state.funcHandleMessage0}(${ins.$0}.shift())
    }

    if (${state.isReading} === 1) {
        ${outs.$0} = ${state.buffer}.pullFrame()[0]
    } else if (${state.isReading} === 2) {
        ${outs.$0} = ${state.buffer}.pullFrame()[0]
        if (${state.buffer}.availableFrameCount() === 0) {
            console.log('[readsf~] BANG')
            ${outs.$1}.push(msg_bang())
            ${state.isReading} = 0
        }
    }
`

// ------------------------------- messages ------------------------------ //
export const messages: ReadsfTildeNodeImplementation['messages'] = (_, {state, globs}) => ({
    '0': `
    if (msg_getLength(${globs.m}) >= 2) {
        if (msg_isStringToken(${globs.m}, 0) 
            && msg_isStringToken(${globs.m}, 1) 
            && msg_readStringToken(${globs.m}, 0) === 'open'
        ) {
            if (${state.operationId} !== -1) {
                fs_closeSoundStream(${state.operationId}, FS_OPERATION_SUCCESS)
            }

            ${state.operationId} = fs_openSoundReadStream(
                msg_readStringToken(${globs.m}, 1),
                fs_soundInfo(2),
                () => {
                    console.log('[readsf~] stream ended')
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

    } else if (
        msg_getLength(${globs.m}) === 1
        && msg_isFloatToken(${globs.m}, 0)
    ) {
        if (msg_readFloatToken(${globs.m}, 0) === 0) {
            console.log('[readsf~] reading = false')
            ${state.isReading} = 0
        } else {
            console.log('[readsf~] reading = true')
            ${state.isReading} = ${state.readingStage}
        }
        return

    }
    
    throw new Error("Unexpected message")
    `
})

// ------------------------------------------------------------------- //
export const stateVariables: ReadsfTildeNodeImplementation['stateVariables'] = () => [
    'buffer', 'isReading', 'readingStage', 'operationId']