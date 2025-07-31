<template>
    <div style="margin-top: 48px;">
      <div ref="pieChart" style="width: 400px; height: 300px; display: inline-block;"></div>
      <div ref="barChart" style="width: 400px; height: 300px; display: inline-block; margin-left: 32px;"></div>
      <div ref="roiChart" style="width: 800px; height: 300px; margin-top: 32px;"></div>
    </div>
  </template>
  
  <script setup>
  import { io } from "socket.io-client";
  import { ref, onMounted, onUnmounted, watch } from "vue";
  import * as echarts from "echarts";
  
  const pieData = ref(null);
  const barData = ref(null);
  const roiData = ref(null);
  
  let socket;
  
  onMounted(() => {
    socket = io("http://localhost:3000");
    socket.on('analysisUpdate', (data) => {
      console.log('收到分析数据', data);
      pieData.value = data.pieData;
      barData.value = data.barData;
      roiData.value = data.roiData;
    });
  });
  
  onUnmounted(() => {
    if (socket) socket.disconnect();
  });
  
  const pieChart = ref(null);
  const barChart = ref(null);
  const roiChart = ref(null);
  
  watch(pieData, (val) => {
    if (val && pieChart.value) {
      const chart = echarts.init(pieChart.value);
      chart.setOption({
        title: { text: 'Asset Distribution', left: 'center' },
        tooltip: { trigger: 'item' },
        series: [{
          type: 'pie',
          radius: '50%',
          data: val,
          emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.5)' } }
        }]
      });
    }
  });
  watch(barData, (val) => {
    if (val && barChart.value) {
      const chart = echarts.init(barChart.value);
      chart.setOption({
        title: { text: 'Revenue Bar Chart', left: 'center' },
        tooltip: {},
        xAxis: { type: 'category', data: val.map(i => i.name) },
        yAxis: { type: 'value' },
        series: [{ type: 'bar', data: val.map(i => i.value) }]
      });
    }
  });
  watch(roiData, (val) => {
    if (val && roiChart.value) {
      const chart = echarts.init(roiChart.value);
      chart.setOption({
        title: { text: 'ROI Trend', left: 'center' },
        tooltip: {},
        xAxis: { type: 'category', data: val.map(i => i.date) },
        yAxis: { type: 'value' },
        series: [{ type: 'line', data: val.map(i => i.value) }]
      });
    }
  });
  </script>