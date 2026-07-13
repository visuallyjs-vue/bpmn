<script setup>
import { 
    ControlsComponent, 
    DiagramComponent, DiagramPaletteComponent, 
    MiniviewComponent, 
    DiagramProvider,
    ExportControlsComponent
} from "@visuallyjs/browser-ui-vue";
import { 
    CONNECTOR_TYPE_ORTHOGONAL, Group
} from "@visuallyjs/browser-ui"

import {addLaneToPool, computeLaneSizeUpdates, resizeFactory} from "./resize-updater.js";

import { 
    getBPMNFlowTypes, 
    BPMN2_SHAPES,
    LANE, POOL, GROUP, DEFAULT_POOL_HEADER_SIZE,
    EVENT_TYPES, FLOW_TYPES, DATAOBJECT
} from "@visuallyjs/bpmn"

import BpmnInspector from "./Inspector.vue";

const props = defineProps(['url', 'data'])

const imageDimensions = [
    {width:3000}, {width:1200}, {width:800}
]

const diagramOptions = {
    zoomToFit: true,
    shapes: BPMN2_SHAPES,
    edges: {
        connector: {
            type: CONNECTOR_TYPE_ORTHOGONAL,
            options: {
                cornerRadius: 2,
                stub:15
            }
        },
        propertyMappings: getBPMNFlowTypes(),
        showLabels: true,
        labelFont:{
            size:12,
            style:"bold"
        }
    },
    cells: {
        resize: {
            handlerFactory: resizeFactory
        },
        shouldDeleteGroupMembers: (p, el) => true,
        font:{
            size:10
        },
        getCollapsedGroupSize:(group, currentSize) => {
            return {
                height:Math.min(currentSize.height, 100),
                width:currentSize.width
            }
        }
    },
    grid: {
        size: {
            width: 10,
            height: 10
        }
    },
    snapLines:true,
    autoPan:false,
    mediator: {
        canResize: (vertex, shape, el) => vertex.type === POOL || vertex.type === LANE || vertex.type === "group",
        canClone: (vertex, shape, el) => vertex.type !== POOL && vertex.type !== LANE,
        canLink: (vertex, shape, el) => vertex.type !== POOL && vertex.type !== LANE,
        canRotate: (vertex, shape, el) => false,
        canDrag: (vertex, shape, el) => {
            return vertex.type !== "lane"
        },
        canDrop: (candidate, target, onCanvas) => {
            if (candidate.type === LANE) {
                return target != null && target.type === POOL
            }

            if (candidate.type === POOL) {
                return onCanvas === true
            }

            if (onCanvas) {
                return !EVENT_TYPES.includes(candidate.type) && !FLOW_TYPES.includes(candidate.type) && candidate.type !== DATAOBJECT
            }

            return target.type === LANE || target.type === GROUP
        },
        canCollapse(group, currentSize) {
            if (group.type === POOL) {
                return true
            } else if (group.type === LANE) {
              const lanes = group.group.getMembers()
                const updates = computeLaneSizeUpdates(lanes, group, 100, currentSize.width, group.group.data.headerSize || DEFAULT_POOL_HEADER_SIZE)
                return updates
            } else {

                return false
            }
        },
        canExpand(group, currentSize) {
            if (group.type === POOL) {
                return true
            } else if (group.type === LANE) {
                const lanes = group.group.getMembers()
                const updates = computeLaneSizeUpdates(lanes, group, currentSize.height, currentSize.width, group.group.data.headerSize || DEFAULT_POOL_HEADER_SIZE)
                return updates
            } else {

                return false
            }
        }
    }
}

const beforeConnect = (v1, v2) => {
    // cannot connect the lane/pool objects to anything with an edge
    return v1.objectType !== Group.objectType && v2.objectType !== Group.objectType
}

const onVertexAdded = (p) => {
    if (p.vertex.type === POOL) {
        const poolHeaderSize = p.vertex.data.headerSize || DEFAULT_POOL_HEADER_SIZE

        p.doModelUpdate((ui, model) => {
            model.addFactoryGroup(LANE, {
                width: p.vertex.data.width - poolHeaderSize,
                height: p.vertex.data.height,
                group: p.vertex.id,
                title:"Lane"
            })
        })
    } else if (p.vertex.type === LANE) {
        const poolHeaderSize = p.vertex.data.headerSize || DEFAULT_POOL_HEADER_SIZE
        const updates = addLaneToPool(p.vertex, poolHeaderSize)
        p.doModelUpdate((ui, model) => {
            model.updateVertex(p.vertex, updates[p.vertex.id])
            model.updateVertex(p.vertex.group, updates[p.vertex.group.id])
        })
    }
}

</script>

<template>
  <div class="vjs-bpmn">
    <DiagramProvider>
      <div class="vjs-bpmn-palette">
        <DiagramPaletteComponent :showLabels="true" @vertexAdded="onVertexAdded"/>
      </div>
      <div class="vjs-bpmn-canvas">
        <DiagramComponent :options="diagramOptions" url="/dataset.json" :data="data" :modelOptions="{beforeConnect}">
          <ControlsComponent/>
          <ExportControlsComponent :imageOptions="{dimensions:imageDimensions}"/>
        </DiagramComponent>
      </div>
      <div class="vjs-bpmn-rhs">
        <BpmnInspector/>
        <MiniviewComponent class="vjs-bpmn-miniview"/>
      </div>
    </DiagramProvider>
  </div>
</template>
