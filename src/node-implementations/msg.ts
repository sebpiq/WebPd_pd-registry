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
import { MSG_DATUM_TYPE_FLOAT, MSG_DATUM_TYPE_STRING } from '@webpd/compiler-js/src/constants'
import { MSG_DATUM_TYPES_ASSEMBLYSCRIPT } from '@webpd/compiler-js/src/engine-assemblyscript/constants'
import { NodeCodeGenerator, NodeCodeSnippet } from '@webpd/compiler-js/src/types'
import { DspGraph } from '@webpd/dsp-graph'
import NODE_ARGUMENTS_TYPES from '../node-arguments-types'

type MsgCodeGenerator = NodeCodeGenerator<NODE_ARGUMENTS_TYPES['msg']>

const ASC_MSG_STRING_TOKEN = MSG_DATUM_TYPES_ASSEMBLYSCRIPT[MSG_DATUM_TYPE_STRING]
const ASC_MSG_FLOAT_TOKEN = MSG_DATUM_TYPES_ASSEMBLYSCRIPT[MSG_DATUM_TYPE_FLOAT]

// ------------------------------- loop ------------------------------ //
export const loop: MsgCodeGenerator = (node, variableNames, {snippet}) => {
    const template = node.args.template as Array<DspGraph.NodeArgument>

    // const messageTransfer = (
    //     _: Compilation,
    //     template: Array<DspGraph.NodeArgument>,
    //     inVariableName: CodeVariableName,
    //     outVariableName: CodeVariableName
    // ) => {
    const outMessageTemplateCode: Array<string> = []
    const outMessageSetCode: Array<string> = []
    let stringMemCount = 0

    buildMessageTransferOperations(template).forEach((operation, outIndex) => {
        if (operation.type === 'noop') {
            const { inIndex } = operation
            // prettier-ignore
            outMessageTemplateCode.push(`
                outTemplate.push(msg_getDatumType(inMessage, ${inIndex}))
                if (msg_isStringToken(inMessage, ${inIndex})) {
                    stringMem[${stringMemCount}] = msg_readStringDatum(inMessage, ${inIndex})
                    outTemplate.push(stringMem[${stringMemCount}].length)
                }
            `)
            // prettier-ignore
            outMessageSetCode.push(`
                if (msg_isFloatToken(inMessage, ${inIndex})) {
                    msg_writeFloatDatum(outMessage, ${outIndex}, msg_readFloatDatum(inMessage, ${inIndex}))
                } else if (msg_isStringToken(inMessage, ${inIndex})) {
                    msg_writeStringDatum(outMessage, ${outIndex}, stringMem[${stringMemCount}])
                }
            `)
            stringMemCount++
        } else if (operation.type === 'string-template') {
            // prettier-ignore
            outMessageTemplateCode.push(`
                stringDatum = "${operation.template}"
                ${operation.variables.map(({placeholder, inIndex}) => `
                    if (msg_isFloatToken(inMessage, ${inIndex})) {
                        otherStringDatum = msg_readFloatDatum(inMessage, ${inIndex}).toString()
                        if (otherStringDatum.endsWith('.0')) {
                            otherStringDatum = otherStringDatum.slice(0, -2)
                        }
                        stringDatum = stringDatum.replace("${placeholder}", otherStringDatum)
                    } else if (msg_isStringToken(inMessage, ${inIndex})) {
                        stringDatum = stringDatum.replace("${placeholder}", msg_readStringDatum(inMessage, ${inIndex}))
                    }`
                )}
                stringMem[${stringMemCount}] = stringDatum
                outTemplate.push(${ASC_MSG_STRING_TOKEN})
                outTemplate.push(stringDatum.length)
            `)
            outMessageSetCode.push(`
                msg_writeStringDatum(outMessage, ${outIndex}, stringMem[${stringMemCount}])
            `)
            stringMemCount++
        } else if (operation.type === 'string-constant') {
            // prettier-ignore
            outMessageTemplateCode.push(`
                outTemplate.push(${ASC_MSG_STRING_TOKEN})
                outTemplate.push(${operation.value.length})
            `)

            outMessageSetCode.push(`
                msg_writeStringDatum(outMessage, ${outIndex}, "${operation.value}")
            `)
        } else if (operation.type === 'float-constant') {
            outMessageTemplateCode.push(`
                outTemplate.push(${ASC_MSG_FLOAT_TOKEN})
            `)

            outMessageSetCode.push(`
                msg_writeFloatDatum(outMessage, ${outIndex}, ${operation.value})
            `)
        }
    })

    return iterateMessageTokensSnippet(snippet, {
        ...variableNames, 
        stringMemCount: stringMemCount.toString(),
        outMessageSetCode: outMessageSetCode.join('\n'), 
        outMessageTemplateCode: outMessageTemplateCode.join('\n'),
    })
}

const iterateMessageTokensSnippet: NodeCodeSnippet<{
    stringMemCount: string, 
    outMessageTemplateCode: string,
    outMessageSetCode: string
}> = (snippet, {ins, outs, stringMemCount, outMessageTemplateCode, outMessageSetCode}) => 
    // prettier-ignore
    snippet`
        while (${ins.$0}.length) {
            const inMessage: Message = ${ins.$0}.shift()
            let stringDatum: string
            let otherStringDatum: string

            const stringMem: Array<string> = new Array<string>(${stringMemCount})
            const outTemplate: MessageTemplate = []
            ${outMessageTemplateCode}
            
            const outMessage: Message = msg_create(outTemplate)
            ${outMessageSetCode}

            ${outs.$0}.push(outMessage)
        }
    `

// ------------------------------------------------------------------- //
export const snippets = { iterateMessageTokensSnippet }