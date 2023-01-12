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

import { FS_OPERATION_SUCCESS } from '@webpd/compiler-js'
import * as nodeImplementationsTestHelpers from '@webpd/compiler-js/src/test-helpers-node-implementations'
import { CompilerTarget } from '@webpd/compiler-js/src/types'
import { nodeImplementation, builder } from './soundfiler'
import { buildNode } from './test-helpers'

describe('soundfiler', () => {

    describe('read files', () => {
        it.each<{ target: CompilerTarget }>([
            { target: 'javascript' },
            { target: 'assemblyscript' },
        ])(
            'should read soundfile into arrays, truncating the data to array size %s',
            async ({ target }) => {
                await nodeImplementationsTestHelpers.assertNodeOutput(
                    {
                        target,
                        node: buildNode(builder, 'soundfiler', {}),
                        nodeImplementation,
                        arrays: {
                            array1: [10, 10],
                            array2: [20, 20],
                            array3: [30, 30],
                        },
                    },
                    [
                        {
                            ins: {
                                '0': [
                                    [
                                        'read',
                                        '/some/url',
                                        'array1',
                                        'array2',
                                        'array3',
                                    ],
                                ],
                            },
                        },
                        {
                            outs: { '0': [], '1': [] },
                            fs: {
                                onReadSoundFile: [
                                    1,
                                    '/some/url',
                                    [3, 44100, 32, '', '', ''],
                                ],
                            } as any,
                        }
                    ],
                    [
                        {
                            fs: {
                                sendReadSoundFileResponse: [
                                    1,
                                    FS_OPERATION_SUCCESS,
                                    [
                                        new Float32Array([11, 12, 13]),
                                        new Float32Array([0, 0, 0]),
                                        new Float32Array([0, 0, 0]),
                                    ],
                                ],
                            } as any,
                            getArrays: ['array1', 'array2', 'array3'],
                        },
                        {
                            outs: { 
                                '0': [[2]], 
                                '1': [[44100, -1, 3, 4, '']]
                            },
                            arrays: {
                                array1: [11, 12],
                                array2: [0, 0],
                                array3: [0, 0],
                            },
                        },
                    ]
                )
            }
        )

        it.each<{ target: CompilerTarget }>([
            { target: 'javascript' },
            { target: 'assemblyscript' },
        ])(
            'should read soundfile resizing to array size if -resize %s',
            async ({ target }) => {
                await nodeImplementationsTestHelpers.assertNodeOutput(
                    {
                        target,
                        node: buildNode(builder, 'soundfiler', {}),
                        nodeImplementation,
                        arrays: {
                            array1: [10, 10],
                        },
                    },
                    [
                        {
                            ins: {
                                '0': [
                                    ['read', '-resize', '/some/url', 'array1'],
                                ],
                            },
                        },
                        {
                            outs: { '0': [], '1': [] },
                            fs: {
                                onReadSoundFile: [
                                    1,
                                    '/some/url',
                                    [1, 44100, 32, '', '', ''],
                                ],
                            },
                        },
                    ],
                    [
                        {
                            getArrays: ['array1'],
                            fs: {
                                sendReadSoundFileResponse: [
                                    1,
                                    FS_OPERATION_SUCCESS,
                                    [new Float32Array([11, 12, 13])],
                                ],
                            },
                        },
                        {
                            outs: { '0': [[3]], '1': [[44100, -1, 1, 4, ""]] },
                            arrays: {
                                array1: [11, 12, 13]
                            }
                        },
                    ]
                )
            }
        )

        it.each<{ target: CompilerTarget }>([
            { target: 'javascript' },
            { target: 'assemblyscript' },
        ])(
            'should read soundfile resizing to maxSize if -resize -maxsize <value> %s',
            async ({ target }) => {
                await nodeImplementationsTestHelpers.assertNodeOutput(
                    {
                        target,
                        node: buildNode(builder, 'soundfiler', {}),
                        nodeImplementation,
                        arrays: {
                            array1: [1, 2, 3, 4, 5, 6],
                        },
                    },
                    [
                        {
                            ins: {
                                '0': [
                                    ['read', '-resize', '-maxsize', 2, '-skip', 2, '/some/url', 'array1'],
                                ],
                            },
                        },
                        {
                            outs: { '0': [], '1': [] },
                            fs: {
                                onReadSoundFile: [
                                    1,
                                    '/some/url',
                                    [1, 44100, 32, '', '', ''],
                                ],
                            },
                        },
                    ],
                    [
                        {
                            getArrays: ['array1'],
                            fs: {
                                sendReadSoundFileResponse: [
                                    1,
                                    FS_OPERATION_SUCCESS,
                                    [new Float32Array([11, 12, 13, 14, 15, 16])],
                                ],
                            },
                        },
                        {
                            outs: { '0': [[2]], '1': [[44100, -1, 1, 4, ""]] },
                            arrays: {
                                array1: [13, 14]
                            }
                        },
                    ]
                )
            }
        )

        it.each<{ target: CompilerTarget }>([
            { target: 'javascript' },
            { target: 'assemblyscript' },
        ])(
            'should read soundfile resizing to maxSize if -resize -maxsize <value> %s',
            async ({ target }) => {
                await nodeImplementationsTestHelpers.assertNodeOutput(
                    {
                        target,
                        node: buildNode(builder, 'soundfiler', {}),
                        nodeImplementation,
                        arrays: {
                            array1: [10, 10],
                        },
                    },
                    [
                        {
                            ins: {
                                '0': [
                                    ['read', '-resize', '-maxsize', 3, '/some/url', 'array1'],
                                ],
                            },
                        },
                        {
                            outs: { '0': [], '1': [] },
                            fs: {
                                onReadSoundFile: [
                                    1,
                                    '/some/url',
                                    [1, 44100, 32, '', '', ''],
                                ],
                            },
                        },
                    ],
                    [
                        {
                            getArrays: ['array1'],
                            fs: {
                                sendReadSoundFileResponse: [
                                    1,
                                    FS_OPERATION_SUCCESS,
                                    [new Float32Array([11, 12, 13])],
                                ],
                            },
                        },
                        {
                            outs: { '0': [[3]], '1': [[44100, -1, 1, 4, ""]] },
                            arrays: {
                                array1: [11, 12, 13]
                            }
                        },
                    ]
                )
            }
        )
    })

    describe('write files', () => {

        it.each<{ target: CompilerTarget }>([
            { target: 'javascript' },
            { target: 'assemblyscript' },
        ])(
            'should write from arrays to soundfile taking the biggest array %s',
            async ({ target }) => {
                await nodeImplementationsTestHelpers.assertNodeOutput(
                    {
                        target,
                        node: buildNode(builder, 'soundfiler', {}),
                        nodeImplementation,
                        arrays: {
                            array1: [10, 10],
                            array2: [20, 20, 20],
                        },
                    },
                    [
                        {
                            ins: {
                                '0': [
                                    ['write', '/some/url', 'array1', 'array2'],
                                ],
                            },
                        },
                        {
                            outs: { '0': [], '1': [] },
                            fs: {
                                onWriteSoundFile: [
                                    1,
                                    [
                                        new Float64Array([10, 10, 0]),
                                        new Float64Array([20, 20, 20]),
                                    ],
                                    '/some/url',
                                    [2, 44100, 32, '', '', ''],
                                ],
                            },
                        },
                    ],
                    [
                        {
                            fs: {
                                'sendWriteSoundFileResponse': [1, FS_OPERATION_SUCCESS]
                            }
                        },
                        {outs: {
                            '0': [[3]],
                            '1': [[44100, -1, 2, 4, '']]
                        }}
                    ]
                )
            }
        )

        it.each<{ target: CompilerTarget }>([
            { target: 'javascript' },
            { target: 'assemblyscript' },
        ])(
            'should write from arrays to soundfile using skip and maxsize %s',
            async ({ target }) => {
                await nodeImplementationsTestHelpers.assertNodeOutput(
                    {
                        target,
                        node: buildNode(builder, 'soundfiler', {}),
                        nodeImplementation,
                        arrays: {
                            array1: [11, 12],
                            array2: [21, 22, 23, 24, 25],
                        },
                    },
                    [
                        {
                            ins: {
                                '0': [
                                    ['write', '-skip', 1, '-maxsize', 2, '/some/url', 'array1', 'array2'],
                                ],
                            },
                        },
                        {
                            outs: { '0': [], '1': [] },
                            fs: {
                                onWriteSoundFile: [
                                    1,
                                    [
                                        new Float64Array([12, 0]),
                                        new Float64Array([22, 23]),
                                    ],
                                    '/some/url',
                                    [2, 44100, 32, '', '', ''],
                                ],
                            },
                        },
                    ],
                )
            }
        )

    })

    describe('generic', () => {

        it.each<{ target: CompilerTarget }>([
            { target: 'javascript' },
            { target: 'assemblyscript' },
        ])('should parse right sound file infos %s', async ({ target }) => {
            await nodeImplementationsTestHelpers.assertNodeOutput(
                {
                    target,
                    node: buildNode(builder, 'soundfiler', {}),
                    nodeImplementation,
                    arrays: {
                        array1: [10, 10],
                    },
                },
                [
                    {
                        ins: {
                            '0': [
                                [
                                    'read',
                                    '-aiff',
                                    '-bytes', 3,
                                    '-rate', 22050,
                                    '-little',
                                    '/some/url',
                                    'array1',
                                ],
                            ],
                        },
                    },
                    {
                        outs: { '0': [], '1': [] },
                        fs: {
                            onReadSoundFile: [
                                1,
                                '/some/url',
                                [1, 22050, 24, 'aiff', 'l', ''],
                            ],
                        } as any,
                    },
                ]
            )
        })

        it.each<{ target: CompilerTarget }>([
            { target: 'javascript' },
            { target: 'assemblyscript' },
        ])('should just do nothing if unknown array %s', async ({ target }) => {
            await nodeImplementationsTestHelpers.assertNodeOutput(
                {
                    target,
                    node: buildNode(builder, 'soundfiler', {}),
                    nodeImplementation,
                    arrays: {
                        array1: [0, 1, 2],
                    },
                },
                [
                    {
                        ins: {
                            '0': [
                                ['read', '/some/url', 'array1', 'unknownArray'],
                            ],
                        },
                    },
                    {
                        outs: { '0': [], '1': [] },
                    },
                ]
            )
        })

    })
})
