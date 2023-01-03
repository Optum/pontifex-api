import { SingletonCosmosClient } from "../SingletonCosmosClient";

export interface Connections {
    contains?: Resource                 // app -> env
    "contained by"?: Resource           // env -> app
    "requests permission"?: Resource    // env -> permission request, endpoint -> permission request
    "request source"?: Resource         // permission request -> env
    "request target"?: Resource         // permission request -> endpoint
    "request creator"?: Resource        // permission request -> user
    "created request"?: Resource        // user -> permission request
    owns?: Resource                     // user -> app
    "owned by"?: Resource               // app -> user
    "has event"?: Resource              // ? -> event
    "is event for"?: Resource           // event -> ?
    "has password"?: Resource           // app -> password
    "is password for"?: Resource        // password -> app
}

export interface Resource {
    application?: GremlinVertex[]
    environment?: GremlinVertex[]
    user?: GremlinVertex[]
    permissionRequest?: GremlinVertex[]
    endpoint?: GremlinVertex[]
    event?: GremlinVertex[]
    password?: GremlinVertex[]
}

export interface GremlinVertex {
    id: string
    pk: string
    properties?: Record<string, any>
}

export interface GremlinEdge {
    id?: string
    label: string
    sourceVertexId: string
    sourceVertexPk: string
    destinationVertexId: string
    destinationVertexPk: string
    properties?: Record<string, any>
}

const cosmos = SingletonCosmosClient.Instance

function getDropStatements(properties: Record<string, any>) {
    let dropPropertyString = ''
    const dropBindings: Record<string, string> = {}

    for (const [key, value] of Object.entries(properties)) {
        if (Array.isArray(value)) {
            const dropBindingKey = `drop${key}`
            dropBindings[dropBindingKey] = key
            dropPropertyString += `.sideEffect(properties(${dropBindingKey}).drop())`
        }
    }

    return {
        dropPropertyString,
        dropBindings
    }
}

function getAddStatements(properties: Record<string, any>) {
    let addPropertyString = ''
    const addBindings: Record<string, string> = {}

    for (const [key, value] of Object.entries(properties)) {
        addBindings[key] = key

        if (Array.isArray(value)) {
            for (const [index, val] of value.entries()) {
                const valueBindingKey = `${key}${index}`
                addBindings[valueBindingKey] = val
                addPropertyString += `.property(Cardinality.list, ${key}, ${valueBindingKey}`
            }
        } else {
            const valueBindingKey = `${key}0`
            addBindings[valueBindingKey] = value
            addPropertyString += `.property(Cardinality.single, ${key}, ${valueBindingKey})`
        }
    }

    return {
        addPropertyString,
        addBindings
    }
}

function mapProperties(properties: Record<string, any>) {
    if (!properties || Object.keys(properties).length == 0) {
        return {
            propertyString: '',
            propertyBindings: {}
        }
    }

    const {dropPropertyString, dropBindings} = getDropStatements(properties)
    const {addPropertyString, addBindings} = getAddStatements(properties)

    return {
        propertyString: dropPropertyString + addPropertyString,
        propertyBindings: {
            ...dropBindings,
            ...addBindings
        }
    }
}

export interface UpsertVertexProps {
    id: string
    pk: string
    defaultProperties?: Record<string, any>
    updatedProperties?: Record<string, any>
}

export async function upsertVertex(props: UpsertVertexProps) {
    const defaultPropertiesMapping = mapProperties(props.defaultProperties)
    const updatedPropertiesMapping = mapProperties(props.updatedProperties)

    const bindings = {
        id: props.id,
        pk: props.pk,
        ...defaultPropertiesMapping.propertyBindings,
        ...updatedPropertiesMapping.propertyBindings
    }

    const query = `
        g.V(id).has('pk', pk)
        .fold()
        .coalesce(
            unfold(),
            addV().property(T.id, id).property('pk', pk)
            ${defaultPropertiesMapping.propertyString}
        )
        ${updatedPropertiesMapping.propertyString}
    `
    const result = await cosmos.submit(query, bindings)
    return result._items[0]
}

export async function upsertEdge(edge: GremlinEdge) {
    const edgeId = edge.id ?? `${edge.sourceVertexId}.${edge.sourceVertexPk}-${edge.destinationVertexId}.${edge.destinationVertexPk}`

    const {propertyString, propertyBindings} = mapProperties(edge.properties)

    const bindings = {
        edgeId,
        edgeLabel: edge.label,
        sourceVertexId: edge.sourceVertexId,
        sourceVertexPk: edge.sourceVertexPk,
        destinationVertexId: edge.destinationVertexId,
        destinationVertexPk: edge.destinationVertexPk,
        ...propertyBindings
    }

    const query = `
        g.E(edgeId)
        .fold()
        .coalesce(
            unfold(),
            g.V(sourceVertexId).has('pk', sourceVertexPk).as('source')
            .V(destinationVertexId).has('pk', destinationVertexPk)
            .addE(edgeLabel).from('source').property(T.id, edgeId))
        ${propertyString}
    `

    const result = await cosmos.submit(query, bindings)
    return result._items[0]
}

export async function getVertex(id: string, pk: string) {
    const bindings = {
        id,
        pk
    }

    const query = "g.V(id).has('pk', pk)"

    const result = await cosmos.submit(query, bindings)

    return result._items[0]
}

export async function getEdge(id: string, pk: string) {
    const bindings = {
        id,
        pk
    }

    const query = "g.E(id).has('pk', pk)"

    const result = await cosmos.submit(query, bindings)

    return result._items[0]
}

export async function getAllVerticesOfType(type: string) {
    const binding = {
        type
    }

    const query = "g.V().has('type', type)"

    const result = await cosmos.submit(query, binding)

    return result._items
}

export async function getVertexAndChildren<T>(id: string, pk: string, type: string): Promise<{ vertex: T, connections: Connections }> {
    const vertex: T = await getVertex(id, pk)

    const bindings = {
        id,
        pk,
        type
    }

    const query = `
        g.V(id).has('pk', pk).has('type', type)
        .outE().group().by(label).by(inV().group().by('type').by(fold()))
    `

    const result = await cosmos.submit(query, bindings)

    const connections: Connections = result._items[0];
    return {
        vertex,
        connections
    }
}

export async function dropVertex(id: string) {
    await cosmos.submit('g.V(id).drop()', {
        id
    })
}