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
import { NodeBuilder } from '@webpd/pd-json'
import { GLOB_parseSoundFileOpenOpts } from './global'

interface NodeArguments {}

// TODO: Implement -normalize for write operation
// TODO: Implement output headersize
// ------------------------------- node builder ------------------------------ //
const builder: NodeBuilder<NodeArguments> = {
    translateArgs: () => ({}),
    build: () => ({
        inlets: {
            '0': { type: 'message', id: '0' },
        },
        outlets: {
            '0': { type: 'message', id: '0' },
            '1': { type: 'message', id: '1' },
        },
    }),
}

// ------------------------------ declare ------------------------------ //
const declare: NodeCodeGenerator<NodeArguments> = (_, {macros, state}) => `
    const ${state.GLOB_parseSoundFileOpenOpts} = ${GLOB_parseSoundFileOpenOpts(macros)}
    class SfOperation {
        ${macros.typedVar('url', 'string')}
        ${macros.typedVar('arrayNames', 'Array<string>')}
        ${macros.typedVar('resize', 'boolean')}
        ${macros.typedVar('maxSize', 'Int')}
        ${macros.typedVar('framesToWrite', 'Int')}
        ${macros.typedVar('skip', 'Int')}
        ${macros.typedVar('soundInfo', '_fs_SoundInfo')}
    }
    const ${macros.typedVar(state.operations, 'Map<fs_OperationId, SfOperation>')} = new Map()

    const ${state.buildMessage1} = ${macros.typedFuncHeader([
        macros.typedVar('soundInfo', '_fs_SoundInfo')
    ], 'Message')} => {
        const ${macros.typedVar('m', 'Message')} = msg_create([
            MSG_FLOAT_TOKEN,
            MSG_FLOAT_TOKEN,
            MSG_FLOAT_TOKEN,
            MSG_FLOAT_TOKEN,
            MSG_STRING_TOKEN,
            soundInfo.endianness.length,
        ])
        msg_writeFloatToken(m, 0, soundInfo.sampleRate)
        msg_writeFloatToken(m, 1, -1) // TODO IMPLEMENT headersize
        msg_writeFloatToken(m, 2, soundInfo.channelCount)
        msg_writeFloatToken(m, 3, Math.round(soundInfo.bitDepth / 8))
        msg_writeStringToken(m, 4, soundInfo.endianness)
        return m
    }
`

// ------------------------------- messages ------------------------------ //
const messages: NodeImplementation<NodeArguments>['messages'] = (node, { state, macros, globs, snds, types }) => ({
    '0': `
    if (
        msg_getLength(${globs.m}) >= 3 
        && msg_isStringToken(${globs.m}, 0)
        && (
            msg_readStringToken(${globs.m}, 0) === 'read'
            || msg_readStringToken(${globs.m}, 0) === 'write'
        )
    ) {
        const ${macros.typedVar('operationType', 'string')} = msg_readStringToken(${globs.m}, 0)
        const ${macros.typedVar('soundInfo', '_fs_SoundInfo')} = {
            channelCount: 0,
            sampleRate: ${globs.sampleRate},
            bitDepth: 32,
            encodingFormat: '',
            endianness: '',
            extraOptions: '',
        }
        const ${macros.typedVar('operation', 'SfOperation')} = {
            arrayNames: [],
            resize: false,
            maxSize: -1,
            skip: 0,
            framesToWrite: 0,
            url: '',
            soundInfo,
        }
        let ${macros.typedVar('unhandledOptions', 'Set<Int>')} = ${state.GLOB_parseSoundFileOpenOpts}(
            ${globs.m},
            soundInfo,
        )
        
        // Remove the operation type
        unhandledOptions.delete(0)
        
        let ${macros.typedVar('i', 'Int')} = 1
        let ${macros.typedVar('str', 'string')} = ''
        while (i < msg_getLength(${globs.m})) {
            if (!unhandledOptions.has(i)) {

            } else if (msg_isStringToken(${globs.m}, i)) {
                str = msg_readStringToken(${globs.m}, i)
                if (str === '-resize') {
                    unhandledOptions.delete(i)
                    operation.resize = true

                } else if (str === '-maxsize' || str === '-nframes') {
                    unhandledOptions.delete(i)
                    if (
                        i + 1 >= msg_getLength(${globs.m}) 
                        || !msg_isFloatToken(${globs.m}, i + 1)
                    ) {
                        console.log("invalid value for -maxsize")
                    }
                    operation.maxSize = toInt(msg_readFloatToken(${globs.m}, i + 1))
                    unhandledOptions.delete(i + 1)
                    i++

                } else if (str === '-skip') {
                    unhandledOptions.delete(i)
                    if (
                        i + 1 >= msg_getLength(${globs.m}) 
                        || !msg_isFloatToken(${globs.m}, i + 1)
                    ) {
                        console.log("invalid value for -skip")
                    }
                    operation.skip = toInt(msg_readFloatToken(${globs.m}, i + 1))
                    unhandledOptions.delete(i + 1)
                    i++

                } else if (str === '-normalize') {
                    unhandledOptions.delete(i)
                    console.log('-normalize not implemented')
                }
            }
            i++
        }

        i = 1
        let ${macros.typedVar('urlFound', 'boolean')} = false
        while (i < msg_getLength(${globs.m})) {
            if (!unhandledOptions.has(i)) {

            } else if (msg_isStringToken(${globs.m}, i)) {
                str = msg_readStringToken(${globs.m}, i)
                if (!str.startsWith('-') && urlFound === false) {
                    operation.url = str
                    urlFound = true
                } else {
                    operation.arrayNames.push(str)
                }
                unhandledOptions.delete(i)
            }
            i++
        }

        for (i = 0; i < operation.arrayNames.length; i++) {
            if (!${globs.arrays}.has(operation.arrayNames[i])) {
                console.log('[soundfiler] unknown array ' + operation.arrayNames[i])
                return
            }
        }

        if (unhandledOptions.size) {
            console.log("soundfiler received invalid options")
        }

        soundInfo.channelCount = operation.arrayNames.length

        if (operationType === 'read') {
            const callback = ${macros.typedFuncHeader([
                macros.typedVar('id', 'fs_OperationId'),
                macros.typedVar('status', 'fs_OperationStatus'),
                macros.typedVar('sound', 'FloatArray[]'),
            ], 'void')} => {
                const ${macros.typedVar('operation', 'SfOperation')} = ${state.operations}.get(id)
                ${state.operations}.delete(id)
                let ${macros.typedVar('i', 'Int')} = 0
                let ${macros.typedVar('maxFramesRead', 'Float')} = 0
                let ${macros.typedVar('framesToRead', 'Int')} = 0
                let ${macros.typedVar('array', 'FloatArray')} = new ${types.FloatArray}(0)
                for (i = 0; i < sound.length; i++) {
                    if (operation.resize) {
                        if (operation.maxSize > 0) {
                            framesToRead = toInt(Math.min(
                                operation.maxSize, 
                                sound[i].length - operation.skip
                            ))

                        } else {
                            framesToRead = sound[i].length - operation.skip
                        }

                        ${globs.arrays}.set(
                            operation.arrayNames[i], 
                            sound[i].subarray(
                                operation.skip, 
                                operation.skip + framesToRead
                            )
                        )
                        
                    } else {
                        array = ${globs.arrays}.get(operation.arrayNames[i])
                        framesToRead = toInt(Math.min(
                            array.length,
                            sound[i].length - operation.skip
                        ))
                        array.set(sound[i].subarray(0, array.length))
                    }
                    maxFramesRead = Math.max(maxFramesRead, framesToRead)
                }

                ${snds.$1}(${state.buildMessage1}(operation.soundInfo))
                ${snds.$0}(msg_floats([maxFramesRead]))
            }

            const ${macros.typedVar('id', 'fs_OperationId')} = fs_readSoundFile(
                operation.url, 
                soundInfo,
                callback
            )

            ${state.operations}.set(id, operation)

        } else if (operationType === 'write') {
            let ${macros.typedVar('i', 'Int')} = 0
            let ${macros.typedVar('framesToWrite', 'Int')} = 0
            let ${macros.typedVar('array', 'FloatArray')} = new ${types.FloatArray}(0)
            const ${macros.typedVar('sound', 'FloatArray[]')} = []
            
            for (i = 0; i < operation.arrayNames.length; i++) {
                framesToWrite = toInt(Math.max(
                    framesToWrite,
                    ${globs.arrays}.get(operation.arrayNames[i]).length - operation.skip,
                ))
            }

            if (operation.maxSize >= 0) {
                framesToWrite = toInt(Math.min(operation.maxSize, framesToWrite))
            }
            operation.framesToWrite = framesToWrite

            if (framesToWrite < 1) {
                console.log('[soundfiler] no frames to write')
                return
            }

            for (i = 0; i < operation.arrayNames.length; i++) {
                array = ${globs.arrays}.get(operation.arrayNames[i])
                if (framesToWrite > array.length - operation.skip) {
                    sound.push(tarray_create(framesToWrite))
                    sound[i].set(array.subarray(
                        operation.skip, 
                        operation.skip + framesToWrite
                    ))
                } else {
                    sound.push(array.subarray(
                        operation.skip, 
                        operation.skip + framesToWrite
                    ))
                }
            }

            const callback = ${macros.typedFuncHeader([
                macros.typedVar('id', 'fs_OperationId'),
                macros.typedVar('status', 'fs_OperationStatus'),
            ], 'void')} => {
                const ${macros.typedVar('operation', 'SfOperation')} = ${state.operations}.get(id)
                ${state.operations}.delete(id)
                ${snds.$1}(${state.buildMessage1}(operation.soundInfo))
                ${snds.$0}(msg_floats([operation.framesToWrite]))
            }

            const ${macros.typedVar('id', 'fs_OperationId')} = fs_writeSoundFile(
                sound, 
                operation.url, 
                soundInfo, 
                callback
            )

            ${state.operations}.set(id, operation)
        }

        return
    }
    throw new Error("${node.type} <${node.id}> inlet <0> invalid message received.")
    `,
})

// ------------------------------------------------------------------- //
const stateVariables: NodeImplementation<NodeArguments>['stateVariables'] = () => [
    'GLOB_parseSoundFileOpenOpts', 'operations', 'buildMessage1']

const nodeImplementation: NodeImplementation<NodeArguments> = {declare, messages, stateVariables}

export { 
    builder,
    nodeImplementation,
    NodeArguments,
}