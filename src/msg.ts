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

import { Code, NodeCodeGenerator, NodeImplementation } from '@webpd/compiler-js/src/types'
import { DspGraph } from '@webpd/dsp-graph'
import { buildMessageTransferOperations } from '@webpd/compiler-js'
import { NodeBuilder } from '@webpd/pd-json'

interface NodeArguments { template: Array<string | number> }

// TODO : no need to declare 'inMessage', 'stringToken', 'otherStringToken', 'stringMem' ... if they are not used

// ------------------------------- node builder ------------------------------ //
const builder: NodeBuilder<NodeArguments> = {
    translateArgs: (pdNode) => ({
        template: pdNode.args,
    }),
    build: () => ({
        inlets: {
            '0': { type: 'message', id: '0' },
        },
        outlets: {
            '0': { type: 'message', id: '0' },
        },
    }),
}

// ------------------------------ declare ------------------------------ //
const declare: NodeCodeGenerator<NodeArguments> = (node, variableNames, _) => {
    const {macros, state} = variableNames
    const {inMessageUsed, outMessageCode} = buildMsgTransferCode(node, variableNames, _)

    return `
        let ${macros.typedVar(state.outTemplate, 'MessageTemplate')} = []
        let ${macros.typedVar(state.outMessage, 'Message')} = msg_create([])
        ${!inMessageUsed ? outMessageCode : ''}
    `
}

// ------------------------------- loop ------------------------------ //
const messages: NodeImplementation<NodeArguments>['messages'] = (node, variableNames, _) => {
    const {snds, macros, state} = variableNames
    const {inMessageUsed, outMessageCode} = buildMsgTransferCode(node, variableNames, _)

    return {'0': `
        ${inMessageUsed ? `
            let ${macros.typedVar('stringToken', 'string')}
            let ${macros.typedVar('otherStringToken', 'string')}
            const ${macros.typedVar('stringMem', 'Array<string>')} = []
            ${outMessageCode}
        `: ``}
        ${snds.$0}(${state.outMessage})
    `}
}

// ------------------------------------------------------------------- //
const stateVariables: NodeImplementation<NodeArguments>['stateVariables'] = () => [
    'outTemplate',
    'outMessage',
]

const buildMsgTransferCode = (...[node, {state, globs}]: Parameters<NodeCodeGenerator<NodeArguments>>) => {
    const template = node.args.template as Array<DspGraph.NodeArgument>
    let outTemplateCode: Code = ''
    let outMessageCode: Code = ''
    let stringMemCount = 0
    let inMessageUsed = false

    buildMessageTransferOperations(template).forEach((operation, outIndex) => {
        if (operation.type === 'noop') {
            inMessageUsed = true
            const { inIndex } = operation
            outTemplateCode += `
                ${state.outTemplate}.push(msg_getTokenType(${globs.m}, ${inIndex}))
                if (msg_isStringToken(${globs.m}, ${inIndex})) {
                    stringMem[${stringMemCount}] = msg_readStringToken(${globs.m}, ${inIndex})
                    ${state.outTemplate}.push(stringMem[${stringMemCount}].length)
                }
            `
            outMessageCode += `
                if (msg_isFloatToken(${globs.m}, ${inIndex})) {
                    msg_writeFloatToken(${state.outMessage}, ${outIndex}, msg_readFloatToken(${globs.m}, ${inIndex}))
                } else if (msg_isStringToken(${globs.m}, ${inIndex})) {
                    msg_writeStringToken(${state.outMessage}, ${outIndex}, stringMem[${stringMemCount}])
                }
            `
            stringMemCount++
        } else if (operation.type === 'string-template') {
            inMessageUsed = true
            outTemplateCode += `
                stringToken = "${operation.template}"
                ${operation.variables.map(({placeholder, inIndex}) => `
                    if (msg_isFloatToken(${globs.m}, ${inIndex})) {
                        otherStringToken = msg_readFloatToken(${globs.m}, ${inIndex}).toString()
                        if (otherStringToken.endsWith('.0')) {
                            otherStringToken = otherStringToken.slice(0, -2)
                        }
                        stringToken = stringToken.replace("${placeholder}", otherStringToken)
                    } else if (msg_isStringToken(${globs.m}, ${inIndex})) {
                        stringToken = stringToken.replace("${placeholder}", msg_readStringToken(${globs.m}, ${inIndex}))
                    }`
                )}
                stringMem[${stringMemCount}] = stringToken
                ${state.outTemplate}.push(MSG_STRING_TOKEN)
                ${state.outTemplate}.push(stringMem[${stringMemCount}].length)
            `
            outMessageCode += `
                msg_writeStringToken(${state.outMessage}, ${outIndex}, stringMem[${stringMemCount}])
            `
            stringMemCount++
        } else if (operation.type === 'string-constant') {
            outTemplateCode += `
                ${state.outTemplate}.push(MSG_STRING_TOKEN)
                ${state.outTemplate}.push(${operation.value.length})
            `
            outMessageCode += `
                msg_writeStringToken(${state.outMessage}, ${outIndex}, "${operation.value}")
            `
        } else if (operation.type === 'float-constant') {
            outTemplateCode += `
                ${state.outTemplate}.push(MSG_FLOAT_TOKEN)
            `
            outMessageCode += `
                msg_writeFloatToken(${state.outMessage}, ${outIndex}, ${operation.value})
            `
        }
    })

    return {
        inMessageUsed,
        outMessageCode: `
            ${state.outTemplate} = []
            ${outTemplateCode}           
            ${state.outMessage} = msg_create(${state.outTemplate})
            ${outMessageCode}
        `
    }
}

const nodeImplementation: NodeImplementation<NodeArguments> = {declare, messages, stateVariables}

export { 
    builder,
    nodeImplementation,
    NodeArguments,
}