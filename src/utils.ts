export const nLines = (count: number, func: (i: number) => string) => {
    const results: Array<string> = []
    for (let i = 0; i < count; i++) {
        results.push(func(i))
    }
    return results.join('\n')
}