<script setup>
import { InspectorComponent, ColorPickerComponent, EdgeTypePickerComponent } from "@visuallyjs/browser-ui-vue"
import { Node, Group, Edge } from "@visuallyjs/browser-ui"
import {
    POOL,
    LANE,
    TASK,
    GATEWAY,
    GATEWAY_TYPES,
    TASK_TYPES,
    MARKER_TYPES,
    EVENT_TYPES,
    INTERMEDIATE_EVENT, INTERMEDIATE_EVENT_TYPES,
    START_EVENT_TYPES, END_EVENT_TYPES, END_EVENT, START_EVENT
} from "@visuallyjs/bpmn";
import {ref} from "vue";

const currentObj = ref(null)
const currentType = ref(null)

function renderEmptyContainer() {
  currentType.value = ''
}

function refresh(obj) {
  currentObj.value = obj
}

function capitalise(id) {
    return id[0].toUpperCase() + id.substring(1)
}

function markerName(id) {
    return capitalise(id.split("-")[0])
}

function eventName(id) {
    return id.split("-").map(capitalise).join(" ")
}

const isGroup = (obj) => obj.objectType === Group.objectType;
const isPoolOrLane = (obj) => isGroup(obj) && (obj.type === POOL || obj.type === LANE);
const isTask = (obj) => obj.objectType === Node.objectType && obj.type === TASK;
const isGateway = (obj) => obj.objectType === Node.objectType && obj.type === GATEWAY
const isEvent = (obj) => obj.objectType === Node.objectType && EVENT_TYPES.includes(obj.type)

</script>

<template>
    <InspectorComponent class="vjs-bpmn-inspector" :refresh="refresh" :renderEmptyContainer="renderEmptyContainer">
        <template v-if="currentObj != null">
            <template v-if="isPoolOrLane(currentObj)">
                <div class="vjs-inspector-section">
                    <div>Title</div>
                    <input type="text" vjs-att="title" vjs-focus="true" placeholder="Title"/>
                </div>

                <div class="vjs-inspector-section">
                    <h4>Header</h4>
                    <div>Fill</div>
                    <ColorPickerComponent propertyName="headerFill"/>
                    <div>Text color</div>
                    <ColorPickerComponent propertyName="headerColor"/>
                </div>

                <div class="vjs-inspector-section">
                    <h4>Body</h4>
                    <div>Fill</div>
                    <ColorPickerComponent propertyName="fill"/>
                    <div>Outline</div>
                    <ColorPickerComponent propertyName="outline"/>
                </div>
            </template>

            <template v-if="isTask(currentObj)">
                <div class="vjs-inspector-section">
                    <h4>Label</h4>
                    <input type="text" vjs-att="label" vjs-focus="true" placeholder="Label"/>
                </div>

                <div class="vjs-inspector-section">
                    <h3>Color</h3>
                    <div>Fill</div>
                    <ColorPickerComponent propertyName="fill" :maxColors="3"/>
                    <div>Outline</div>
                    <ColorPickerComponent propertyName="outline" :maxColors="3"/>
                    <div>Text</div>
                    <ColorPickerComponent propertyName="color" :maxColors="3"/>
                </div>

                <div class="vjs-inspector-section">
                    <h4>Task Type</h4>
                    <label v-for="t in TASK_TYPES" :key="t" style="display:flex; align-items:center">
                        <vjs-bpmn-icon :icon-id="t" width="20" height="20"/>
                        <input type="radio" vjs-att="taskType" :value="t" name="taskType" />
                        <span>{{ capitalise(t) }}</span>
                    </label>
                </div>
                <div class="vjs-inspector-section">
                    <h4>Markers</h4>
                    <label v-for="t in MARKER_TYPES" :key="t" style="display:flex; align-items:center">
                        <vjs-bpmn-icon :icon-id="t" width="20" height="20"/>
                        <input type="checkbox" vjs-att="markers" :value="t" />
                        <span>{{ markerName(t) }}</span>
                    </label>
                </div>
            </template>

            <template v-if="isGateway(currentObj)">
                <div class="vjs-inspector-section">
                    <h4>Label</h4>
                    <input type="text" vjs-att="label" vjs-focus="true" placeholder="Label"/>
                </div>
                <div class="vjs-inspector-section">
                    <h3>Color</h3>
                    <div>Fill</div>
                    <ColorPickerComponent propertyName="fill" :maxColors="3"/>
                </div>
                <div class="vjs-inspector-section">
                    <h3>Type</h3>
                    <label v-for="t in GATEWAY_TYPES" :key="t" style="display:flex; align-items:center">
                        <vjs-bpmn-icon :icon-id="t" width="20" height="20"/>
                        <input type="radio" vjs-att="gatewayType" :value="t" name="gatewayType" />
                        <span>{{ capitalise(t) }}</span>
                    </label>
                </div>
            </template>

            <template v-if="isEvent(currentObj)">
                <div class="vjs-inspector-section">
                    <h3>Color</h3>
                    <div>Fill</div>
                    <ColorPickerComponent propertyName="fill" :maxColors="3"/>
                    <div>Outline</div>
                    <ColorPickerComponent propertyName="outline" :maxColors="3"/>
                </div>
                <div class="vjs-inspector-section">
                    <h3>Type</h3>
                    <template v-if="currentObj.data.type === INTERMEDIATE_EVENT">
                        <label v-for="t in INTERMEDIATE_EVENT_TYPES" :key="t" style="display:flex; align-items:center">
                            <vjs-bpmn-icon :icon-id="t" width="20" height="20"/>
                            <input type="radio" vjs-att="eventType" name="eventType" :value="t" />
                            <span>{{ eventName(t) }}</span>
                        </label>
                    </template>

                    <template v-if="currentObj.data.type === START_EVENT">
                        <label v-for="t in START_EVENT_TYPES" :key="t" style="display:flex; align-items:center">
                            <vjs-bpmn-icon :icon-id="t" width="20" height="20"/>
                            <input type="radio" vjs-att="eventType" name="eventType" :value="t" />
                            <span>{{ eventName(t) }}</span>
                        </label>
                    </template>

                    <template v-if="currentObj.data.type === END_EVENT">
                        <label v-for="t in END_EVENT_TYPES" :key="t" style="display:flex; align-items:center">
                            <vjs-bpmn-icon :icon-id="t" width="20" height="20"/>
                            <input type="radio" vjs-att="eventType" name="eventType" :value="t" />
                            <span>{{ eventName(t) }}</span>
                        </label>
                    </template>
                </div>
            </template>

            <template v-if="currentObj.objectType === Edge.objectType">
                <div class="vjs-inspector-section">
                    <div>Label</div>
                    <input type="text" vjs-att="label"/>
                </div>
                <div class="vjs-inspector-section">
                    <div>Line style</div>
                    <EdgeTypePickerComponent propertyName="type"/>
                </div>
            </template>
        </template>
    </InspectorComponent>
</template>
