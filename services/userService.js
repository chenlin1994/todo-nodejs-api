/**
 * 描述: 业务逻辑处理 - 用户相关接口
 * 作者: Jack Chen
 * 日期: 2020-06-20
 */

const { querySql, queryOne } = require('../utils/index')
const md5 = require('../utils/md5')
const jwt = require('jsonwebtoken')
const boom = require('boom')
const { body, validationResult } = require('express-validator')
const {
  CODE_ERROR,
  CODE_SUCCESS,
  PRIVATE_KEY,
  JWT_EXPIRED,
} = require('../utils/constant')
const { decode } = require('../utils/user-jwt')

// 登录
function login(req, res, next) {
  const err = validationResult(req)
  // 如果验证错误，empty不为空
  if (!err.isEmpty()) {
    // 获取错误信息
    const [{ msg }] = err.errors
    // 抛出错误，交给我们自定义的统一异常处理程序进行错误返回
    next(boom.badRequest(msg))
  } else {
    let { username, password } = req.body
    // md5加密
    let password_md5 = md5(password)
    const query = `select * from sys_user where username='${username}' and password='${password}'`
    querySql(query).then((user) => {
      // console.log('用户登录===', user);
      if (!user || user.length === 0) {
        res.json({
          code: CODE_ERROR,
          msg: '用户名或密码错误',
          data: null,
        })
      } else {
        // 登录成功，签发一个token并返回给前端
        const token = jwt.sign(
          // payload：签发的 token 里面要包含的一些数据。
          { username },
          // 私钥
          PRIVATE_KEY,
          // 设置过期时间
          { expiresIn: JWT_EXPIRED }
        )

        let userData = {
          id: user[0].id,
          username: user[0].username,
          nickname: user[0].nickname,
          avator: user[0].avator,
          sex: user[0].sex,
          gmt_create: user[0].gmt_create,
          gmt_modify: user[0].gmt_modify,
        }

        res.json({
          code: CODE_SUCCESS,
          msg: '登录成功',
          data: {
            token,
            userData,
          },
        })
      }
    })
  }
}

// 注册
function register(req, res, next) {
  const err = validationResult(req)
  if (!err.isEmpty()) {
    const [{ msg }] = err.errors
    next(boom.badRequest(msg))
  } else {
    let { username, password } = req.body
    findUser(username).then((data) => {
      // console.log('用户注册===', data);
      if (data) {
        res.json({
          code: CODE_ERROR,
          msg: '用户已存在',
          data: null,
        })
      } else {
        let password_md5 = md5(password)
        const query = `insert into sys_user(username, password,password_md5) values('${username}', '${password}','${password_md5}')`
        querySql(query).then((result) => {
          // console.log('用户注册===', result);
          if (!result || result.length === 0) {
            res.json({
              code: CODE_ERROR,
              msg: '注册失败',
              data: null,
            })
          } else {
            const queryUser = `select * from sys_user where username='${username}' and password='${password}'`
            querySql(queryUser).then((user) => {
              const token = jwt.sign({ username }, PRIVATE_KEY, {
                expiresIn: JWT_EXPIRED,
              })

              let userData = {
                id: user[0].id,
                username: user[0].username,
                nickname: user[0].nickname,
                avator: user[0].avator,
                sex: user[0].sex,
                gmt_create: user[0].gmt_create,
                gmt_modify: user[0].gmt_modify,
              }

              res.json({
                code: CODE_SUCCESS,
                msg: '注册成功',
                data: {
                  token,
                  userData,
                },
              })
            })
          }
        })
      }
    })
  }
}

// 重置密码
function resetPwd(req, res, next) {
  const err = validationResult(req)
  if (!err.isEmpty()) {
    const [{ msg }] = err.errors
    next(boom.badRequest(msg))
  } else {
    let { username, oldPassword, newPassword } = req.body
    oldPassword = md5(oldPassword)
    validateUser(username, oldPassword).then((data) => {
      console.log('校验用户名和密码===', data)
      if (data) {
        if (newPassword) {
          newPassword = md5(newPassword)
          const query = `update sys_user set password='${newPassword}' where username='${username}'`
          querySql(query).then((user) => {
            // console.log('密码重置===', user);
            if (!user || user.length === 0) {
              res.json({
                code: CODE_ERROR,
                msg: '重置密码失败',
                data: null,
              })
            } else {
              res.json({
                code: CODE_SUCCESS,
                msg: '重置密码成功',
                data: null,
              })
            }
          })
        } else {
          res.json({
            code: CODE_ERROR,
            msg: '新密码不能为空',
            data: null,
          })
        }
      } else {
        res.json({
          code: CODE_ERROR,
          msg: '用户名或旧密码错误',
          data: null,
        })
      }
    })
  }
}
// 查询用户列表
function getUserList(req, res, next) {
  const err = validationResult(req)
  // 如果验证错误，empty不为空
  if (!err.isEmpty()) {
    // 获取错误信息
    const [{ msg }] = err.errors
    // 抛出错误，交给我们自定义的统一异常处理程序进行错误返回
    next(boom.badRequest(msg))
  } else {
    let { pageSize = 10, pageNo = 1 } = req.query
    let query = `select d.id,d.username,d.password,d.gmt_create from sys_user d`
    querySql(query).then((data) => {
      if (!data || data.length === 0) {
        res.json({
          code: -1,
          msg: '暂无数据',
          data: null,
        })
      } else {
        total = data.length
        let n = (pageNo - 1) * pageSize
        let querySecond =
          query + ` order by d.gmt_create desc limit ${n}, ${pageSize}`
        querySql(querySecond).then((result) => {
          console.log(result)
          res.json({
            code: 0,
            msg: '查询数据成功',
            data: {
              rows: result,
              total: total,
              pageNo: parseInt(pageNo),
              pageSize: parseInt(pageSize),
            },
          })
        })
      }
    })
  }
}
// 删除用户
function deleteUser(req, res, next) {
  const err = validationResult(req)
  if (!err.isEmpty) {
    const [{ msg }] = err.errors
    next(boom.badRequest(msg))
  } else {
    let { id } = req.params
    let query = `select * from sys_user where id=${id}`
    querySql(query).then((user) => {
      if (!user || user.length === 0) {
        res.json({
          code: -1,
          msg: '用户不存在',
          data: null,
        })
      } else {
        let query = `delete from sys_user where id=${id}`
        querySql(query).then((user) => {
          res.json({
            code: 0,
            msg: '删除成功',
            data: user,
          })
        })
      }
    })
  }
}
// 校验用户名和密码
function validateUser(username, oldPassword) {
  const query = `select id, username from sys_user where username='${username}' and password='${oldPassword}'`
  return queryOne(query)
}

// 通过用户名查询用户信息
function findUser(username) {
  const query = `select id, username from sys_user where username='${username}'`
  return queryOne(query)
}

module.exports = {
  login,
  register,
  resetPwd,
  deleteUser,
  getUserList,
}
