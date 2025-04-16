let instance = null

export function useTabbar() {
    if (instance) {
        return instance 
    }
    const selected = ref(0)
    const hiddened = ref(false)

    const setSelected = (now) => {
        selected.value = now
    }

    const show = () => {
        hiddened.value = false
    }

    const hide = () => {
        hiddened.value = true 
    }

    instance = {
        selected,
        hiddened,
        setSelected,
        show,
        hide,
    }

    return instance
}