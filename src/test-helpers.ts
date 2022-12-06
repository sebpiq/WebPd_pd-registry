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

import { Compilation } from "./compilation"

// Necessary because `Compilation.graph` is readonly
export const setCompilationGraph = (
    compilation: Compilation,
    graph: PdDspGraph.Graph
) => {
    Object.keys(compilation.graph).forEach(
        (key) => delete compilation.graph[key]
    )
    Object.keys(graph).forEach((key) => (compilation.graph[key] = graph[key]))
}