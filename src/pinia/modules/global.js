import {defineStore} from 'pinia'

export const useGlobalStore = defineStore('global', () => {
    const statusBarHeight = ref(0)
    const setStatusBarHeight = (height) => {
        statusBarHeight.value = height
    }
    return {
        statusBarHeight,
        setStatusBarHeight
    }
})