# 微信支付API实现指南

## 概述

本文档为校园闲置交易平台的微信支付功能提供后端API实现指南。包含三个主要接口的实现说明。

## 前置条件

### 1. 微信支付商户配置
- 微信支付商户号 (mch_id)
- 微信支付API密钥 (api_key)
- 微信小程序AppID (app_id)
- 支付证书文件（用于退款等高级功能）
- 配置支付结果通知地址

### 2. 依赖库
建议使用官方或成熟的微信支付SDK：
- Java: weixin-java-pay
- Python: wechatpay-python
- Node.js: wechatpay-nodejs
- PHP: overtrue/wechat

## API接口实现

### 1. 获取微信支付参数接口

**接口地址:** `POST /goods/payment/wechat/prepare`

**功能说明:** 调用微信支付统一下单接口，获取小程序支付所需参数

#### 请求参数
```json
{
  "order_id": "订单ID",
  "order_number": "订单号",
  "total_fee": 100,  // 支付金额，单位：分
  "body": "商品订单-ORDER123456",  // 商品描述
  "openid": "用户的openid",
  "notify_url": "支付结果通知地址（可选）"
}
```

#### 实现步骤
1. **参数验证**
   - 验证订单ID有效性
   - 检查订单状态（未支付、未超时）
   - 验证金额格式

2. **调用微信统一下单API**
   ```
   接口地址: https://api.mch.weixin.qq.com/pay/unifiedorder
   
   必需参数:
   - appid: 小程序AppID
   - mch_id: 商户号
   - nonce_str: 随机字符串
   - body: 商品描述
   - out_trade_no: 商户订单号(order_number)
   - total_fee: 支付金额(分)
   - spbill_create_ip: 用户IP
   - notify_url: 支付结果通知地址
   - trade_type: JSAPI
   - openid: 用户openid
   - sign: 签名
   ```

3. **生成小程序支付参数**
   ```
   timeStamp: 当前时间戳
   nonceStr: 随机字符串
   package: prepay_id=统一下单返回的prepay_id
   signType: MD5
   paySign: 签名
   ```

#### 响应格式
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "timeStamp": "1640995200",
    "nonceStr": "5K8264ILTKCH16CQ2502SI8ZNMTM67VS",
    "package": "prepay_id=wx123456789012345678",
    "signType": "MD5",
    "paySign": "C380BEC2BFD727A4B6845133519F3AD6",
    "prepay_id": "wx123456789012345678"
  }
}
```

#### 关键代码示例（伪代码）
```python
def prepare_wechat_payment(order_id, order_number, total_fee, body, openid):
    # 1. 验证订单
    order = get_order_by_id(order_id)
    if not order or order.status != 'unpaid':
        raise Exception("订单状态错误")
    
    # 2. 构建统一下单参数
    params = {
        'appid': WECHAT_APP_ID,
        'mch_id': WECHAT_MCH_ID,
        'nonce_str': generate_random_string(32),
        'body': body,
        'out_trade_no': order_number,
        'total_fee': total_fee,
        'spbill_create_ip': get_client_ip(),
        'notify_url': PAYMENT_NOTIFY_URL,
        'trade_type': 'JSAPI',
        'openid': openid
    }
    
    # 3. 生成签名
    params['sign'] = generate_sign(params, WECHAT_API_KEY)
    
    # 4. 调用微信统一下单
    response = call_wechat_unifiedorder(params)
    
    if response['return_code'] == 'SUCCESS' and response['result_code'] == 'SUCCESS':
        prepay_id = response['prepay_id']
        
        # 5. 生成小程序支付参数
        pay_params = {
            'timeStamp': str(int(time.time())),
            'nonceStr': generate_random_string(32),
            'package': f'prepay_id={prepay_id}',
            'signType': 'MD5'
        }
        pay_params['paySign'] = generate_jsapi_sign(pay_params, WECHAT_API_KEY)
        
        return pay_params
    else:
        raise Exception(f"微信支付统一下单失败: {response.get('err_code_des', '未知错误')}")
```

### 2. 查询支付状态接口

**接口地址:** `POST /goods/payment/wechat/query`

**功能说明:** 主动查询微信支付订单状态

#### 请求参数
```json
{
  "order_id": "订单ID",
  "transaction_id": "微信交易号（可选）"
}
```

#### 实现步骤
1. 调用微信查询订单API
2. 解析支付状态
3. 返回标准化结果

#### 响应格式
```json
{
  "code": 200,
  "data": {
    "trade_state": "SUCCESS",
    "trade_state_desc": "支付成功",
    "transaction_id": "4200001234567890123",
    "total_fee": 100,
    "time_end": "20220101120000"
  }
}
```

### 3. 同步支付结果接口

**接口地址:** `POST /goods/payment/wechat/sync`

**功能说明:** 主动同步支付结果并更新订单状态

#### 请求参数
```json
{
  "order_id": "订单ID"
}
```

#### 实现步骤
1. 查询微信支付状态
2. 更新本地订单状态
3. 触发后续业务流程

#### 响应格式
```json
{
  "code": 200,
  "data": {
    "is_paid": true,
    "transaction_id": "4200001234567890123",
    "pay_time": 1640995200,
    "pay_amount": "1.00"
  }
}
```

## 支付结果通知处理

### 通知接口（异步通知）

**接口地址:** `POST /goods/payment/wechat/notify`

微信支付成功后会向此地址发送支付结果通知。

#### 处理流程
1. **验证通知的合法性**
   - 验证签名
   - 检查通知来源

2. **处理支付结果**
   ```python
   def handle_payment_notify(xml_data):
       # 1. 解析XML数据
       data = parse_xml(xml_data)
       
       # 2. 验证签名
       if not verify_sign(data, WECHAT_API_KEY):
           return error_response()
       
       # 3. 处理支付结果
       if data['return_code'] == 'SUCCESS' and data['result_code'] == 'SUCCESS':
           order_number = data['out_trade_no']
           transaction_id = data['transaction_id']
           
           # 更新订单状态
           update_order_payment_status(order_number, transaction_id, 'paid')
           
           # 触发后续业务逻辑
           trigger_order_paid_event(order_number)
           
           return success_response()
       else:
           # 支付失败处理
           handle_payment_failure(data)
           return success_response()
   ```

3. **返回处理结果**
   ```xml
   <xml>
     <return_code><![CDATA[SUCCESS]]></return_code>
     <return_msg><![CDATA[OK]]></return_msg>
   </xml>
   ```

## 安全注意事项

1. **参数签名验证**
   - 所有API调用都需要验证签名
   - 使用商户API密钥进行签名

2. **HTTPS通信**
   - 所有与微信服务器的通信必须使用HTTPS

3. **敏感信息处理**
   - API密钥不能暴露在客户端
   - 支付证书文件需要安全存储

4. **订单幂等性**
   - 同一订单多次支付请求的幂等性处理
   - 防止重复扣款

5. **异常处理**
   - 网络超时重试机制
   - 支付失败的回滚处理

## 测试建议

1. **沙箱环境测试**
   - 使用微信支付提供的沙箱环境进行测试
   - 测试各种支付场景（成功、失败、超时等）

2. **金额测试**
   - 测试各种金额格式
   - 注意分和元的转换

3. **并发测试**
   - 测试高并发场景下的支付处理
   - 验证订单状态的一致性

## 错误码说明

| 错误码 | 说明 | 处理建议 |
|--------|------|----------|
| 1001 | 订单不存在 | 检查订单ID |
| 1002 | 订单状态错误 | 确认订单状态 |
| 1003 | 金额格式错误 | 检查金额参数 |
| 2001 | 微信API调用失败 | 检查网络连接 |
| 2002 | 签名验证失败 | 检查API密钥 |
| 2003 | 商户配置错误 | 检查商户号配置 |

## 相关文档

- [微信支付开发者文档](https://pay.weixin.qq.com/wiki/doc/api/index.html)
- [小程序支付接入指南](https://developers.weixin.qq.com/miniprogram/dev/api/payment/wx.requestPayment.html)
- [微信支付API签名规则](https://pay.weixin.qq.com/wiki/doc/api/jsapi.php?chapter=4_3)

## 联调说明

前端已在以下文件中集成了相关API调用：
- `src/api/goods.js` - API接口定义
- `src/subpackages/pages/goods/pay-confirm.vue` - 支付确认页面
- `src/subpackages/pages/goods/order-confirm.vue` - 订单确认页面

请确保后端接口返回格式与前端期望一致，接口联调时注意：
1. 错误信息的格式统一
2. 金额单位的统一（前端传分，显示元）
3. 时间戳格式的统一
4. 订单状态枚举值的统一 