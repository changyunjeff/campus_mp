<template>
  <view class="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50" @tap.self="cancel">
    <view class="w-full bg-white rounded-t-8 overflow-hidden transition-transform duration-300 ease-out" @tap.stop>
      <!-- 当前选择预览 -->
      <view class="px-4 py-3 bg-blue-50 border-b border-blue-100">
        <text class="text-sm text-blue-600">当前选择：</text>
        <text class="text-lg font-medium text-blue-700 ml-2">{{ currentSelectionDisplay }}</text>
      </view>

      <!-- 选项卡切换 -->
      <view class="flex border-b border-gray-100">
        <view
          class="flex-1 h-12 flex items-center justify-center text-sm transition-all duration-200 relative"
          :class="activeTab === 'date' ? 'text-blue-600 font-medium' : 'text-gray-600'"
          @tap.stop="activeTab = 'date'"
        >
          日期选择
          <view 
            v-if="activeTab === 'date'"
            class="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-blue-600 rounded-t-1"
          ></view>
        </view>
        <view
          class="flex-1 h-12 flex items-center justify-center text-sm relative transition-all duration-200"
          :class="activeTab === 'time' ? 'text-blue-600 font-medium' : 'text-gray-600'"
          @tap.stop="activeTab = 'time'"
        >
          时间选择
          <view 
            v-if="activeTab === 'time'"
            class="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-blue-600 rounded-t-1"
          ></view>
        </view>
      </view>

      <!-- 日期选择面板 -->
      <view v-show="activeTab === 'date'" class="p-4" @tap.stop>
        <!-- 年月导航 -->
        <view class="flex items-center justify-between mb-4">
          <view 
            class="w-10 h-10 flex items-center justify-center rounded-2 hover:bg-gray-100 active:bg-gray-200 transition-colors duration-200"
            @tap.stop="changeMonth(-1)"
          >
            <wd-icon name="arrow-left" size="16" color="#666"/>
          </view>
          <view class="text-lg font-medium text-gray-800">
            {{currentYear}}年{{currentMonth + 1}}月
          </view>
          <view 
            class="w-10 h-10 flex items-center justify-center rounded-2 hover:bg-gray-100 active:bg-gray-200 transition-colors duration-200"
            @tap.stop="changeMonth(1)"
          >
            <wd-icon name="arrow-right" size="16" color="#666"/>
          </view>
        </view>

        <!-- 快捷日期选择 -->
        <view class="flex gap-2 mb-4">
          <view 
            class="px-3 py-1 text-xs rounded-full transition-colors duration-200"
            :class="isSelectedDateToday() ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 active:bg-gray-200'"
            @tap.stop="selectToday"
          >
            今天
          </view>
          <view 
            class="px-3 py-1 text-xs rounded-full transition-colors duration-200"
            :class="isSelectedDateTomorrow() ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 active:bg-gray-200'"
            @tap.stop="selectTomorrow"
          >
            明天
          </view>
        </view>

        <!-- 星期表头 -->
        <view class="grid grid-cols-7 mb-2">
          <text 
            v-for="day in ['日','一','二','三','四','五','六']" 
            :key="day"
            class="h-9 flex items-center justify-center text-xs text-gray-500"
          >
            {{day}}
          </text>
        </view>

        <!-- 日期网格 -->
        <view class="grid grid-cols-7 gap-1">
          <view
            v-for="(date, index) in dateList"
            :key="index"
            class="aspect-square flex items-center justify-center text-sm rounded-2 transition-all duration-200"
            :class="[
              date.otherMonth ? 'text-gray-400' : 'text-gray-800',
              isDateSelected(date) ? 'bg-blue-600 text-white font-medium' : '',
              isDateDisabled(date) ? 'text-gray-300 bg-gray-50 cursor-not-allowed' : 'hover:bg-blue-50 active:bg-blue-100',
              isToday(date) && !isDateSelected(date) ? 'text-blue-600 font-medium' : ''
            ]"
            @tap.stop="selectDate(date)"
          >
            {{date.day}}
          </view>
        </view>
      </view>

      <!-- 时间选择面板 -->
      <view v-show="activeTab === 'time'" class="p-4 h-80" @tap.stop>
        <!-- 快捷时间选择 -->
        <view class="flex flex-wrap gap-2 mb-4">
          <view 
            v-for="quickTime in quickTimeOptions"
            :key="quickTime.label"
            class="px-3 py-1 text-xs rounded-full transition-colors duration-200"
            :class="isQuickTimeSelected(quickTime) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 active:bg-gray-200'"
            @tap.stop="selectQuickTime(quickTime)"
          >
            {{ quickTime.label }}
          </view>
        </view>

        <view class="flex items-center justify-center h-full">
          <!-- 小时选择 -->
          <scroll-view
            class="flex-1 h-full"
            scroll-y
            :scroll-into-view="'hour-' + selectedHour"
            :show-scrollbar="false"
            @tap.stop
          >
            <view class="py-16">
              <view
                v-for="hour in 24"
                :key="hour-1"
                :id="'hour-' + (hour-1)"
                class="h-12 flex items-center justify-center text-lg transition-all duration-200"
                :class="[
                  selectedHour === hour-1 ? 'text-blue-600 font-semibold scale-110' : 'text-gray-600',
                  isTimeDisabled(hour-1, selectedMinute) ? 'text-gray-300 cursor-not-allowed' : 'hover:text-blue-500 active:text-blue-600'
                ]"
                @tap.stop="selectTime(hour-1, selectedMinute)"
              >
                {{(hour-1).toString().padStart(2, '0')}}
              </view>
            </view>
          </scroll-view>

          <text class="text-2xl text-gray-400 font-light mx-6">:</text>

          <!-- 分钟选择 -->
          <scroll-view
            class="flex-1 h-full"
            scroll-y
            :scroll-into-view="'minute-' + selectedMinute"
            :show-scrollbar="false"
            @tap.stop
          >
            <view class="py-16">
              <view
                v-for="minute in 60"
                :key="minute-1"
                :id="'minute-' + (minute-1)"
                class="h-12 flex items-center justify-center text-lg transition-all duration-200"
                :class="[
                  selectedMinute === minute-1 ? 'text-blue-600 font-semibold scale-110' : 'text-gray-600',
                  isTimeDisabled(selectedHour, minute-1) ? 'text-gray-300 cursor-not-allowed' : 'hover:text-blue-500 active:text-blue-600'
                ]"
                @tap.stop="selectTime(selectedHour, minute-1)"
              >
                {{(minute-1).toString().padStart(2, '0')}}
              </view>
            </view>
          </scroll-view>
        </view>
      </view>

      <!-- 底部操作栏 -->
      <view class="flex border-t border-gray-100">
        <view 
          class="flex-1 h-12 flex items-center justify-center text-sm text-gray-600 bg-gray-50 active:bg-gray-100 transition-colors duration-200" 
          @tap.stop="cancel"
        >
          取消
        </view>
        <view 
          class="flex-1 h-12 flex items-center justify-center text-sm text-white bg-blue-600 active:bg-blue-700 transition-colors duration-200" 
          @tap.stop="confirm"
        >
          确定
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  /** 是否显示选择器 */
  show: {
    type: Boolean,
    default: false
  },
  /** 当前选中的时间戳 */
  value: {
    type: Number,
    default: () => Date.now()
  },
  /** 最小可选时间戳 */
  minDate: {
    type: Number,
    default: 0
  },
  /** 最大可选时间戳 */
  maxDate: {
    type: Number,
    default: 0
  },
  /** 默认显示的面板：date | time */
  defaultTab: {
    type: String,
    default: 'date'
  }
})

const emit = defineEmits(['confirm', 'cancel', 'update:show'])

// 当前选中的面板
const activeTab = ref(props.defaultTab)

// 快捷时间选项
const quickTimeOptions = [
  { label: '09:00', hour: 9, minute: 0 },
  { label: '12:00', hour: 12, minute: 0 },
  { label: '14:00', hour: 14, minute: 0 },
  { label: '16:00', hour: 16, minute: 0 },
  { label: '18:00', hour: 18, minute: 0 },
  { label: '20:00', hour: 20, minute: 0 }
]

// 智能初始化时间 - 如果没有传入有效值或值过期，使用当前时间
const getSmartInitialTime = () => {
  const now = new Date()
  const inputDate = new Date(props.value)
  
  // 如果传入的时间是过去的时间或无效时间，使用当前时间
  if (!props.value || inputDate.getTime() < now.getTime()) {
    // 设置为当前时间后30分钟，分钟数向上取整到最近的15分钟倍数
    const futureTime = new Date(now.getTime() + 30 * 60 * 1000)
    const minutes = Math.ceil(futureTime.getMinutes() / 15) * 15
    futureTime.setMinutes(minutes, 0, 0)
    
    return {
      date: new Date(futureTime.getFullYear(), futureTime.getMonth(), futureTime.getDate()),
      hour: futureTime.getHours(),
      minute: futureTime.getMinutes()
    }
  } else {
    return {
      date: new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate()),
      hour: inputDate.getHours(),
      minute: inputDate.getMinutes()
    }
  }
}

// 状态管理
const { date: initialDate, hour: initialHour, minute: initialMinute } = getSmartInitialTime()

// 日期相关状态
const currentYear = ref(initialDate.getFullYear())
const currentMonth = ref(initialDate.getMonth())
const selectedDate = ref(new Date(initialDate))

// 时间相关状态
const selectedHour = ref(initialHour)
const selectedMinute = ref(initialMinute)

// 当前选择显示
const currentSelectionDisplay = computed(() => {
  const formatted = getFormattedDateTime()
  return formatted.dateTime
})

// 监听props.value变化，更新内部状态
watch(() => props.value, (newValue) => {
  const { date, hour, minute } = getSmartInitialTime()
  currentYear.value = date.getFullYear()
  currentMonth.value = date.getMonth()
  selectedDate.value = new Date(date)
  selectedHour.value = hour
  selectedMinute.value = minute
})

// 获取今天信息
const getTodayInfo = () => {
  const today = new Date()
  return {
    year: today.getFullYear(),
    month: today.getMonth(),
    day: today.getDate()
  }
}

// 获取明天信息
const getTomorrowInfo = () => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return {
    year: tomorrow.getFullYear(),
    month: tomorrow.getMonth(),
    day: tomorrow.getDate()
  }
}

// 判断是否是明天
const isTomorrow = (date) => {
  const tomorrow = getTomorrowInfo()
  return date.year === tomorrow.year &&
         date.month === tomorrow.month &&
         date.day === tomorrow.day
}

// 计算日期网格
const dateList = computed(() => {
  const list = []
  const firstDay = new Date(currentYear.value, currentMonth.value, 1)
  const lastDay = new Date(currentYear.value, currentMonth.value + 1, 0)

  // 上个月的日期
  const firstDayWeek = firstDay.getDay()
  for (let i = firstDayWeek - 1; i >= 0; i--) {
    const date = new Date(currentYear.value, currentMonth.value, -i)
    list.push({
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate(),
      otherMonth: true,
      timestamp: date.getTime()
    })
  }

  // 当前月的日期
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(currentYear.value, currentMonth.value, i)
    list.push({
      year: currentYear.value,
      month: currentMonth.value,
      day: i,
      otherMonth: false,
      timestamp: date.getTime()
    })
  }

  // 下个月的日期（补齐6行42天）
  const remaining = 42 - list.length
  for (let i = 1; i <= remaining; i++) {
    const date = new Date(currentYear.value, currentMonth.value + 1, i)
    list.push({
      year: date.getFullYear(),
      month: date.getMonth(),
      day: i,
      otherMonth: true,
      timestamp: date.getTime()
    })
  }

  return list
})

// 获取最终选中的时间戳
const getFinalTimestamp = () => {
  const finalDate = new Date(selectedDate.value)
  finalDate.setHours(selectedHour.value, selectedMinute.value, 0, 0)
  return finalDate.getTime()
}

// 格式化显示用的时间字符串
const getFormattedDateTime = () => {
  const timestamp = getFinalTimestamp()
  const date = new Date(timestamp)
  return {
    date: `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`,
    time: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`,
    dateTime: `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }
}

// 方法定义
const changeMonth = (delta) => {
  const newDate = new Date(currentYear.value, currentMonth.value + delta, 1)
  currentYear.value = newDate.getFullYear()
  currentMonth.value = newDate.getMonth()
}

const isDateSelected = (date) => {
  return date.year === selectedDate.value.getFullYear() &&
      date.month === selectedDate.value.getMonth() &&
      date.day === selectedDate.value.getDate()
}

const isDateDisabled = (date) => {
  const startOfDay = new Date(date.year, date.month, date.day).getTime()
  const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1

  if (props.minDate) {
    // 如果是今天，则允许选择
    const today = new Date()
    if (date.year === today.getFullYear() &&
        date.month === today.getMonth() &&
        date.day === today.getDate()) {
      return false
    }
    // 其他日期正常判断
    if (endOfDay < props.minDate) return true
  }
  if (props.maxDate && startOfDay > props.maxDate) return true
  return false
}

const isTimeDisabled = (hour, minute) => {
  if (!selectedDate.value || !props.minDate) return false

  const currentTime = new Date(selectedDate.value.getTime())
  currentTime.setHours(hour, minute, 0, 0)

  return currentTime.getTime() < props.minDate
}

const isToday = (date) => {
  const today = new Date()
  return date.year === today.getFullYear() &&
      date.month === today.getMonth() &&
      date.day === today.getDate()
}

const selectDate = (date) => {
  if (isDateDisabled(date)) return
  selectedDate.value = new Date(date.year, date.month, date.day)
}

const selectTime = (hour, minute) => {
  if (isTimeDisabled(hour, minute)) return
  selectedHour.value = hour
  selectedMinute.value = minute
}

const selectToday = () => {
  const today = new Date()
  selectedDate.value = new Date(today.getFullYear(), today.getMonth(), today.getDate())
}

const selectTomorrow = () => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  selectedDate.value = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate())
}

const isQuickTimeSelected = (quickTime) => {
  return selectedHour.value === quickTime.hour && selectedMinute.value === quickTime.minute
}

const selectQuickTime = (quickTime) => {
  if (isTimeDisabled(quickTime.hour, quickTime.minute)) return
  selectedHour.value = quickTime.hour
  selectedMinute.value = quickTime.minute
}

// 判断选中的日期是否是今天
const isSelectedDateToday = () => {
  const today = getTodayInfo()
  return selectedDate.value.getFullYear() === today.year &&
         selectedDate.value.getMonth() === today.month &&
         selectedDate.value.getDate() === today.day
}

// 判断选中的日期是否是明天
const isSelectedDateTomorrow = () => {
  const tomorrow = getTomorrowInfo()
  return selectedDate.value.getFullYear() === tomorrow.year &&
         selectedDate.value.getMonth() === tomorrow.month &&
         selectedDate.value.getDate() === tomorrow.day
}

const confirm = () => {
  const timestamp = getFinalTimestamp()
  const formatted = getFormattedDateTime()
  
  emit('confirm', {
    value: timestamp,
    formatted: formatted.dateTime,
    date: formatted.date,
    time: formatted.time
  })
  emit('update:show', false)
}

const cancel = () => {
  emit('cancel')
  emit('update:show', false)
}

// 暴露格式化方法供外部使用
defineExpose({
  getFormattedDateTime
})
</script>

<style scoped>
/* 确保滚动区域样式正确 */
:deep(.uni-scroll-view) {
  flex: 1;
}

/* 隐藏滚动条但保持滚动功能 */
:deep(.uni-scroll-view::-webkit-scrollbar) {
  display: none;
}
</style>