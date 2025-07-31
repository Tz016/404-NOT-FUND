<template>
  <div class="spark-wrap" @mousemove="onMousemove" @mouseleave="onMouseleave">
    <canvas ref="cv" :width="width" :height="height" class="spark-canvas"></canvas>
    <div v-if="hover.show" class="tooltip" :style="{ left: hover.x + 'px', top: hover.y + 'px' }">
      <div class="tip-line">{{ hover.valueText }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { scaleLinear, scaleTime } from 'd3-scale'
import { line as d3Line, curveMonotoneX } from 'd3-shape'
import { interpolateArray, interpolateNumber } from 'd3-interpolate'
import { timer as d3Timer } from 'd3-timer'

const props = defineProps({
  series: { type: Array, default: () => [] },     // [{t,p}]
  width: { type: Number, default: 140 },
  height: { type: Number, default: 32 },
  padding: { type: Number, default: 2 },
  lineWidth: { type: Number, default: 2.6 },
  currency: { type: String, default: 'USD' },
  // ⭐ 新增：时间窗版本号，切换时变化 -> 触发 x 缩放动画
  rescaleKey: { type: Number, default: 0 },
})

const cv = ref(null)
let ctx = null
let anim = null
let lastY = []
// 记录上一次的 x 域用于 rescale 动画
let lastDomain = null

const hover = ref({ show: false, x: 0, y: 0, idx: -1, valueText: '' })

function fmt(val, cur = 'USD') {
  if (val == null) return '—'
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: cur }).format(val) }
  catch { return (val.toFixed ? val.toFixed(2) : String(val)) }
}

function computeDomains(data) {
  const t0 = data[0].t
  const t1 = data[data.length - 1].t
  const minP = Math.min(...data.map(d => d.p))
  const maxP = Math.max(...data.map(d => d.p))
  const yMin = (minP === maxP) ? minP - 1 : minP
  const yMax = (minP === maxP) ? maxP + 1 : maxP
  return { t0, t1, yMin, yMax }
}

function drawFrameXInterpolated(data, interpX, y, yArrayOpt) {
  if (!ctx) return
  const { width, height, padding, lineWidth } = props
  ctx.clearRect(0, 0, width, height)
  if (!data || !data.length) return

  const lineGen = d3Line()
    .x((d, i) => interpX(d.t))                   // ⭐ x 使用插值函数
    .y((d, i) => yArrayOpt ? y(yArrayOpt[i]) : y(d.p))
    .curve(curveMonotoneX)
    .context(ctx)

  ctx.save()
  ctx.lineWidth = lineWidth
  ctx.strokeStyle = getComputedStyle(cv.value).color || '#ddd'
  ctx.beginPath()
  lineGen(data)
  ctx.stroke()
  ctx.restore()

  // 悬停参考线：用当前插值 x
  if (hover.value.show && hover.value.idx >= 0 && hover.value.idx < data.length) {
    const d = data[hover.value.idx]
    const px = interpX(d.t)
    const py = y(d.p)
    ctx.save()
    ctx.strokeStyle = 'rgba(255,255,255,.35)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(px, padding)
    ctx.lineTo(px, height - padding)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(px, py, 2.5, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'
    ctx.fill()
    ctx.restore()
  }
}

function drawStatic(data) {
  if (!ctx) return
  if (!data || !data.length) {
    ctx.clearRect(0, 0, props.width, props.height)
    return
  }
  const { width, height, padding } = props
  const { t0, t1, yMin, yMax } = computeDomains(data)
  const x = scaleTime().domain([t0, t1]).range([padding, width - padding])
  const y = scaleLinear().domain([yMin, yMax]).range([height - padding, padding])

  const interpX = (t) => x(t)
  drawFrameXInterpolated(data, interpX, y)
}

function animateRescale(data) {
  if (!data || !data.length) { drawStatic([]); return }
  const { width, height, padding } = props
  const { t0, t1, yMin, yMax } = computeDomains(data)

  const newX = scaleTime().domain([t0, t1]).range([padding, width - padding])
  const y = scaleLinear().domain([yMin, yMax]).range([height - padding, padding])

  // 旧域（若首帧）用新域避免抖动
  const oldDomain = lastDomain || [t0, t1]
  const oldX = scaleTime().domain(oldDomain).range([padding, width - padding])

  const ix = (t) => interpolateNumber(oldX(t), newX(t)) // 插值函数（对单点）
  const dur = 220
  if (anim) anim.stop()
  const start = performance.now()
  anim = d3Timer(() => {
    const p = Math.min(1, (performance.now() - start) / dur)
    const interpX = (t) => (1 - p) * oldX(t) + p * newX(t)
    drawFrameXInterpolated(data, interpX, y)
    if (p >= 1) {
      anim.stop(); anim = null
      lastDomain = [t0, t1]
    }
  })
}

function onMousemove(e) {
  const data = props.series
  if (!data || !data.length) return
  const rect = cv.value.getBoundingClientRect()
  const px = e.clientX - rect.left

  const { t0, t1, yMin, yMax } = computeDomains(data)
  const x = scaleTime().domain([t0, t1]).range([props.padding, props.width - props.padding])
  const y = scaleLinear().domain([yMin, yMax]).range([props.height - props.padding, props.padding])

  const t = x.invert(px).valueOf()
  // 二分找最近
  let lo = 0, hi = data.length - 1
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (data[mid].t < t) lo = mid + 1
    else hi = mid
  }
  const idx = (lo === 0) ? 0 : (Math.abs(data[lo - 1].t - t) <= Math.abs(data[lo].t - t) ? lo - 1 : lo)
  const val = data[idx].p

  hover.value = { show: true, x: e.offsetX + 8, y: 0, idx, valueText: fmt(val, props.currency) }
  drawStatic(data)
}
function onMouseleave() { hover.value.show = false; drawStatic(props.series) }

onMounted(() => {
  ctx = cv.value.getContext('2d')
  lastDomain = null
  drawStatic(props.series || [])
})

onBeforeUnmount(() => { if (anim) anim.stop(); anim = null })

// 数据更新：y 值微动画（保持之前的丝滑）
watch(() => props.series, (ns) => {
  if (!ns || !ns.length) { drawStatic([]); lastY = []; return }
  const nextY = ns.map(d => d.p)
  const prevY = lastY.length ? lastY.slice() : nextY.slice()
  const len = Math.max(prevY.length, nextY.length)
  while (prevY.length < len) prevY.unshift(prevY[0])
  while (nextY.length < len) nextY.unshift(nextY[0])

  const { t0, t1, yMin, yMax } = computeDomains(ns)
  const x = scaleTime().domain([t0, t1]).range([props.padding, props.width - props.padding])
  const y = scaleLinear().domain([yMin, yMax]).range([props.height - props.padding, props.padding])

  const interp = interpolateArray(prevY, nextY)
  const dur = 160
  if (anim) anim.stop()
  const start = performance.now()
  anim = d3Timer(() => {
    const p = Math.min(1, (performance.now() - start) / dur)
    const frameY = interp(p)
    const lineGen = d3Line()
      .x((d, i) => x(d.t))
      .y((d, i) => y(frameY.slice(frameY.length - ns.length)[i]))
      .curve(curveMonotoneX)
      .context(ctx)
    ctx.clearRect(0, 0, props.width, props.height)
    ctx.save()
    ctx.lineWidth = props.lineWidth
    ctx.strokeStyle = getComputedStyle(cv.value).color || '#ddd'
    ctx.beginPath()
    lineGen(ns)
    ctx.stroke()
    ctx.restore()
    if (p >= 1) { anim.stop(); anim = null; lastY = ns.map(d => d.p) }
  })
})

// ⭐ 窗口切换：做 x 轴缩放动画（即使数据没变，也有即时反馈）
watch(() => props.rescaleKey, () => {
  animateRescale(props.series || [])
})
</script>

<style scoped>
.spark-wrap { position: relative; width: 100%; height: 100%; }
.spark-canvas { display: block; width: 100%; height: 100%; color: var(--el-text-color-secondary, #cfd3dc); }
.tooltip {
  position: absolute; top: -28px; padding: 4px 8px; font-size: 12px;
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color-overlay, #1f1f1f);
  color: var(--el-text-color-regular, #e5eaf3);
  border-radius: 4px; pointer-events: none; white-space: nowrap; transform: translateX(-50%);
  box-shadow: var(--el-box-shadow-light);
}
</style>
