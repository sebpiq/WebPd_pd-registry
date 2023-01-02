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

import { buildMessageTransferOperations } from '@webpd/compiler-js/src/compile-helpers'
import { Code, NodeCodeGenerator } from '@webpd/compiler-js/src/types'
import { DspGraph } from '@webpd/dsp-graph'
import NODE_ARGUMENTS_TYPES from '../node-arguments-types'

type MsgCodeGenerator = NodeCodeGenerator<NODE_ARGUMENTS_TYPES['msg']>

// ------------------------------- loop ------------------------------ //
export const loop: MsgCodeGenerator = (node, {ins, outs, macros}) => {
    const template = node.args.template as Array<DspGraph.NodeArgument>

    // const messageTransfer = (
    //     _: Compilation,
    //     template: Array<DspGraph.NodeArgument>,
    //     inVariableName: CodeVariableName,
    //     outVariableName: CodeVariableName
    // ) => {
    let outTemplateCode: Code = ''
    let outMessageCode: Code = ''
    let stringMemCount = 0

    buildMessageTransferOperations(template).forEach((operation, outIndex) => {
        if (operation.type === 'noop') {
            const { inIndex } = operation
            outTemplateCode += `
                outTemplate.push(msg_getTokenType(inMessage, ${inIndex}))
                if (msg_isStringToken(inMessage, ${inIndex})) {
                    stringMem[${stringMemCount}] = msg_readStringToken(inMessage, ${inIndex})
                    outTemplate.push(stringMem[${stringMemCount}].length)
                }
            `
            outMessageCode += `
                if (msg_isFloatToken(inMessage, ${inIndex})) {
                    msg_writeFloatToken(outMessage, ${outIndex}, msg_readFloatToken(inMessage, ${inIndex}))
                } else if (msg_isStringToken(inMessage, ${inIndex})) {
                    msg_writeStringToken(outMessage, ${outIndex}, stringMem[${stringMemCount}])
                }
            `
            stringMemCount++
        } else if (operation.type === 'string-template') {
            outTemplateCode += `
                stringToken = "${operation.template}"
                ${operation.variables.map(({placeholder, inIndex}) => `
                    if (msg_isFloatToken(inMessage, ${inIndex})) {
                        otherStringToken = msg_readFloatToken(inMessage, ${inIndex}).toString()
                        if (otherStringToken.endsWith('.0')) {
                            otherStringToken = otherStringToken.slice(0, -2)
                        }
                        stringToken = stringToken.replace("${placeholder}", otherStringToken)
                    } else if (msg_isStringToken(inMessage, ${inIndex})) {
                        stringToken = stringToken.replace("${placeholder}", msg_readStringToken(inMessage, ${inIndex}))
                    }`
                )}
                stringMem[${stringMemCount}] = stringToken
                outTemplate.push(MSG_TOKEN_TYPE_STRING)
                outTemplate.push(stringToken.length)
            `
            outMessageCode += `
                msg_writeStringToken(outMessage, ${outIndex}, stringMem[${stringMemCount}])
            `
            stringMemCount++
        } else if (operation.type === 'string-constant') {
            outTemplateCode += `
                outTemplate.push(MSG_TOKEN_TYPE_STRING)
                outTemplate.push(${operation.value.length})
            `
            outMessageCode += `
                msg_writeStringToken(outMessage, ${outIndex}, "${operation.value}")
            `
        } else if (operation.type === 'float-constant') {
            outTemplateCode += `
                outTemplate.push(MSG_TOKEN_TYPE_FLOAT)
            `
            outMessageCode += `
                msg_writeFloatToken(outMessage, ${outIndex}, ${operation.value})
            `
        }
    })

    return `
        while (${ins.$0}.length) {
            const ${macros.typedVar('inMessage', 'Message')} = ${ins.$0}.shift()
            let ${macros.typedVar('stringToken', 'string')}
            let ${macros.typedVar('otherStringToken', 'string')}
            const ${macros.typedVar('stringMem', 'Array<string>')} = []

            const ${macros.typedVar('outTemplate', 'MessageTemplate')} = []
            ${outTemplateCode}
            
            const ${macros.typedVar('outMessage', 'Message')} = msg_create(outTemplate)
            ${outMessageCode}

            ${outs.$0}.push(outMessage)
        }
    `
}