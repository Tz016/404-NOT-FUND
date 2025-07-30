<template>
  <div ref="chart" class="chart-container"></div>
</template>

<script setup>
import * as d3 from "d3";
import { ref, onMounted, watch } from "vue";

const props = defineProps({
  balance: { type: Number, required: true },
  assets: { type: Array, required: true }
});

const chart = ref(null);

const renderChart = () => {
  // 数据准备
  const clean = (v) => (v == null ? 0 : parseFloat(v));
  const items = props.assets
    .filter(a => a && a.symbol != null)
    .map(a => ({
      name: a.symbol,
      cost: clean(a.total_cost),
      value: clean(a.market_value),
      change: clean(a.tot_gain_unrl_amt)
    }));

  const totalAssetsValue = d3.sum(items, d => d.value);
  const totalAssetsCost  = d3.sum(items, d => d.cost);
  const totalAllNow = props.balance + totalAssetsValue;

  // 尺寸
  const width = 500, height = 500;
  const cx = width / 2, cy = height / 2;
  const outerRadius = Math.min(width, height) / 2 - 16;
  const innerRing = 110;
  const gap = 8;
  const rMin = 46;
  const rMax = innerRing - gap;

  // Balance 半径按面积占比
  const pBalance = totalAllNow > 0 ? props.balance / totalAllNow : 0;
  const rBalance = rMin + (rMax - rMin) * Math.sqrt(Math.max(0, Math.min(1, pBalance)));

  // 清空重绘
  d3.select(chart.value).selectAll("*").remove();

  const svg = d3.select(chart.value)
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const defs = svg.append("defs");

  // 发光滤镜给 Balance
  const glow = defs.append("filter").attr("id", "gold-glow");
  glow.append("feGaussianBlur")
    .attr("stdDeviation", 3)
    .attr("result", "coloredBlur");
  const feMerge = glow.append("feMerge");
  feMerge.append("feMergeNode").attr("in", "coloredBlur");
  feMerge.append("feMergeNode").attr("in", "SourceGraphic");

  // Balance 渐变
  const grad = defs.append("radialGradient")
    .attr("id", "balance-grad")
    .attr("cx", "50%").attr("cy", "50%");
  grad.append("stop").attr("offset", "0%").attr("stop-color", "#ffe28a");
  grad.append("stop").attr("offset", "60%").attr("stop-color", "#ffd04b");
  grad.append("stop").attr("offset", "100%").attr("stop-color", "#ffb300");

  const g = svg.append("g").attr("transform", `translate(${cx}, ${cy})`);

  // Balance 圆
  const balanceCircle = g.append("circle")
    .attr("r", rBalance)
    .attr("fill", "url(#balance-grad)")
    .attr("filter", "url(#gold-glow)")
    .attr("stroke", "#ffd04b")
    .attr("stroke-opacity", 0.35)
    .attr("stroke-width", 1.2);

  // 呼吸动画
  function breatheGrow() {
    balanceCircle.transition()
      .duration(1500)
      .ease(d3.easeSinInOut)
      .attr("r", rBalance + 5)
      .attr("stroke-opacity", 0.5)
      .on("end", breatheShrink);
  }
  function breatheShrink() {
    balanceCircle.transition()
      .duration(1500)
      .ease(d3.easeSinInOut)
      .attr("r", rBalance)
      .attr("stroke-opacity", 0.35)
      .on("end", breatheGrow);
  }
  breatheGrow();

  // Balance 中心文字
  g.append("text")
    .attr("text-anchor", "middle")
    .attr("y", -25)
    .attr("fill", "#ffffff")
    .attr("font-size", 13)
    .attr("opacity", 0.95)
    .text("Balance");

  const centerValue = g.append("text")
    .attr("text-anchor", "middle")
    .attr("y", 6)
    .attr("fill", "#fffbe6")
    .attr("font-weight", 800)
    .attr("font-size", 22)
    .attr("filter", "url(#gold-glow)");

  centerValue.transition()
    .duration(1200)
    .tween("text", () => {
      const i = d3.interpolateNumber(0, props.balance || 0);
      return t => centerValue.text(`$${d3.format(",.0f")(i(t))}`);
    });

  g.append("text")
    .attr("text-anchor", "middle")
    .attr("y", 36)
    .attr("fill", "#ffffff")
    .attr("font-size", 13)
    .attr("opacity", 0.95)
    .text(totalAllNow > 0 ? `${d3.format(".1%")(pBalance)} of total` : "");

  const warmColors = ["#FFD97D", "#FFC861", "#FFB84D"];   // 盈利
const coolColors = ["#7AB8FF", "#6A9CFF", "#A18CFF"];   // 亏损
const neutralColor = "#A0B7C4";                         // 盈亏0

// Base colors直接用你给的冷色系
const baseColors = [
  "#7aa7ff", "#4dd0e1", "#8c9eff",
  "#81c784", "#ba68c8", "#90a4ae",
  "#64b5f6", "#26c6da", "#9575cd"
];

const maxChange = d3.max(items, d => Math.abs(d.change)) || 1;

const color = d3.scaleOrdinal()
  .domain(items.map(d => d.name))
  .range(items.map((_, i) => {
    const d = items[i];
    const base = d3.color(baseColors[i % baseColors.length]);

    if (d.change > 0) {
      // 盈利越多，越亮（brighter 值更大）
      const factor = Math.min(1.2, 0.6 + (Math.abs(d.change) / maxChange) * 0.6);
      return base.brighter(factor).formatHex();
    } else if (d.change < 0) {
      // 亏损越多，越暗
      const factor = Math.min(1.2, 0.6 + (Math.abs(d.change) / maxChange) * 0.6);
      return base.darker(factor).formatHex();
    } else {
      return base.formatHex();
    }
  }));




  const pie = d3.pie().value(d => d.value).sort(null);
  const startData = items.map(d => ({ name: d.name, value: Math.max(0, d.cost) }));
  const endData   = items.map(d => ({ name: d.name, value: Math.max(0, d.value) }));

  const arcsStart = pie(startData);
  const arcsEnd   = pie(endData);
  const startByName = new Map(arcsStart.map(a => [a.data.name, a]));

  // 外圈绘制
  const arc = d3.arc()
    .innerRadius(innerRing)
    .outerRadius(outerRadius)
    .cornerRadius(5)
    .padAngle(0.007);

  const ring = g.append("g").attr("class", "asset-ring");

  const paths = ring.selectAll("path.slice")
  .data(arcsEnd, d => d.data.name)
  .join("path")
  .attr("class", "slice")
  .attr("fill", d => color(d.data.name))
  .attr("fill-opacity", 0.8)
  .attr("stroke", "#ffffff")
  .attr("stroke-opacity", 0.15)
  .attr("stroke-width", 1)
  .each(function(d) {
    const s = startByName.get(d.data.name);
    this._current = s || { startAngle: d.startAngle, endAngle: d.startAngle };
  })
  .on("mouseover", function (e, d) {
    d3.select(this).attr("stroke-opacity", 0.6);
    tooltip.style("visibility", "visible")
      .html(tooltipHtml(d.data.name));
  })
  .on("mousemove", (e) => {
    tooltip.style("top", `${e.pageY - 36}px`)
           .style("left", `${e.pageX + 14}px`);
  })
  .on("mouseout", function () {
    d3.select(this).attr("stroke-opacity", 0.2);
    tooltip.style("visibility", "hidden");
  });

  paths.each(function (d) {
  const datum = items.find(x => x.name === d.data.name);
  if (!datum || datum.change <= 0) return;

  // 盈利越多，发光越强
  const glowStrength = Math.min(6, 3 + (Math.abs(datum.change) / maxChange) * 3);

  d3.select(this)
    .style("filter", `drop-shadow(0px 0px ${glowStrength}px ${color(d.data.name)})`);
});

  // 动画：成本占比 -> 当前占比
  paths.transition()
    .duration(5500)
    .ease(d3.easeCircleInOut)
    .attrTween("d", function(d) {
      const i = d3.interpolateObject(this._current, d);
      this._current = i(1);
      return t => arc(i(t));
    })
    .on("end", function(d1, d2) {
      const datum = items.find(x => x.name === d2);
      if (!datum) return;
      const flash = datum.change > 0 ? "#9cff57" : (datum.change < 0 ? "#ff6e6e" : null);
      if (!flash) return;

      d3.select(this)
        .transition().duration(220).attr("fill", flash)
        .transition().duration(260).attr("fill", color(d2.data.name));
    });

  // 标签
  const labelArc = d3.arc()
  .innerRadius((innerRing + outerRadius) / 2)
  .outerRadius((innerRing + outerRadius) / 2);

// ring.selectAll("text.slice-label")
//   .data(arcsEnd, d => d.data.name)
//   .join("text")
//   .attr("class", "slice-label")
//   .attr("text-anchor", "middle")
//   .attr("font-size", 12)
//   .attr("fill", "#e6e6e6")
//   .attr("opacity", 0)
//   .attr("transform", d => `translate(${labelArc.centroid(d)})`)
//   .text(d => {
//     const datum = items.find(x => x.name === d.data.name);
//     if (!datum) return d.data.name;
//     const sign = datum.change > 0 ? "+" : "";
//     return `${datum.name} (${sign}${d3.format(",.0f")(datum.change)})`;
//   })
//   .transition()
//   .delay(800)
//   .duration(600)
//   .attr("opacity", 0.9);

const labels = ring.selectAll("g.slice-label")
  .data(arcsEnd, d => d.data.name)
  .join("g")
  .attr("class", "slice-label")
  .attr("transform", d => `translate(${labelArc.centroid(d)})`)
  .attr("opacity", 0);

labels.each(function (d) {
  const gLabel = d3.select(this);
  const datum = items.find(x => x.name === d.data.name);
  const sign = datum?.change > 0 ? "+" : "";
  const textContent = `${datum?.name || d.data.name} (${sign}${d3.format(",.0f")(datum?.change || 0)})`;

  // 加文字
  const text = gLabel.append("text")
    .attr("text-anchor", "middle")
    .attr("dy", "0.35em")
    .attr("fill", "#fff") // 纯白
    .attr("font-size", 15)
    .attr("font-weight", 600)
    .style("filter", "drop-shadow(0 0 3px rgba(0,0,0,0.9))") // 黑色描边光晕
    .text(textContent);

  // 动态获取文字尺寸
  const bbox = text.node().getBBox();

  // 背景矩形
  gLabel.insert("rect", "text")
    .attr("x", bbox.x - 4)
    .attr("y", bbox.y - 2)
    .attr("width", bbox.width + 8)
    .attr("height", bbox.height + 4)
    .attr("rx", 4) // 圆角
    .attr("ry", 4)
    .attr("fill", "rgba(0,0,0,0.33)"); // 半透明黑背景
});

labels.transition()
  .delay(800)
  .duration(600)
  .attr("opacity", 1);

  // Tooltip
  const tooltip = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("padding", "8px 10px")
    .style("background", "rgba(0,0,0,0.9)")
    .style("color", "#f5f5f5")
    .style("border", "1px solid #3a3a3a")
    .style("border-radius", "6px")
    .style("font-size", "12px")
    .style("pointer-events", "none")
    .style("box-shadow", "0 0 12px rgba(255,255,255,0.1)")
    .style("visibility", "hidden");

  function tooltipHtml(name) {
    const it = items.find(x => x.name === name);
    if (!it) return name;
    const pctCost  = totalAssetsCost > 0 ? it.cost  / totalAssetsCost  : 0;
    const pctValue = totalAssetsValue > 0 ? it.value / totalAssetsValue : 0;
    const fmt = d3.format(",.2f");
    const fp = d3.format(".1%");
    const changeColor = it.change > 0 ? "#9cff57" : it.change < 0 ? "#ff6e6e" : "#e6e6e6";
    return `
      <div style="font-weight:600;margin-bottom:4px;">${name}</div>
      <div>Cost: $${fmt(it.cost)} <span style="opacity:.7">(${fp(pctCost)})</span></div>
      <div>Now: $${fmt(it.value)} <span style="opacity:.7">(${fp(pctValue)})</span></div>
      <div style="margin-top:4px;color:${changeColor};">PnL: ${it.change >= 0 ? "+" : ""}$${fmt(it.change)}</div>
    `;
  }
};

onMounted(renderChart);
watch(() => [props.balance, props.assets], renderChart, { deep: true });
</script>

<style scoped>
.chart-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px;
}
</style>
