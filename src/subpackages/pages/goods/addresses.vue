<script setup>
import Layout from "@/layout/index.vue"
import { ref, reactive, onMounted, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useRouter } from 'uni-mini-router'

const router = useRouter()

// 加载状态
const loading = ref(true)

// 是否从订单确认页跳转来的标志
const isFromOrder = ref(false)

// 地址列表
const addresses = ref([
  {
    id: 1,
    name: '刘长运',
    phone: '180****6820',
    address: '庄市大道8号同心苑小区',
    isDefault: true
  },
  {
    id: 2,
    name: '林晓芳',
    phone: '139****2345',
    address: '龙华新区民治大道1099号中央原著小区A栋2单元',
    isDefault: false
  }
])

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
const setDefault = (address) => {
  addresses.value.forEach(item => {
    item.isDefault = item.id === address.id
  })
  
  closeAllSliding()
  
  uni.showToast({
    title: '设为默认地址成功',
    icon: 'success'
  })
}

// 删除地址
const deleteAddress = (address, index) => {
  uni.showModal({
    title: '删除地址',
    content: '确定要删除此地址吗？',
    success: (res) => {
      if (res.confirm) {
        addresses.value.splice(index, 1)
        
        // 如果删除的是默认地址且还有其他地址，则设置第一个为默认
        if (address.isDefault && addresses.value.length > 0) {
          addresses.value[0].isDefault = true
        }
        
        closeAllSliding()
        
        uni.showToast({
          title: '删除成功',
          icon: 'success'
        })
      }
    }
  })
}

// 编辑地址
const editAddress = (address) => {
  currentAddress.value = { ...address }
  editMode.value = true
  closeAllSliding()
}

// 新增地址
const addNewAddress = () => {
  showAddressForm.value = true
}

// 保存地址（编辑或新增）
const saveAddress = () => {
  // 模拟保存地址
  setTimeout(() => {
    if (editMode.value && currentAddress.value) {
      // 更新已有地址
      const index = addresses.value.findIndex(item => item.id === currentAddress.value.id)
      if (index !== -1) {
        addresses.value[index] = { ...currentAddress.value }
        
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
      
      uni.showToast({
        title: '保存成功',
        icon: 'success'
      })
    } else if (showAddressForm.value) {
      // 添加新地址
      const newId = Math.max(...addresses.value.map(item => item.id), 0) + 1
      
      const addressObj = {
        id: newId,
        name: newAddress.name,
        phone: newAddress.phone,
        address: `${newAddress.region} ${newAddress.detailAddress}`,
        isDefault: newAddress.isDefault
      }
      
      addresses.value.push(addressObj)
      
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
      
      uni.showToast({
        title: '添加成功',
        icon: 'success'
      })
    }
  }, 500)
}

// 选择地址（从订单确认页进入时）
const selectAddress = (address) => {
  if (!isFromOrder.value) return
  
  // 将选中的地址传回订单确认页
  uni.navigateBack({
    success: () => {
      // 实际项目中可能需要通过事件通信或存储来传递数据
      console.log('选择地址:', address)
    }
  })
}

// 选择地区
const chooseRegion = () => {
  uni.showToast({
    title: '选择区域功能开发中',
    icon: 'none'
  })
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

onLoad((options) => {
  // 判断是否从订单确认页跳转来
  if (options && options.from === 'order') {
    isFromOrder.value = true
  }
  
  // 模拟加载数据
  setTimeout(() => {
    loading.value = false
  }, 500)
})
</script>

<template>
  <layout>
    <template #center>
      <view class="text-32rpx font-medium text-#333">地址管理</view>
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
                <text class="text-28rpx text-gray-400">{{ 
                  editMode ? (currentAddress.address.split(' ')[0] || '请选择') : 
                  (newAddress.region || '请选择所在地区') 
                }}</text>
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
              @tap="saveAddress"
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
              :style="{ 
                animationDelay: `${index * 0.1}s`,
                transform: slidingIndex === index ? 'translateX(-180rpx)' : 'translateX(0)',
                transition: 'transform 0.3s ease-out'
              }"
              @tap="selectAddress(address)"
              @touchstart="closeAllSliding"
              @touchend="handleSlide(index)"
            >
              <!-- 地址卡片内容 -->
              <view class="p-30rpx">
                <view class="flex items-center mb-15rpx">
                  <view class="flex-1">
                    <text class="text-30rpx font-medium mr-15rpx">{{ address.name }}</text>
                    <text class="text-30rpx">{{ address.phone }}</text>
                  </view>
                  <view v-if="address.isDefault" class="px-12rpx py-4rpx bg-pink-50 rounded-6rpx">
                    <text class="text-22rpx text-#f43f5e">默认</text>
                  </view>
                </view>
                <view class="text-28rpx text-gray-600">{{ address.address }}</view>
              </view>
              
              <!-- 底部编辑栏 -->
              <view class="px-30rpx py-20rpx flex justify-between items-center border-t border-gray-100">
                <view class="flex items-center" @tap.stop="setDefault(address)">
                  <view class="w-36rpx h-36rpx rounded-full border-2 border-gray-300 flex items-center justify-center mr-10rpx" :class="{ 'bg-#f43f5e border-#f43f5e': address.isDefault }">
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
          <view v-else class="h-300rpx flex flex-col items-center justify-center">
            <WdIcon name="location-off" size="80rpx" custom-style="color:#ddd" class="mb-20rpx"/>
            <text class="text-28rpx text-gray-400">暂无收货地址</text>
          </view>
        </view>
      </template>
    </view>
    
    <!-- 底部添加按钮 -->
    <view v-if="!editMode && !showAddressForm" class="fixed bottom-0 left-0 right-0 p-30rpx bg-white border-t border-gray-100 z-50">
      <view 
        class="h-90rpx rounded-full bg-gradient-to-r from-#f43f5e to-#ff7676 flex items-center justify-center shadow-md shadow-pink-200 transform transition-all duration-300 active-scale active-shadow"
        @tap="addNewAddress"
      >
        <WdIcon name="plus" size="32rpx" color="#fff" class="mr-10rpx"/>
        <text class="text-30rpx text-white">新增收货地址</text>
      </view>
    </view>
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
