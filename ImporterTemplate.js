export default function ImporterTemplate(body){
    return `
        const DATA_TYPES = {
            ENTITY: 0,
            MATERIAL: 1,
            MESH: 2,
            SCRIPT: 3
        }
        export default class Importer{
            ${body}            
        }
    `
}