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
        个人中心
        <custom-tab-bar/>
    </layout>
</template>

<style scoped>
</style>