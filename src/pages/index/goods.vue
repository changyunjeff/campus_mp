<script setup>
import Layout from '@/layout/index.vue'
const { show } = useTabbar()

onMounted(() => {
    show()
})
</script>

<template>
    <layout>
        <custom-status-bar>
            
        </custom-status-bar>
        商品闲置
        <custom-tab-bar/>
    </layout>
</template>

<style scoped>
</style>