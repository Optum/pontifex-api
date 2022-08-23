export function omit(obj: any, ...fields: string[]): any {
    const ret = {}
    for (const [k, v] of Object.entries(obj)) {
        if (!(fields.includes(k))) {
            ret[k] = v
        }
    }
    return ret
}