<script setup>
import Layout from "@/layout/index.vue"
import {ref, reactive, onMounted, computed} from 'vue'
import {onLoad, onPullDownRefresh, onReachBottom} from '@dcloudio/uni-app'
import {useRouter} from 'uni-mini-router'
import {GoodsApi} from "@/api/goods";
import {debounce} from "lodash";
import {useToast} from "@/composables/toast";
import RegionPicker from "@/components/RegionPicker.vue";

const router = useRouter()
const toast = useToast()

// 加载状态
const loading = ref(false)

// 是否从订单确认页跳转来的标志
const isFromOrder = ref(false)

// 地址列表
const addresses = ref([])

// 编辑地址状态
const editMode = ref(false)
const currentAddress = ref(null)

// 新增地址状态
const showAddressForm = ref(false)
const newAddress = reactive({
  name: '',
  phone: '',
  region: '',
  detailAddress: '',
  isDefault: false
})

// 滑动操作相关
const slidingIndex = ref(-1)

// 计算属性替代v-model中的三元表达式
const nameValue = computed({
  get: () => editMode.value ? currentAddress.value.name : newAddress.name,
  set: (val) => {
    if (editMode.value) {
      currentAddress.value.name = val
    } else {
      newAddress.name = val
    }
  }
})

const phoneValue = computed({
  get: () => editMode.value ? currentAddress.value.phone : newAddress.phone,
  set: (val) => {
    if (editMode.value) {
      currentAddress.value.phone = val
    } else {
      newAddress.phone = val
    }
  }
})

const addressDetailValue = computed({
  get: () => {
    if (editMode.value) {
      return currentAddress.value.address.split(' ')[1] || currentAddress.value.address
    }
    return newAddress.detailAddress
  },
  set: (val) => {
    if (editMode.value) {
      const region = currentAddress.value.address.split(' ')[0] || ''
      currentAddress.value.address = region ? `${region} ${val}` : val
    } else {
      newAddress.detailAddress = val
    }
  }
})

const isDefaultValue = computed({
  get: () => editMode.value ? currentAddress.value.isDefault : newAddress.isDefault,
  set: (val) => {
    if (editMode.value) {
      currentAddress.value.isDefault = val
    } else {
      newAddress.isDefault = val
    }
  }
})

// 关闭所有滑动项
const closeAllSliding = () => {
  slidingIndex.value = -1
}

// 处理滑动动作
const handleSlide = (index) => {
  if (slidingIndex.value === index) {
    slidingIndex.value = -1
  } else {
    slidingIndex.value = index
  }
}

// 设置默认地址
const setDefault = debounce(async (address) => {

  if (loading.value) return

  const id = address.id || ''
  if (!id) {
    toast.show('地址id不存在')
    return
  }

  try {
    loading.value = true
    // 更新服务器数据
    await GoodsApi.setDefaultAddress(id)
    // 更新本地数据
    addresses.value.forEach(item => {
      item.isDefault = item.id === address.id
    })

    closeAllSliding()

    toast.show('设为默认地址成功')
  } catch (err) {
    console.error(err)
    toast.show('设为默认地址失败')
  } finally {
    loading.value = false
  }
}, 500)

// 删除地址
const deleteAddress = debounce((address, index) => {
  uni.showModal({
    title: '删除地址',
    content: '确定要删除此地址吗？',
    success: async (res) => {
      if (res.confirm) {
        loading.value = true
        try {
          await GoodsApi.deleteAddress(address.id)

          addresses.value.splice(index, 1)

          // 如果删除的是默认地址且还有其他地址，则设置第一个为默认
          if (address.isDefault && addresses.value.length > 0) {
            addresses.value[0].isDefault = true
            await GoodsApi.setDefaultAddress(addresses.value[0].id)
          }

          closeAllSliding()

          toast.show('删除成功')
        } catch (err) {
          console.error(err)
          toast.show('删除失败')
        } finally {
          loading.value = false
        }
      }
    }
  })
}, 500)

// 编辑地址
const editAddress = debounce(async (address) => {
  if (loading.value) return

  try {
    loading.value = true
    await GoodsApi.updateAddress(address.id, address.name, address.phone, address.region, address.address, address.isDefault)
    currentAddress.value = {...address}
    editMode.value = true
    closeAllSliding()
  } catch(err) {
    console.error(err)
    toast.show('保存失败')
  } finally {
    loading.value = false
  }
}, 500)

// 新增地址
const addNewAddress = () => {
  showAddressForm.value = true
}

// 保存地址（编辑或新增）
const saveAddress = debounce(async () => {
  if (loading.value) return

  try {
    loading.value = true
    if (editMode.value && currentAddress.value) {
      // 更新已有地址
      const res = await GoodsApi.updateAddress(currentAddress.value.id, currentAddress.value.name, currentAddress.value.phone, currentAddress.value.region, currentAddress.value.address, currentAddress.value.isDefault)
      // 更新已有地址
      const index = addresses.value.findIndex(item => item.id === currentAddress.value.id)
      if (index !== -1) {
        addresses.value[index] = {...currentAddress.value}

        // 如果设为默认地址，更新其他地址状态
        if (currentAddress.value.isDefault) {
          addresses.value.forEach((item, i) => {
            if (i !== index) {
              item.isDefault = false
            }
          })
        }
      }

      editMode.value = false
      currentAddress.value = null

      toast.show('保存成功')
    } else {
      // 新增地址
      const res = await GoodsApi.createAddress(newAddress.name, newAddress.phone, newAddress.region, newAddress.detailAddress, newAddress.isDefault)
      const newId = res.id
      const newAddressObj = {
        id: newId,
        name: newAddress.name,
        phone: newAddress.phone,
        region: newAddress.region,
        address: newAddress.detailAddress,
        isDefault: newAddress.isDefault
      }
      addresses.value.push(newAddressObj)

      // 如果设为默认地址，更新其他地址状态
      if (newAddress.isDefault) {
        addresses.value.forEach(item => {
          if (item.id !== newId) {
            item.isDefault = false
          }
        })
      }

      // 重置表单
      Object.assign(newAddress, {
        name: '',
        phone: '',
        region: '',
        detailAddress: '',
        isDefault: false
      })

      showAddressForm.value = false
      toast.show('保存成功')
    }
  } catch (err) {
    console.error(err)
    toast.show('保存失败')
  } finally {
    loading.value = false
  }
}, 500)

// 选择地址（从订单确认页进入时）
const selectAddress = (address) => {
  if (!isFromOrder.value) return

  // 显示选择成功的提示
  uni.showToast({
    title: '地址选择成功',
    icon: 'success',
    duration: 1500
  })
  
  // 延迟一点时间再返回，让用户看到选择反馈
  setTimeout(() => {
    router.back()

    // 从全局变量中获取回调函数
    const app = getApp()
    const callback = app.globalData?.addressSelectCallback
    if (typeof callback === 'function') {
      callback(address)
      // 清除回调函数
      app.globalData.addressSelectCallback = null
    }
  }, 800)
}

// 地区选择器状态
const showRegionPicker = ref(false)

// 选择地区
const chooseRegion = () => {
  showRegionPicker.value = true
}

// 处理地区选择确认
const handleRegionConfirm = (result) => {
  console.log('选择的地区:', result)
  
  const regionText = result.text
  
  if (editMode.value && currentAddress.value) {
    // 更新当前地址的地区部分
    const detailAddress = currentAddress.value.address.split(' ').slice(1).join(' ')
    currentAddress.value.address = `${regionText} ${detailAddress}`
    currentAddress.value.region = regionText
  } else {
    newAddress.region = regionText
  }
  
  toast.show('地区选择成功')
}

// 取消地区选择
const handleRegionCancel = () => {
  console.log('取消地区选择')
}

// 取消编辑/新增
const cancelEdit = () => {
  if (editMode.value) {
    editMode.value = false
    currentAddress.value = null
  } else if (showAddressForm.value) {
    showAddressForm.value = false
    // 重置表单
    Object.assign(newAddress, {
      name: '',
      phone: '',
      region: '',
      detailAddress: '',
      isDefault: false
    })
  }
}

const page = ref(1)
const pageSize = ref(10)
const hasMore = ref(true)

const fetchAddresses = debounce(async (loadingMore=false) => {
  if (loading.value || !hasMore.value) return
  try {
    loading.value = true
    const res = await GoodsApi.getAddresses(page.value, pageSize.value)
    res.list.map(item => {
      item.isDefault = item.is_default
    })
    if (loadingMore) {
      addresses.value.push(...res.list || [])
      page.value++
    } else {
      addresses.value = res.list || []
      page.value = 1
    }
    hasMore.value = addresses.value.length < res.total
  } catch (err) {
    console.error(err)
    toast.show('加载失败')
  } finally {
    loading.value = false
  }
}, 500)

onLoad((options) => {
  console.debug('options:', options)

  // 判断是否从订单确认页跳转来
  if (options && options.from === 'order') {
    isFromOrder.value = true
  }

  fetchAddresses(false)
})

onPullDownRefresh(()=>{
  console.debug('下拉刷新')
  fetchAddresses(false)
  uni.stopPullDownRefresh()
})

onReachBottom(()=>{
  console.debug('触底加载更多')
  fetchAddresses(true)
})
</script>

<template>
  <layout>
    <template #center>
      <view class="text-32rpx font-medium text-#333">
        {{ isFromOrder ? '选择收货地址' : '地址管理' }}
      </view>
    </template>

    <view class="bg-#f8f8f8 min-h-100vh">
      <!-- 加载中 -->
      <view v-if="loading" class="w-full h-100vh flex items-center justify-center">
        <WdIcon name="loading" size="60rpx" custom-style="color:#f43f5e" class="animate-spin"/>
      </view>

      <template v-else>
        <!-- 地址编辑表单 -->
        <view v-if="editMode || showAddressForm" class="bg-white px-30rpx animate-slide-up">
          <view class="py-30rpx border-b border-gray-100">
            <view class="text-30rpx font-medium text-#333 mb-30rpx">{{ editMode ? '编辑地址' : '新增地址' }}</view>

            <!-- 联系人 -->
            <view class="mb-30rpx">
              <view class="text-28rpx text-gray-700 mb-15rpx">联系人</view>
              <input
                  v-model="nameValue"
                  class="w-full h-90rpx px-20rpx bg-gray-50 rounded-12rpx text-28rpx"
                  placeholder="请输入收货人姓名"
              />
            </view>

            <!-- 手机号码 -->
            <view class="mb-30rpx">
              <view class="text-28rpx text-gray-700 mb-15rpx">手机号码</view>
              <input
                  v-model="phoneValue"
                  class="w-full h-90rpx px-20rpx bg-gray-50 rounded-12rpx text-28rpx"
                  placeholder="请输入手机号码"
                  type="number"
                  maxlength="11"
              />
            </view>

            <!-- 所在地区 -->
            <view class="mb-30rpx">
              <view class="text-28rpx text-gray-700 mb-15rpx">所在地区</view>
              <view
                  class="w-full h-90rpx px-20rpx bg-gray-50 rounded-12rpx flex items-center justify-between"
                  @tap="chooseRegion"
              >
                <text class="text-28rpx" :class="[
                    editMode ? (currentAddress?.region || currentAddress?.address?.split(' ')[0] ? 'text-gray-700' : 'text-gray-400') :
                        (newAddress.region ? 'text-gray-700' : 'text-gray-400')
                  ]">{{
                    editMode ? (currentAddress?.region || currentAddress?.address?.split(' ')[0] || '请选择所在地区') :
                        (newAddress.region || '请选择所在地区')
                  }}
                </text>
                <WdIcon name="chevron-right" size="28rpx" custom-style="color:#ccc"/>
              </view>
            </view>

            <!-- 详细地址 -->
            <view class="mb-30rpx">
              <view class="text-28rpx text-gray-700 mb-15rpx">详细地址</view>
              <textarea
                  v-model="addressDetailValue"
                  class="w-full p-20rpx bg-gray-50 rounded-12rpx text-28rpx"
                  placeholder="请输入详细地址"
                  style="height: 120rpx"
              />
            </view>

            <!-- 设为默认 -->
            <view class="flex items-center">
              <switch
                  :checked="isDefaultValue"
                  @change="isDefaultValue = !isDefaultValue"
                  color="#f43f5e"
                  class="transform scale-80 origin-left"
              />
              <text class="text-28rpx text-gray-700 ml-10rpx">设为默认收货地址</text>
            </view>
          </view>

          <!-- 操作按钮 -->
          <view class="py-30rpx flex">
            <view
                class="flex-1 h-90rpx rounded-full border border-gray-300 flex items-center justify-center mr-20rpx"
                @tap="cancelEdit"
            >
              <text class="text-30rpx text-gray-700">取消</text>
            </view>
            <view
                class="flex-1 h-90rpx rounded-full bg-gradient-to-r from-#f43f5e to-#ff7676 flex items-center justify-center shadow-md shadow-pink-200 transform transition-all duration-300 active-scale active-shadow"
                @tap.stop="saveAddress"
            >
              <text class="text-30rpx text-white">保存</text>
            </view>
          </view>
        </view>

        <!-- 地址列表 -->
        <view v-else>
          <view v-if="addresses.length > 0" class="px-30rpx pb-30rpx">
            <view
                v-for="(address, index) in addresses"
                :key="address.id"
                class="mt-20rpx rounded-16rpx bg-white overflow-hidden relative animate-fade-in"
                :class="{ 'ring-2 ring-pink-200': isFromOrder }"
                :style="{
                animationDelay: `${index * 0.1}s`,
                transform: slidingIndex === index ? 'translateX(-180rpx)' : 'translateX(0)',
                transition: 'transform 0.3s ease-out'
              }"
                @tap.stop="selectAddress(address)"
            >
              <!-- 地址卡片内容 -->
              <view class="p-30rpx">
                <view class="flex items-center mb-15rpx">
                  <view class="flex-1">
                    <text class="text-30rpx font-medium mr-15rpx">{{ address.name }}</text>
                    <text class="text-30rpx">{{ address.phone }}</text>
                  </view>
                  <view class="flex items-center">
                    <view v-if="address.isDefault" class="px-12rpx py-4rpx bg-pink-50 rounded-6rpx mr-10rpx">
                      <text class="text-22rpx text-#f43f5e">默认</text>
                    </view>
                    <view v-if="isFromOrder" class="px-12rpx py-4rpx bg-blue-50 rounded-6rpx">
                      <text class="text-22rpx text-blue-500">点击选择</text>
                    </view>
                  </view>
                </view>
                <view class="text-28rpx text-gray-600">{{ address.address }}</view>
              </view>

              <!-- 底部编辑栏 -->
              <view class="px-30rpx py-20rpx flex justify-between items-center border-t border-gray-100">
                <view class="flex items-center" @tap.stop="setDefault(address)">
                  <view
                      class="w-36rpx h-36rpx rounded-full border-2 border-gray-300 flex items-center justify-center mr-10rpx"
                      :class="{ 'bg-#f43f5e border-#f43f5e': address.isDefault }">
                    <WdIcon v-if="address.isDefault" name="check" size="24rpx" color="#fff"/>
                  </view>
                  <text class="text-26rpx text-gray-600">设为默认</text>
                </view>
                <view class="flex items-center">
                  <view class="flex items-center mr-30rpx" @tap.stop="editAddress(address)">
                    <WdIcon name="edit" size="28rpx" custom-style="color:#999" class="mr-8rpx"/>
                    <text class="text-26rpx text-gray-600">编辑</text>
                  </view>
                  <view class="flex items-center" @tap.stop="deleteAddress(address, index)">
                    <WdIcon name="delete" size="28rpx" custom-style="color:#999" class="mr-8rpx"/>
                    <text class="text-26rpx text-gray-600">删除</text>
                  </view>
                </view>
              </view>

              <!-- 滑动操作区 -->
              <view class="absolute top-0 right-0 flex h-full transform translate-x-full" style="width: 180rpx;">
                <view
                    class="flex-1 bg-blue-500 flex items-center justify-center"
                    @tap.stop="editAddress(address)"
                >
                  <text class="text-28rpx text-white">编辑</text>
                </view>
                <view
                    class="flex-1 bg-red-500 flex items-center justify-center"
                    @tap.stop="deleteAddress(address, index)"
                >
                  <text class="text-28rpx text-white">删除</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 无地址提示 -->
          <view v-else class="px-30rpx">
            <view v-if="isFromOrder" class="mt-40rpx">
              <!-- 从订单页面进入时的特殊引导 -->
              <view class="bg-white rounded-16rpx p-40rpx text-center">
                <view class="flex items-center justify-center w-120rpx h-120rpx bg-pink-50 rounded-full mx-auto mb-30rpx">
                  <WdIcon name="location" size="60rpx" custom-style="color:#f43f5e"/>
                </view>
                <view class="text-32rpx font-medium text-#333 mb-15rpx">还没有收货地址</view>
                <view class="text-26rpx text-gray-500 mb-40rpx">请先添加收货地址，方便为您配送商品</view>
                <view 
                  class="h-90rpx rounded-full bg-gradient-to-r from-#f43f5e to-#ff7676 flex items-center justify-center shadow-md shadow-pink-200"
                  @tap="addNewAddress"
                >
                  <WdIcon name="plus" size="32rpx" color="#fff" class="mr-10rpx"/>
                  <text class="text-30rpx text-white font-medium">立即添加地址</text>
                </view>
              </view>
            </view>
            <view v-else class="h-300rpx flex flex-col items-center justify-center">
              <WdIcon name="location-off" size="80rpx" custom-style="color:#ddd" class="mb-20rpx"/>
              <text class="text-28rpx text-gray-400">暂无收货地址</text>
            </view>
          </view>
        </view>
      </template>
    </view>

    <!-- 底部添加按钮 -->
    <view v-if="!editMode && !showAddressForm && !(isFromOrder && addresses.length === 0)"
          class="fixed bottom-0 left-0 right-0 p-30rpx bg-white border-t border-gray-100 z-50">
      <view
          class="h-90rpx rounded-full bg-gradient-to-r from-#f43f5e to-#ff7676 flex items-center justify-center shadow-md shadow-pink-200 transform transition-all duration-300 active-scale active-shadow"
          @tap.stop="addNewAddress"
      >
        <WdIcon name="plus" size="32rpx" color="#fff" class="mr-10rpx"/>
        <text class="text-30rpx text-white">新增收货地址</text>
      </view>
    </view>

    <!-- 地区选择器 -->
    <RegionPicker
        v-model:show="showRegionPicker"
        :value="editMode ? (currentAddress?.region || '') : newAddress.region"
        @confirm="handleRegionConfirm"
        @cancel="handleRegionCancel"
    />
  </layout>
</template>

<style scoped>
/* 动画效果 */
.animate-fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

.animate-slide-up {
  animation: slideUp 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 激活按钮时的动画效果 */
.active-scale:active {
  transform: scale(0.98);
}

.active-shadow:active {
  box-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.05);
}
</style>
