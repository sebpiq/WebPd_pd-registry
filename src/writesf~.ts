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

const BLOCK_SIZE = 44100 * 5

interface NodeArguments { channelCount: number }

// TODO: lots of things left to implement
// TODO : check the real state machine of writesf
//      - what happens when start / stopping / start stream ? 
//      - what happens when stream ended and starting again ? 
//      - etc ...
// TODO : unittest GLOB_parseSoundFileOpenOpts and move outside of here

// ------------------------------- node builder ------------------------------ //
// TODO : test
const builder: NodeBuilder<NodeArguments> = {
    translateArgs: (pdNode) => ({
        channelCount: validation.assertOptionalNumber(pdNode.args[0]) || 1,
    }),
    build: ({ channelCount }) => {
        const inlets: DspGraph.PortletMap = {
            '0_message': { type: 'message', id: '0_message' }
        }
        for (let i = 0; i < channelCount; i++) {
            inlets[`${i}`] = { type: 'signal', id: `${i}` }
        }

        return {
            inlets,
            outlets: {},
            isSignalSink: true,
        }
    },
    rerouteConnectionIn: (outlet, inletId): DspGraph.PortletId => {
        if (inletId === '0') {
            return outlet.type === 'message' ? '0_message' : '0_signal'
        }
        return undefined
    },
}

// ------------------------------ declare ------------------------------ //
const declare: NodeCodeGenerator<NodeArguments> = ({args}, {macros, state, globs}) => `
    let ${macros.typedVar(state.operationId, 'fs_OperationId')} = -1
    let ${macros.typedVar(state.isWriting, 'boolean')} = false
    const ${macros.typedVar(state.block, 'Array<FloatArray>')} = [
        ${nLines(args.channelCount, () => 
            `tarray_create(${BLOCK_SIZE}),`)}
    ]
    let ${macros.typedVar(state.cursor, 'Int')} = 0

    const ${state.flushBlock} = ${macros.typedFuncHeader([
    ], 'void')} => {
        const ${macros.typedVar('block', 'Array<FloatArray>')} = []
        for (let ${macros.typedVar('i', 'Int')} = 0; i < ${state.block}.length; i++) {
            block.push(${state.block}[i].subarray(0, ${state.cursor}))
        }
        fs_sendSoundStreamData(${state.operationId}, block)
        ${state.cursor} = 0
    }

    const ${state.GLOB_parseSoundFileOpenOpts} = ${GLOB_parseSoundFileOpenOpts(macros)}
    const ${state.GLOBS_parseReadWriteFsOpts} = ${GLOBS_parseReadWriteFsOpts(state, globs, macros)}
`

// ------------------------------- loop ------------------------------ //
const loop: NodeCodeGenerator<NodeArguments> = ({ args }, { state, ins }) => `
    if (${state.isWriting} === true) {
        ${nLines(args.channelCount, (i) => 
            `${state.block}[${i}][${state.cursor}] = ${ins[i]}`)}
        ${state.cursor}++
        if (${state.cursor} === ${BLOCK_SIZE}) {
            ${state.flushBlock}()
        }
    }
`

// ------------------------------- messages ------------------------------ //
const messages: NodeImplementation<NodeArguments>['messages'] = (node, { state, globs, macros }) => ({
    '0_message': `
    if (msg_getLength(${globs.m}) >= 2) {
        if (
            msg_isStringToken(${globs.m}, 0) 
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
            ${state.operationId} = fs_openSoundWriteStream(
                url,
                soundInfo,
                () => {
                    ${state.flushBlock}()
                    ${state.operationId} = -1
                }
            )
            return
        }

    } else if (msg_isMatching(${globs.m}, [MSG_STRING_TOKEN])) {
        const ${macros.typedVar('action', 'string')} = msg_readStringToken(${globs.m}, 0)

        if (action === 'start') {
            ${state.isWriting} = true
            return

        } else if (action === 'stop') {
            ${state.flushBlock}()
            ${state.isWriting} = false
            return

        } else if (action === 'print') {
            console.log('[writesf~] writing = ' + ${state.isWriting}.toString())
            return
        }
    }
    
    throw new Error("${node.type} <${node.id}> inlet <0> invalid message received.")
    `
})

// ------------------------------------------------------------------- //
const stateVariables: NodeImplementation<NodeArguments>['stateVariables'] = () => [
    'isWriting', 'operationId', 'block', 'cursor', 'flushBlock', 
    'GLOB_parseSoundFileOpenOpts', 'GLOBS_parseReadWriteFsOpts']

const nodeImplementation: NodeImplementation<NodeArguments> = {declare, messages, loop, stateVariables}

export { 
    builder,
    nodeImplementation,
    NodeArguments,
}