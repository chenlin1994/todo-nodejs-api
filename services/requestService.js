const { getCipherInfo } = require('crypto')
const _ = require('lodash')
const axios = require('axios')
const https = require('https')
const Qs = require('qs')
let username = 'super_admin'
let password = 'hxgc210226@UAT1'

let accessToken = null
let tokenType = null
let CryptoJS = null
let dev = ''
typeof window !== 'undefined'
  ? (CryptoJS = window.CryptoJS)
  : (CryptoJS = require('crypto'))
let baseURL = 'https://uat.iiot.hxct.com'
const ajax = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
})
baseURL = 'http://218.3.30.136:21203'
baseURL = 'https://dcp.poros.getech.cn'
username = 'admin'
password = 'getech@1234'
async function getKey(callback, params) {
  let { data } = await ajax({
    method: 'get',
    url: `${baseURL}/api/poros-authcenter/secret/${username}`,
    params: {},
  })
  console.log('======getKey=======')
  console.log(data)
  return login(data.data, callback, params)
}
async function login(name, callback, params) {
  if (!name) {
    return
  }
  // typeof window == 'undefined' && console.log(encryptByDES(password, name))
  let { data } = await ajax({
    url: `${baseURL}/api/poros-authcenter/login`,
    method: 'post',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    data: Qs.stringify({
      username: username,
      password: encryptByDES(password, name),
      grant_type: 'password',
    }),
  })
  console.log('===login=====')
  console.log(data)
  if (data.code == 0) {
    accessToken = data.data.accessToken
    tokenType = data.data.tokenType
    if (callback) {
      return callback(params)
    }
  }
}
async function getMemberInfo(params = {}) {
  if (accessToken && tokenType) {
    let { data } = await ajax({
      url: `${baseURL}/api${params?.url || '/poros-authcenter/user/message'}`,
      params: params?.params || {},
      headers: {
        Cookie: `${dev}access_token=${accessToken}; ${dev}token_type=${tokenType}`,
        Authorization: `${tokenType} ${accessToken}`,
      },
      method: 'get',
    })
    console.log('====request===')
    console.log(data)
    if (data.code == 401) {
      return getKey(getMemberInfo, params)
    } else {
      return data
    }
  } else {
    return getKey(getMemberInfo, params)
  }
}
let encryptByDES = (str, key) => {
  var keyHex = Buffer.from(key)
  var iv = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8])
  var cipher = CryptoJS.createCipheriv('des-cbc', keyHex, iv)
  cipher.setAutoPadding(true) // default true
  var ciph = cipher.update(str, 'utf8', 'base64')
  ciph += cipher.final('base64')
  return ciph
}
// 本地调试
// getMemberInfo().then((data) => {
//   console.log(data || { code: -1 })
// })
module.exports = getMemberInfo
