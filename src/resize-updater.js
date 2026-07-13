import {DEFAULT_LANE_HEADER_SIZE, DEFAULT_POOL_HEADER_SIZE, LANE, POOL} from "@visuallyjs/bpmn";
import {extractBounds} from "@visuallyjs/browser-ui";

const MIN_LANE_WIDTH = 100
const MIN_LANE_HEIGHT = 100

function getHorizontalProperties() {
    return {
        axisSizeProperty : "width",
        otherAxisSizeProperty : "height",
        otherMaxProperty : "ymax",
        maxProperty : "xmax",
        minSizeInAxis : MIN_LANE_WIDTH,
        minSizeInOtherAxis : MIN_LANE_HEIGHT,
        axisProperty:"x",
        otherAxisProperty:"y",
    }
}

function getVerticalProperties() {
    return {
        axisSizeProperty : "height",
        otherAxisSizeProperty : "width",
        otherMaxProperty : "xmax",
        maxProperty : "ymax",
        minSizeInAxis : MIN_LANE_HEIGHT,
        minSizeInOtherAxis : MIN_LANE_WIDTH,
        axisProperty:"y",
        otherAxisProperty:"x",
    }
}

/**
 * Given a group of LANE vertices and a known fixed size for one of them,
 * compute the updates needed for all lanes and their pool.
 *
 * @param {object[]} lanes       - all lane vertices in the pool (ordered)
 * @param {object}   fixedLane   - the lane whose size is known
 * @param {number}   fixedHeight - the desired height for fixedLane
 * @param {number}   fixedWidth  - the desired width for all lanes
 * @param {number}   laneHeaderSize
 * @returns {object} updates keyed by vertex id
 */
export function computeLaneSizeUpdates(lanes, fixedLane, fixedHeight, fixedWidth, laneHeaderSize) {
    const pool = fixedLane.group
    const fixedIndex = lanes.findIndex(l => l === fixedLane)

    // Build the new heights: keep all other lanes at their current height,
    // set the fixed lane to fixedHeight
    const heights = lanes.map((l, i) =>
        i === fixedIndex
            ? Math.max(MIN_LANE_HEIGHT, fixedHeight)
            : Math.max(MIN_LANE_HEIGHT, l.data.height)
    )

    const width = Math.max(MIN_LANE_WIDTH, fixedWidth)
    const updates = {}

    let curY = 0
    for (let i = 0; i < lanes.length; i++) {
        updates[lanes[i].id] = {
            y:      curY,
            x:      0,
            height: heights[i],
            width:  width
        }
        curY += heights[i]
    }

    updates[pool.id] = {
        height: curY,
        width:  width + laneHeaderSize
    }

    return updates
}

export const resizeFactory = (ui, vertex, direction, defaultHandler) => {
    if (vertex.type === POOL) {

        const poolHeaderSize = vertex.data.headerSize || DEFAULT_POOL_HEADER_SIZE

        const {
            axisSizeProperty,
            otherAxisSizeProperty,
            otherMaxProperty,
            maxProperty,
            minSizeInAxis,
            minSizeInOtherAxis,
            otherAxisProperty,
            axisProperty} = getHorizontalProperties();

        const lanes = vertex.getMembers().filter(m => m.type === LANE)
        const laneExtents = lanes.map(lane => ui.getGroupContentExtents(lane))

        return (dx, dy) => {
            const def = defaultHandler(dx, dy)
            def.updates = {}

            if (lanes.length > 0) {

                const desiredSizesInOtherAxis = lanes.map((m, i) => Math.max(minSizeInOtherAxis, (m.data[otherAxisSizeProperty] / vertex.data[otherAxisSizeProperty]) * def[otherAxisSizeProperty], laneExtents[i][otherMaxProperty]))
                const minSizesInAxis = lanes.map((l, i) => Math.max(minSizeInAxis, laneExtents[i][maxProperty] + poolHeaderSize))
                minSizesInAxis.push(def[axisSizeProperty])
                def[axisSizeProperty] = Math.max(...minSizesInAxis) + poolHeaderSize

                let curY = 0
                for (let i = 0; i < lanes.length; i++) {
                    def.updates[lanes[i].id] = {
                        [axisSizeProperty]: def[axisSizeProperty] - poolHeaderSize,
                        [otherAxisSizeProperty]: desiredSizesInOtherAxis[i],
                        [otherAxisProperty]: curY
                    }

                    curY += desiredSizesInOtherAxis[i]
                }

                def[otherAxisSizeProperty] = curY
            }

            return def
        }
    } else if (vertex.type === LANE) {

        const laneHeaderSize = vertex.data.headerSize || DEFAULT_LANE_HEADER_SIZE
        const {
            axisSizeProperty,
            otherAxisSizeProperty,
            otherMaxProperty,
            maxProperty,
            minSizeInAxis,
            minSizeInOtherAxis,
            otherAxisProperty,
            axisProperty} = getHorizontalProperties();

        const poolPositionAtStart = extractBounds(vertex.group.data)
        const lanes = vertex.group.getMembers().filter(m => m.type === LANE)
        const thisLaneExtents = ui.getGroupContentExtents(vertex)
        const laneIndex = lanes.findIndex(m => m === vertex)
        const laneSizesInOtherAxis = lanes.map(m => m.data[otherAxisSizeProperty])
        const laneSizesInAxis = lanes.map(m => m.data[axisSizeProperty])
        const laneExtents = lanes.map(lane => ui.getGroupContentExtents(lane))
        const minimumSizeInAxis = Math.max(...laneExtents.map(le => le[maxProperty])) + laneHeaderSize

        return (dx, dy) => {
            const def = defaultHandler(dx, dy)
            def.updates = {}

            // ------------- lane size in other axis (height for horizontal, width for vertical)
            const otherAxisSize = Math.max(minSizeInOtherAxis, def[otherAxisSizeProperty], thisLaneExtents[otherMaxProperty])
            laneSizesInOtherAxis[laneIndex] = otherAxisSize
            def[otherAxisSizeProperty] = otherAxisSize

            const sizeInOtherAxisDelta = otherAxisSize - vertex.data[otherAxisSizeProperty]
            const positioninOtherAxisDelta = def[otherAxisProperty] - vertex.data[otherAxisProperty]

            let current = 0
            for (let i = 0; i < lanes.length; i++) {
                def.updates[lanes[i].id] = {
                    [otherAxisProperty]: current
                }
                if (lanes[i] === vertex) {
                    def[otherAxisProperty] = current
                }
                current += laneSizesInOtherAxis[i]
            }

            // ----------- adjust pool size and possibly position ---------------
            def.updates[vertex.group.id] = {
                // recompute height of all lanes
                [otherAxisSizeProperty]:laneSizesInOtherAxis.reduce((acc, m, i) => acc + m, 0)
            }
            // if there was a delta in lane height, adjust top of pool in canvas.
            if (sizeInOtherAxisDelta !== 0) {
                def.updates[vertex.group.id][otherAxisProperty] = poolPositionAtStart[otherAxisProperty] + positioninOtherAxisDelta
            }

            // -------------- lane size in main axis (width for horizontal, height for vertical)

            const sizeInAxis = Math.max(minSizeInAxis, def[axisSizeProperty], minimumSizeInAxis)
            laneSizesInAxis[laneIndex] = sizeInAxis
            def[axisSizeProperty] = sizeInAxis

            const sizeInAxisDelta = sizeInAxis - vertex.data[axisSizeProperty]
            const positionInAxisDelta = def[axisProperty] - vertex.data[axisProperty]

            if (sizeInAxisDelta !== 0) {
                def.updates[vertex.group.id][axisSizeProperty] = sizeInAxis + laneHeaderSize
                def.updates[vertex.group.id][axisProperty] = poolPositionAtStart[axisProperty] + positionInAxisDelta
            }

            for (let i = 0; i < lanes.length; i++) {
                def.updates[lanes[i].id][axisSizeProperty] = sizeInAxis
                def.updates[lanes[i].id][axisProperty] = 0
            }

            def[axisProperty] = 0

            return def
        }
    }
}

export function addLaneToPool(lane, headerSize) {
    const pool = lane.group
    const maxY = Math.max(...(pool.getMembers().filter(m => m !== lane).map(m => m.data.y + m.data.height)))
    const updates = {
        [lane.id]:{
            y:maxY,
            x:0,
            width:pool.data.width - headerSize
        },
        [pool.id]:{
            height:pool.data.height + lane.data.height
        }
    }
    return updates
}
