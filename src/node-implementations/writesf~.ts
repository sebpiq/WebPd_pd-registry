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

const BLOCK_SIZE = 44100 * 5

type ReadsfTildeCodeGenerator = NodeCodeGenerator<NODE_ARGUMENTS_TYPES['_NO_ARGS']>
type ReadsfTildeNodeImplementation = NodeImplementation<NODE_ARGUMENTS_TYPES['_NO_ARGS']>

// TODO: lots of things left to implement
// TODO : multi-channel
// TODO : check the real state machine of writesf
//      - what happens when start / stopping / start stream ? 
//      - what happens when stream ended and starting again ? 
//      - etc ...

// ------------------------------ declare ------------------------------ //
export const declare: ReadsfTildeCodeGenerator = (_, {macros, state}) => `
    let ${macros.typedVar(state.operationId, 'fs_OperationId')} = -1
    let ${macros.typedVar(state.isWriting, 'boolean')} = false
    const ${macros.typedVar(state.block, 'FloarArray[]')} = [
        tarray_create(${BLOCK_SIZE}),
        tarray_create(${BLOCK_SIZE}),
    ]
    let cursor = ${macros.typedVar(state.cursor, 'Int')} = 0

    const ${state.flushBlock} = () => {
        fs_sendSoundStreamData(${state.operationId}, ${state.block})
        ${state.cursor} = 0
    }
`

// ------------------------------- loop ------------------------------ //
export const loop: ReadsfTildeCodeGenerator = (_, { state, ins }) => `
    while (${ins.$0_message}.length) {
        ${state.funcHandleMessage0}(${ins.$0_message}.shift())
    }

    if (${state.isWriting} === true) {
        ${state.block}[0][${state.cursor}] = ${ins.$0_signal}
        ${state.block}[1][${state.cursor}] = ${ins.$1}
        ${state.cursor}++
        if (${state.cursor} === ${BLOCK_SIZE}) {
            console.log('[writesf~] send data')
            ${state.flushBlock}()
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
            console.log('[writesf~] stream open')
            if (${state.operationId} !== -1) {
                fs_closeSoundStream(${state.operationId}, FS_OPERATION_SUCCESS)
            }

            ${state.operationId} = fs_openSoundWriteStream(
                msg_readStringToken(${globs.m}, 1),
                fs_soundInfo(2),
                () => {
                    console.log('[writesf~] stream ended')
                    ${state.flushBlock}()
                    ${state.operationId} = -1
                }
            )
            return
        }

    } else if (
        msg_getLength(${globs.m}) === 1
        && msg_isStringToken(${globs.m}, 0)
    ) {
        if (msg_readStringToken(${globs.m}, 0) === 'start') {
            console.log('[writesf~] writing = true')
            ${state.isWriting} = true
            return
        } else if (msg_readStringToken(${globs.m}, 0) === 'stop') {
            console.log('[writesf~] writing = false')
            ${state.flushBlock}()
            ${state.isWriting} = false
            return
        }
    }
    
    throw new Error("Unexpected message")
    `
})

// ------------------------------------------------------------------- //
export const stateVariables: ReadsfTildeNodeImplementation['stateVariables'] = () => [
    'isWriting', 'operationId', 'block', 'cursor', 'flushBlock']