<script setup>
import Layout from "@/layout/index.vue"
import { ref, reactive, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useRouter } from 'uni-mini-router'
import { GoodsApi } from '@/api/goods'
import { useToast } from '@/composables/toast'

const router = useRouter()
const toast = useToast()

// 加载状态
const loading = ref(false)
const saving = ref(false)
const verifying = ref(false)
const uploading = ref(false)

// 商家支付信息
const paymentInfo = reactive({
  id: '',
  merchant_name: '',
  merchant_id: '',
  api_key: '',
  cert_path: '',
  cert_object_key: '',
  bank_account: '',
  bank_name: '',
  account_holder: '',
  business_license: '',
  is_enabled: false,
  is_verified: false,
  created_at: 0,
  updated_at: 0
})

// 表单验证规则
const formValid = computed(() => {
  return paymentInfo.merchant_name.trim() &&
         paymentInfo.merchant_id.trim() &&
         paymentInfo.api_key.trim() &&
         paymentInfo.bank_account.trim() &&
         paymentInfo.bank_name.trim() &&
         paymentInfo.account_holder.trim() &&
         paymentInfo.business_license.trim()
})

// 银行列表（常用银行）
const bankList = [
  '中国工商银行',
  '中国农业银行', 
  '中国银行',
  '中国建设银行',
  '交通银行',
  '招商银行',
  '浦发银行',
  '中信银行',
  '光大银行',
  '华夏银行',
  '民生银行',
  '广发银行',
  '平安银行',
  '兴业银行',
  '其他银行'
]

// 密钥和账户脱敏显示
const maskedApiKey = computed(() => {
  if (!paymentInfo.api_key) return ''
  if (paymentInfo.api_key.length <= 8) return paymentInfo.api_key
  return paymentInfo.api_key.substring(0, 4) + '****' + paymentInfo.api_key.substring(paymentInfo.api_key.length - 4)
})

const maskedBankAccount = computed(() => {
  if (!paymentInfo.bank_account) return ''
  if (paymentInfo.bank_account.length <= 8) return paymentInfo.bank_account
  return paymentInfo.bank_account.substring(0, 4) + '****' + paymentInfo.bank_account.substring(paymentInfo.bank_account.length - 4)
})

// 获取商家支付信息
const loadPaymentInfo = async () => {
  if (loading.value) return

  try {
    loading.value = true
    const data = await GoodsApi.getMerchantPaymentInfo()
    
    if (data) {
      Object.assign(paymentInfo, {
        ...data,
        created_at: data.created_at,
        updated_at: data.updated_at
      })
    }
  } catch (error) {
    console.error('加载支付信息失败:', error)
    // 如果是第一次设置，不显示错误
    if (error.status !== 404) {
      toast.show('加载支付信息失败')
    }
  } finally {
    loading.value = false
  }
}

// 选择银行
const selectBank = () => {
  uni.showActionSheet({
    itemList: bankList,
    success: (res) => {
      if (res.tapIndex < bankList.length - 1) {
        paymentInfo.bank_name = bankList[res.tapIndex]
      } else {
        // 选择"其他银行"，弹出输入框
        uni.showModal({
          title: '输入银行名称',
          editable: true,
          placeholderText: '请输入银行名称',
          success: (res) => {
            if (res.confirm && res.content?.trim()) {
              paymentInfo.bank_name = res.content.trim()
            }
          }
        })
      }
    }
  })
}

// 上传支付证书
const uploadCertificate = () => {
  if (uploading.value) return

  uni.chooseMessageFile({
    count: 1,
    type: 'file',
    extension: ['p12', 'pem', 'crt'],
    success: async (res) => {
      const file = res.tempFiles[0]
      
      // 检查文件大小（限制5MB）
      if (file.size > 5 * 1024 * 1024) {
        toast.show('证书文件大小不能超过5MB')
        return
      }

      try {
        uploading.value = true
        uni.showLoading({ title: '上传中...' })

        const result = await GoodsApi.uploadPaymentCert(file.path, (progress)=>{
          console.log('上传进度:', progress)
        })
        
        if (result && result.url) {
          paymentInfo.cert_path = result.url
          paymentInfo.cert_object_key = result.object_key
          toast.show('证书上传成功')
        }

      } catch (error) {
        console.error('证书上传失败:', error)
        toast.show('证书上传失败，请重试')
      } finally {
        uploading.value = false
        uni.hideLoading()
      }
    },
    fail: (error) => {
      console.error('选择文件失败:', error)
      toast.show('选择文件失败')
    }
  })
}

// 验证支付配置
const verifyPaymentConfig = async () => {
  if (verifying.value || !formValid.value) return

  try {
    verifying.value = true
    uni.showLoading({ title: '验证中...' })

    const result = await GoodsApi.verifyMerchantPayment()
    
    if (result.is_valid) {
      paymentInfo.is_verified = true
      uni.showModal({
        title: '验证成功',
        content: '支付配置验证通过，可以正常使用微信支付功能',
        showCancel: false,
        confirmText: '我知道了'
      })
    } else {
      uni.showModal({
        title: '验证失败',
        content: result.message || '支付配置验证失败，请检查配置信息',
        showCancel: false,
        confirmText: '我知道了'
      })
    }

  } catch (error) {
    console.error('验证配置失败:', error)
    toast.show('验证失败，请重试')
  } finally {
    verifying.value = false
    uni.hideLoading()
  }
}

// 保存支付信息
const savePaymentInfo = async () => {
  if (saving.value || !formValid.value) return

  try {
    saving.value = true
    uni.showLoading({ title: '保存中...' })

    const params = {
      merchant_name: paymentInfo.merchant_name.trim(),
      merchant_id: paymentInfo.merchant_id.trim(),
      api_key: paymentInfo.api_key.trim(),
      cert_path: paymentInfo.cert_path,
      cert_object_key: paymentInfo.cert_object_key,
      bank_account: paymentInfo.bank_account.trim(),
      bank_name: paymentInfo.bank_name.trim(),
      account_holder: paymentInfo.account_holder.trim(),
      business_license: paymentInfo.business_license.trim(),
      is_enabled: paymentInfo.is_enabled
    }

    const result = await GoodsApi.updateMerchantPaymentInfo(params)
    
    if (result) {
      Object.assign(paymentInfo, {
        ...result,
        created_at: result.created_at * 1000,
        updated_at: result.updated_at * 1000
      })
      
      toast.show('保存成功')
      
      // 提示验证配置
      if (!paymentInfo.is_verified) {
        setTimeout(() => {
          uni.showModal({
            title: '提示',
            content: '配置已保存，建议立即验证配置是否正确',
            confirmText: '立即验证',
            cancelText: '稍后验证',
            success: (res) => {
              if (res.confirm) {
                verifyPaymentConfig()
              }
            }
          })
        }, 1000)
      }
    }

  } catch (error) {
    console.error('保存失败:', error)
    toast.show('保存失败，请重试')
  } finally {
    saving.value = false
    uni.hideLoading()
  }
}

// 处理开关变化
const onSwitchChange = (e) => {
  paymentInfo.is_enabled = e.detail.value
}

// 显示帮助信息
const showHelp = (type) => {
  let title, content
  
  switch (type) {
    case 'merchant_id':
      title = '微信支付商户号'
      content = '在微信支付商户平台(pay.weixin.qq.com)可以查看商户号，格式如：1234567890'
      break
    case 'api_key':
      title = '支付密钥'
      content = '在微信支付商户平台的API安全中设置的32位密钥，用于支付接口签名'
      break
    case 'certificate':
      title = '支付证书'
      content = '用于退款等高级功能的证书文件，支持.p12、.pem、.crt格式'
      break
    case 'business_license':
      title = '营业执照号'
      content = '营业执照上的统一社会信用代码，通常为18位'
      break
    default:
      return
  }
  
  uni.showModal({
    title,
    content,
    showCancel: false,
    confirmText: '我知道了'
  })
}

onLoad(() => {
  loadPaymentInfo()
})
</script>

<template>
  <layout>
    <template #center>
      <view class="text-32rpx font-medium text-#333">商家支付设置</view>
    </template>

    <view class="bg-#f8f8f8 min-h-100vh">
      <!-- 加载状态 -->
      <view v-if="loading" class="flex items-center justify-center py-80rpx">
        <WdIcon name="loading" size="60rpx" custom-style="color:#f43f5e" class="animate-spin mr-20rpx"/>
        <text class="text-gray-400">加载中...</text>
      </view>

      <template v-else>
        <!-- 状态提示卡片 -->
        <view class="bg-white mx-30rpx mt-20rpx rounded-16rpx p-30rpx">
          <view class="flex items-center justify-between">
            <view class="flex items-center">
              <WdIcon 
                :name="paymentInfo.is_verified ? 'shield-check' : 'shield-x'" 
                size="40rpx" 
                :custom-style="`color: ${paymentInfo.is_verified ? '#10b981' : '#f59e0b'}`"
                class="mr-15rpx"
              />
              <view>
                <text 
                  class="text-28rpx font-medium"
                  :class="paymentInfo.is_verified ? 'text-green-600' : 'text-yellow-600'"
                >
                  {{ paymentInfo.is_verified ? '配置已验证' : '配置未验证' }}
                </text>
                <text class="block text-24rpx text-gray-500 mt-5rpx">
                  {{ paymentInfo.is_verified ? '支付功能正常' : '请完善配置并验证' }}
                </text>
              </view>
            </view>
            
            <view 
              v-if="formValid && !paymentInfo.is_verified"
              class="px-20rpx py-10rpx bg-yellow-50 border border-yellow-200 rounded-full"
              @tap="verifyPaymentConfig"
            >
              <text class="text-22rpx text-yellow-600">立即验证</text>
            </view>
          </view>
        </view>

        <!-- 商户基本信息 -->
        <view class="bg-white mx-30rpx mt-20rpx rounded-16rpx">
          <view class="px-30rpx py-25rpx border-b border-gray-100">
            <text class="text-30rpx font-medium text-#333">商户基本信息</text>
          </view>
          
          <view class="p-30rpx space-y-30rpx">
            <!-- 商户名称 -->
            <view class="form-item">
              <view class="form-label">
                <text>商户名称</text>
                <text class="text-red-500">*</text>
              </view>
              <WdInput
                v-model="paymentInfo.merchant_name"
                class="form-input"
                placeholder="请输入商户名称"
                :maxlength="50"
              />
            </view>

            <!-- 营业执照号 -->
            <view class="form-item">
              <view class="form-label">
                <text>营业执照号</text>
                <text class="text-red-500">*</text>
                <WdIcon 
                  name="help-circle" 
                  size="28rpx" 
                  custom-style="color:#999" 
                  class="ml-10rpx"
                  @tap="showHelp('business_license')"
                />
              </view>
              <WdInput
                v-model="paymentInfo.business_license"
                class="form-input"
                placeholder="请输入统一社会信用代码"
                :maxlength="18"
              />
            </view>
          </view>
        </view>

        <!-- 微信支付配置 -->
        <view class="bg-white mx-30rpx mt-20rpx rounded-16rpx">
          <view class="px-30rpx py-25rpx border-b border-gray-100">
            <text class="text-30rpx font-medium text-#333">微信支付配置</text>
          </view>
          
          <view class="p-30rpx space-y-30rpx">
            <!-- 微信支付商户号 -->
            <view class="form-item">
              <view class="form-label">
                <text>微信支付商户号</text>
                <text class="text-red-500">*</text>
                <WdIcon 
                  name="help-circle" 
                  size="28rpx" 
                  custom-style="color:#999" 
                  class="ml-10rpx"
                  @tap="showHelp('merchant_id')"
                />
              </view>
              <WdInput
                v-model="paymentInfo.merchant_id"
                class="form-input"
                placeholder="请输入微信支付商户号"
                type="number"
                :maxlength="10"
              />
            </view>

            <!-- 支付密钥 -->
            <view class="form-item">
              <view class="form-label">
                <text>支付密钥</text>
                <text class="text-red-500">*</text>
                <WdIcon 
                  name="help-circle" 
                  size="28rpx" 
                  custom-style="color:#999" 
                  class="ml-10rpx"
                  @tap="showHelp('api_key')"
                />
              </view>
              <WdInput
                v-model="paymentInfo.api_key"
                class="form-input"
                placeholder="请输入32位支付密钥"
                password
                :maxlength="32"
              />
              <text v-if="maskedApiKey" class="text-24rpx text-gray-500 mt-10rpx">
                当前: {{ maskedApiKey }}
              </text>
            </view>

            <!-- 支付证书 -->
            <view class="form-item">
              <view class="form-label">
                <text>支付证书</text>
                <text class="text-gray-400">(可选)</text>
                <WdIcon 
                  name="help-circle" 
                  size="28rpx" 
                  custom-style="color:#999" 
                  class="ml-10rpx"
                  @tap="showHelp('certificate')"
                />
              </view>
              
              <view class="flex items-center justify-between">
                <view 
                  class="flex-1 px-20rpx py-15rpx bg-gray-50 rounded-12rpx border border-gray-200"
                  @tap="uploadCertificate"
                >
                  <text class="text-26rpx text-gray-600">
                    {{ paymentInfo.cert_path ? '证书已上传' : '点击上传证书文件' }}
                  </text>
                </view>
                
                <view 
                  class="ml-20rpx px-25rpx py-15rpx bg-blue-50 border border-blue-200 rounded-12rpx"
                  @tap="uploadCertificate"
                >
                  <text class="text-26rpx text-blue-600">
                    {{ uploading ? '上传中...' : '选择文件' }}
                  </text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 银行账户信息 -->
        <view class="bg-white mx-30rpx mt-20rpx rounded-16rpx">
          <view class="px-30rpx py-25rpx border-b border-gray-100">
            <text class="text-30rpx font-medium text-#333">银行账户信息</text>
          </view>
          
          <view class="p-30rpx space-y-30rpx">
            <!-- 开户人 -->
            <view class="form-item">
              <view class="form-label">
                <text>开户人</text>
                <text class="text-red-500">*</text>
              </view>
              <WdInput
                v-model="paymentInfo.account_holder"
                class="form-input"
                placeholder="请输入开户人姓名"
                :maxlength="20"
              />
            </view>

            <!-- 银行名称 -->
            <view class="form-item">
              <view class="form-label">
                <text>银行名称</text>
                <text class="text-red-500">*</text>
              </view>
              <view 
                class="flex items-center justify-between px-20rpx py-15rpx bg-gray-50 rounded-12rpx border border-gray-200"
                @tap="selectBank"
              >
                <text class="text-26rpx" :class="paymentInfo.bank_name ? 'text-#333' : 'text-gray-400'">
                  {{ paymentInfo.bank_name || '请选择银行' }}
                </text>
                <WdIcon name="chevron-right" size="24rpx" custom-style="color:#999"/>
              </view>
            </view>

            <!-- 银行账户 -->
            <view class="form-item">
              <view class="form-label">
                <text>银行账户</text>
                <text class="text-red-500">*</text>
              </view>
              <WdInput
                v-model="paymentInfo.bank_account"
                class="form-input"
                placeholder="请输入银行账户号"
                type="number"
                :maxlength="25"
              />
              <text v-if="maskedBankAccount" class="text-24rpx text-gray-500 mt-10rpx">
                当前: {{ maskedBankAccount }}
              </text>
            </view>
          </view>
        </view>

        <!-- 功能开关 -->
        <view class="bg-white mx-30rpx mt-20rpx rounded-16rpx">
          <view class="px-30rpx py-25rpx border-b border-gray-100">
            <text class="text-30rpx font-medium text-#333">功能设置</text>
          </view>
          
          <view class="p-30rpx">
            <view class="flex items-center justify-between">
              <view>
                <text class="text-28rpx text-#333">启用支付功能</text>
                <text class="block text-24rpx text-gray-500 mt-5rpx">
                  关闭后将无法接收支付
                </text>
              </view>
              <switch 
                :checked="paymentInfo.is_enabled"
                :disabled="!paymentInfo.is_verified"
                color="#f43f5e"
                @change="onSwitchChange"
              />
            </view>
          </view>
        </view>

        <!-- 底部操作区域 -->
        <view class="p-30rpx pb-safe">
          <view class="space-y-20rpx">
            <!-- 验证配置 -->
            <view 
              v-if="formValid && !paymentInfo.is_verified"
              class="w-full py-20rpx bg-yellow-500 rounded-16rpx"
              :class="{ 'opacity-50': verifying }"
              @tap="verifyPaymentConfig"
            >
              <text class="block text-center text-30rpx font-medium text-white">
                {{ verifying ? '验证中...' : '验证配置' }}
              </text>
            </view>

            <!-- 保存配置 -->
            <view 
              class="w-full py-20rpx rounded-16rpx"
              :class="formValid && !saving ? 'bg-#f43f5e' : 'bg-gray-300'"
              @tap="savePaymentInfo"
            >
              <text class="block text-center text-30rpx font-medium text-white">
                {{ saving ? '保存中...' : '保存配置' }}
              </text>
            </view>
          </view>

          <!-- 温馨提示 -->
          <view class="mt-30rpx p-20rpx bg-blue-50 rounded-12rpx">
            <view class="flex items-start">
              <WdIcon name="info" size="32rpx" custom-style="color:#3b82f6" class="mr-15rpx mt-5rpx"/>
              <view class="flex-1">
                <text class="text-26rpx text-blue-800 font-medium">温馨提示</text>
                <text class="block text-24rpx text-blue-600 mt-10rpx leading-34rpx">
                  1. 请确保商户号和密钥信息准确无误<br/>
                  2. 银行账户用于微信支付结算<br/>
                  3. 建议定期更换支付密钥确保安全<br/>
                  4. 如有疑问请联系微信支付客服
                </text>
              </view>
            </view>
          </view>
        </view>
      </template>
    </view>
  </layout>
</template>

<style scoped>
.form-item {
  display: flex;
  flex-direction: column;
}

.form-label {
  display: flex;
  align-items: center;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 15rpx;
}

.form-input {
  padding: 15rpx 20rpx;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 12rpx;
  font-size: 26rpx;
  color: #333;
}

.form-input:focus {
  border-color: #f43f5e;
  background: #fff;
}

/* 微信小程序不支持*选择器，改用类名选择器 */
.space-y-30rpx > view + view,
.space-y-30rpx > text + text,
.space-y-30rpx > button + button {
  margin-top: 30rpx;
}

.space-y-20rpx > view + view,
.space-y-20rpx > text + text,
.space-y-20rpx > button + button {
  margin-top: 20rpx;
}

.pb-safe {
  padding-bottom: env(safe-area-inset-bottom);
}
</style>