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
import { Code, NodeCodeGenerator } from '@webpd/compiler-js/src/types'
import { DspGraph } from '@webpd/dsp-graph'
import NODE_ARGUMENTS_TYPES from '../node-arguments-types'

type MsgCodeGenerator = NodeCodeGenerator<NODE_ARGUMENTS_TYPES['msg']>

const ASC_MSG_STRING_TOKEN = MSG_DATUM_TYPES_ASSEMBLYSCRIPT[MSG_DATUM_TYPE_STRING]
const ASC_MSG_FLOAT_TOKEN = MSG_DATUM_TYPES_ASSEMBLYSCRIPT[MSG_DATUM_TYPE_FLOAT]

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
                outTemplate.push(msg_getDatumType(inMessage, ${inIndex}))
                if (msg_isStringToken(inMessage, ${inIndex})) {
                    stringMem[${stringMemCount}] = msg_readStringDatum(inMessage, ${inIndex})
                    outTemplate.push(stringMem[${stringMemCount}].length)
                }
            `
            outMessageCode += `
                if (msg_isFloatToken(inMessage, ${inIndex})) {
                    msg_writeFloatDatum(outMessage, ${outIndex}, msg_readFloatDatum(inMessage, ${inIndex}))
                } else if (msg_isStringToken(inMessage, ${inIndex})) {
                    msg_writeStringDatum(outMessage, ${outIndex}, stringMem[${stringMemCount}])
                }
            `
            stringMemCount++
        } else if (operation.type === 'string-template') {
            outTemplateCode += `
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
            `
            outMessageCode += `
                msg_writeStringDatum(outMessage, ${outIndex}, stringMem[${stringMemCount}])
            `
            stringMemCount++
        } else if (operation.type === 'string-constant') {
            outTemplateCode += `
                outTemplate.push(${ASC_MSG_STRING_TOKEN})
                outTemplate.push(${operation.value.length})
            `
            outMessageCode += `
                msg_writeStringDatum(outMessage, ${outIndex}, "${operation.value}")
            `
        } else if (operation.type === 'float-constant') {
            outTemplateCode += `
                outTemplate.push(${ASC_MSG_FLOAT_TOKEN})
            `
            outMessageCode += `
                msg_writeFloatDatum(outMessage, ${outIndex}, ${operation.value})
            `
        }
    })

    return `
        while (${ins.$0}.length) {
            const ${macros.typedVar('inMessage', 'Message')} = ${ins.$0}.shift()
            let ${macros.typedVar('stringDatum', 'string')}
            let ${macros.typedVar('otherStringDatum', 'string')}
            const ${macros.typedVar('stringMem', 'Array<string>')} = []

            const ${macros.typedVar('outTemplate', 'MessageTemplate')} = []
            ${outTemplateCode}
            
            const ${macros.typedVar('outMessage', 'Message')} = msg_create(outTemplate)
            ${outMessageCode}

            ${outs.$0}.push(outMessage)
        }
    `
}