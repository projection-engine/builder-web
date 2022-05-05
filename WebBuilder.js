import ImporterTemplate from "./ImporterTemplate";

const fs = window.require('fs')
const path = window.require('path')
export default class WebBuilder {

    constructor(fileSystem) {
        this.fileSystem = fileSystem
    }

    async build(dataObj) {
        this.path = path.resolve(this.fileSystem.path + '\\out')
        await new Promise(resolve => fs.mkdir(this.path, (err) => resolve()))
        this.path += '\\web'
        await new Promise(resolve => fs.mkdir(this.path, (err) => resolve()))
        await new Promise(resolve => fs.writeFile(this.path + '\\' + 'Importer.js', ImporterTemplate(this.#buildImports(dataObj)), () => resolve()))

        await this.#insertData(dataObj.entities)
    }

    #buildImports({entities, meshes, materials, scripts}) {
        let imports = []
        const map = (key, contentType, type) => {
            imports.push(`
               toLoad.push(new Promise(resolve => {
                import("./assets/${key}.${contentType}").then(r => {
                    resolve({data: r, type: DATA_TYPES.${type}))
               })
             `)
        }

        entities.forEach(e => map(e.id, 'json', 'ENTITY'))
        meshes.forEach(e => map(e.id, 'json', 'MESH'))
        materials.forEach(e => map(e.id, 'json', 'MATERIAL'))
        scripts.forEach(e => map(e.id, 'js', 'SCRIPT'))

        return `       
            importAll(){
                  const toLoad = []
                 ${imports.join('\n')}          
                 return Promise.all(toLoad)  
            }
        `
    }

    async #insertData(entities) {
        const promises = entities.map(e => new Promise(resolve => fs.writeFile(path.resolve(this.path + '\\' + e.id + '.json'), JSON.stringify(structuredClone(e)), () => resolve())))
        const registry = await this.fileSystem.readRegistry()
        for (let i in registry) {
            const r = registry[i]
            const data = await this.fileSystem.readFile(this.fileSystem.path + '\\assets\\' + r.path)
            if (data)
                switch (r.path.split('.').pop()) {
                    case '.mesh':
                    case 'material':
                        promises.push(new Promise(resolve => fs.writeFile(path.resolve(this.path + '\\' + r.id + '.json'), data, () => resolve())))
                        break
                    case 'flow':
                    case 'flowRaw':
                        promises.push(new Promise(resolve => fs.writeFile(path.resolve(this.path + '\\' + r.id + '.js'), 'export default '+ data, () => resolve())))
                        break
                    case 'pimg':
                        promises.push(new Promise(resolve => fs.writeFile(path.resolve(this.path + '\\' + r.id + '.json'), JSON.stringify({data}), () => resolve())))
                        break
                    default:
                        break
                }
        }
        await Promise.all(promises)
    }
}