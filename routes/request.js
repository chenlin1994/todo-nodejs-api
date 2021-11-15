const express = require('express')
const router = express.Router()
const service = require('../services/requestService')

// 获取用户列表
router.get('/poros-permission/secStaff/list', service.secStaffList)

module.exports = router
