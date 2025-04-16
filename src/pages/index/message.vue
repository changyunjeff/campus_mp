<script setup>
import Layout from '@/layout/index.vue'

const { hiddened, show, hide } = useTabbar()

const switchShow = () => {
  console.log(hiddened.value)
  hiddened.value ? show() : hide()
}

onMounted(() => {
  show()
})
</script>

<template>
  <layout>
    <custom-status-bar>

    </custom-status-bar>
    我的消息
    <WdButton @tap="switchShow">切换显示TabBar</WdButton>
    <custom-tab-bar />
  </layout>
</template>

<style scoped></style>