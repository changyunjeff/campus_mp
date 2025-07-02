import {defineStore} from 'pinia'
import {AuthApi} from '@/api/auth'
import { useConnection } from '@/composables/connection'
import {useMessage} from "@/composables/message";
import DefaultAvatar from "/static/images/user.png"
import {gradeText, gradeOptions} from "@/configs/grade.config"

export const useUserStore = defineStore('user', () => {

    const openid = ref('')
    const avatar = reactive({
        url: '',
        object_key: '',
        type: ''
    })
    const nickname = ref('')
    const gender = ref(0)
    const grade = ref(0)
    const college = ref('')

    const setNickname = (_nickname) => {
        nickname.value = _nickname
    }
    const getNickname = () => {
        return nickname.value || '未知用户'
    }

    const setGrade = (_grade) => {
        grade.value = _grade
    }
    const getGrade = () => {
        return grade.value
    }

    const setCollege = (_college) => {
        college.value = _college
    }
    const getCollege = () => {
        return college.value
    }

    /**
     * setGender
     * @param {number} _gender 1:男 2:女
     * */
    const setGender = (_gender) => {
        gender.value = _gender
    }

    const getGender = () => {
        return gender.value
    }

    const genderDisplayText = ()=>{
        switch (gender.value) {
            case 1:
                return '男'
            case 2:
                return '女'
            default:
                return '未知'
        }
    }

    /** setAvatar 设置头像
     * 使用方法
     * setAvatar({
     *   url: 'https://example.com/avatar.png',
     *   object_key: 'avatar.png',
     *   type: 'image/png'
     * })
     * */
    const setAvatar = (_avatar) => {
        console.debug("设置头像:", _avatar)
        Object.assign(avatar, _avatar)
    }

    // 获取头像
    const getAvatarUrl = () => {
        console.debug("获取头像url...")
        if (!avatar.url) {
            console.debug("头像为空，使用默认头像")
        }
        return avatar.url || DefaultAvatar
    }

    // 获取头像的object key
    const getAvatarObjectKey = () => {
        return avatar.object_key || ''
    }

    const login = async ()=>{
        try {
            const {code} = await uni.login({
                provider: 'weixin',
            })
            if (!code) {
                throw new Error('获取code失败')
            }
            // 在每次登录前先删除旧的access token，因为每次登录都会生成新的access token和refresh token
            const res = await AuthApi.login(code)
            openid.value = res.openid
            // 连接WebSocket
            const connection = useConnection()
            // 启用重连机制
            connection.enableReconnect()
            await connection.connect()
            // 注册消息处理函数
            const message = useMessage()
            message.registerHandlers()
            return res
        } catch (err) {
            console.log(err)
            throw err
        }
    }

    /**
     * getAnonymousNickname 获得匿名昵称
     * @param {number} _grade 年级
     * @param {string} _college 学院
     * @param {number} _gender 性别
     * @returns {string} 匿名昵称
     * */
    const getAnonymousNickname = (_grade=0, _college='', _gender=0) => {
        const grade_ = gradeText[_grade || grade.value]
        const college_ = _college || college.value || '未知学院'
        const tmp_gender = (_gender || gender.value) & 3;

        let gender_ = ''
        switch(tmp_gender) {
            case 1: gender_ = '男生'; break;
            case 2: gender_ = '女生'; break
            default: gender_ =  '未知'; break;
        }

        return `${grade_}${college_}${gender_}`
    }

    return {
        openid,
        avatar,
        nickname,
        gender,
        login,
        setNickname,
        getNickname,
        setGrade,
        getGrade,
        setCollege,
        getCollege,
        setAvatar,
        getAvatarUrl,
        getAvatarObjectKey,
        setGender,
        getGender,
        genderDisplayText,
        getAnonymousNickname,
    }
}, {
    persist: {
        key: 'user',
        paths: ['openid', 'avatar', 'nickname', 'gender'],
        storage: {
            getItem: uni.getStorageSync,
            setItem: uni.setStorageSync,
        }
    }
})