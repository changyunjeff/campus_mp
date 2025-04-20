export const useToast = () => {
    return {
        show: (msg)=>{
            uni.showToast({
                title: msg,
                icon: 'none',
                duration: 2000,
            })
        },
        error: (msg)=>{
            uni.showToast({
                title: msg,
                icon: 'error',
                duration: 2000,
            }) 
        },
        succsee: (msg)=>{
            uni.showToast({
                title: msg,
                icon: 'success',
                duration: 2000,
            })
        },
    }
}