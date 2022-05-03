import {useEffect, useMemo} from "react";
import useEngineEssentials, {ENTITY_ACTIONS} from "../engine/useEngineEssentials";
import MeshInstance from "../engine/instances/MeshInstance";
import MaterialInstance from "../engine/instances/MaterialInstance";
import EditorEngine from "../engine/editor/EditorEngine";
import ScriptSystem from "../engine/ecs/systems/ScriptSystem";
import PerformanceSystem from "../engine/ecs/systems/PerformanceSystem";
import TransformSystem from "../engine/ecs/systems/TransformSystem";
import ShadowMapSystem from "../engine/ecs/systems/ShadowMapSystem";
import PickSystem from "../engine/ecs/systems/PickSystem";
import CameraCubeSystem from "../engine/ecs/systems/CameraCubeSystem";
import CubeMapSystem from "../engine/ecs/systems/CubeMapSystem";

export default function useProject(loader, projectID) {
    const {
        meshes, setMeshes,
        materials, setMaterials,
        entities, dispatchEntities,
        scripts, setScripts,
        gpu
    } = useEngineEssentials(projectID)
    const renderer = useMemo(() => {
        if (gpu) {
            const r = new EditorEngine(projectID, gpu)
            r.systems = [
                new ScriptSystem(gpu),
                new PerformanceSystem(gpu),
                new TransformSystem(),
                new ShadowMapSystem(gpu),
                new PickSystem(gpu),
                new CameraCubeSystem(id + '-camera'),
                new CubeMapSystem(gpu),
            ]
            return r
        }
        return undefined
    }, [gpu])

    useEffect(() => {
        const canvas = document.getElementById(projectID)
        if (canvas && loader) {
            loader.load()
                .then(async ({
                    meshes,
                    materials,
                    scripts,
                    settings,
                    entities
                }) => {
                    setMeshes(meshes.map(m => new MeshInstance({...m, gpu: gpu})))
                    setScripts(scripts)
                    setMaterials(await Promise.all(materials.map(m => mapMaterial(m.response, gpu, m.id))))
                    dispatchEntities({type: ENTITY_ACTIONS.DISPATCH_BLOCK, payload: entities}) // TODO - MAP ENTITIES

                    settings.start()
            })
        }
    }, [projectID])
}

async function mapEntity({shader, vertexShader, uniforms, uniformData, settings}, gpu, id) {

    let newMat
    await new Promise(resolve => {
        newMat = new MaterialInstance(gpu, vertexShader, shader, uniformData, settings, () => resolve(), id)
    })
    newMat.uniforms = uniforms
    return newMat
}
async function mapMaterial({shader, vertexShader, uniforms, uniformData, settings}, gpu, id) {

    let newMat
    await new Promise(resolve => {
        newMat = new MaterialInstance(gpu, vertexShader, shader, uniformData, settings, () => resolve(), id)
    })
    newMat.uniforms = uniforms
    return newMat
}