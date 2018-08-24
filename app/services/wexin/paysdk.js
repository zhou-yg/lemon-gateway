/**
 * 微信支付
 */

/**
 * 支付签名生成算法
 * @param params {object} 待签名的数据
 * @param payKey {string} 商户支付密钥
 * @return {string} 签名
 * @author gzj 20161104
 */
function makeSign(params, payKey) {
	const keys = Object.keys(params).sort()
	let kvs = []
	for (let k of keys) {
		if (params.hasOwnProperty(k))
			kvs.push(`${k}=${params[k]}`)
	}
	kvs.push('key=' + payKey)
	console.log('makeSign:', kvs.join('&'))
	return md5(kvs.join('&')).toUpperCase()
}

/**
 * 微信统一下单接口
 * @param appId {string} 公众号标识
 * @param mchId {string} 商户号
 * @param customerIp {string} 客户机终端ip
 * @param payKey {string} 商户支付密钥
 * @param goodsName {string} 商品名
 * @param price {int} 订单价格，单位分
 * @param volume {int} 流量大小， 单位MB
 * @param rateId {int} 套餐编号
 * @param iccid {int} 卡号
 * @param openId {string} 微信用户标识
 * @param orderId {string} 站内订单编号
 * @param notifyUrl {string} 微信支付通知回调接口
 * @param host {string} 操作的站点host
 * @param IBkey {string} 操作的站点的密钥
 * @returns {string}
 * @author gzj 20161103
 */
async function unifiedOrder(appId, mchId, customerIp,
                            payKey, goodsName, number, price,
                            volume, rateId, iccid,
                            tradeType, openId, orderId, notifyUrl,
                            host) {
	const timeFormat = 'YYYYMMDDHHmmss'
	const timeStart = moment()
	console.log(`发送前openID${openId}`)
	params = {
    appid: appId,
    attach: JSON.stringify({volume, host}),
    body: `支付${goodsName} * ${number} `,
    mch_id: mchId,
    nonce_str: Math.random().toString(36).substr(2),
    notify_url: notifyUrl,
    openid: openId,
    out_trade_no: orderId,
    spbill_create_ip: customerIp,
    total_fee: price,
    trade_type: tradeType,
    time_start: timeStart.format(timeFormat),
    time_expire: timeStart.add(600, 'seconds').format(timeFormat),
    goods_tag: iccid
  }
	if (!openId) {
    delete params.openid
  }
	const sign = makeSign(params, payKey)
	const data =  `
        <xml>
            <appid>${params.appid}</appid>
            <attach>${params.attach}</attach>
            <body>${params.body}</body>
            <mch_id>${params.mch_id}</mch_id>
            <nonce_str>${params.nonce_str}</nonce_str>
            <notify_url>${params.notify_url}</notify_url>
            ${ openId ?
`						<openid>${params.openid}</openid>`
						: ''}
            <out_trade_no>${params.out_trade_no}</out_trade_no>
            <spbill_create_ip>${params.spbill_create_ip}</spbill_create_ip>
            <total_fee>${params.total_fee}</total_fee>
            <trade_type>${params.trade_type}</trade_type>
            <sign>${sign}</sign>
            <time_start>${params.time_start}</time_start>
            <time_expire>${params.time_expire}</time_expire>
            <goods_tag>${params.goods_tag}</goods_tag>
        </xml>
    `

	const url = ENV.DEBUG ? 'http://127.0.0.1:3000/api/wxpayMock?a=unifiedorder' : 'https://api.mch.weixin.qq.com/pay/unifiedorder'
	let resp, parsed
	console.log(`支付前数据:${url} ${data} `)
	try {
		resp = await correctFetch({body: data, url})
		parsed = await xmlParser(resp)
		return parsed.xml
	} catch (err) {
		console.error('unifiedOrder', err)
		throw err
	}
}


/**
 * 查询订单
 * @param appId {string} 公众号标识
 * @param mchId {string} 微信支付商户号
 * @param orderId {string} 订单编号
 * @param payKey {string} 商户支付密钥
 * @param next {function} 查询回调， 函数签名 function(err, xmlRoot)
 * @author gzj 20161104
 */
async function orderQuery(appId, mchId, orderId, payKey, next) {
	const params = {
		appid: appId,
		mch_id: mchId,
		out_trade_no: orderId,
		nonce_str: Math.random().toString(36).substr(2)
	}
	const sign = makeSign(params, payKey)
	const body = `
        <xml>
            <appid>${params.appid}</appid>
            <mch_id>${params.mch_id}</mch_id>
            <nonce_str>${params.nonce_str}</nonce_str>
            <out_trade_no>${params.out_trade_no}</out_trade_no>
            <sign>${sign}</sign>
        </xml>
    `

	let resp, parsed
	try {
		var url = 'https://api.mch.weixin.qq.com/pay/orderquery'
		resp = await correctFetch({url: url, body})
		parsed = await xmlParser(resp)
		return parsed.xml
	} catch (err) {
		console.error('orderQuery', err)
		throw err
	}
}

module.exports = {
	unifiedOrder,
	orderQuery,
	makeSign
}
