// server.js
const { WebSocketServer } = require('ws')
const https = require('https')

// 在本地 8080 端口启动 WebSocket 服务
const wss = new WebSocketServer({ port: process.env.PORT || 3000 })

// 用于存储在线客户端连接（Key: userId/doctorId, Value: wsSocket）
const clients = new Map()

console.log('🚀 WebSocket 聊天服务器已启动，监听端口: 8080')

wss.on('connection', (ws) => {
  let currentId = null

  // 监听客户端发来的消息
  ws.on('message', (messageBuffer) => {
    try {
      const data = JSON.parse(messageBuffer.toString())
      console.log('收到消息:', data)

      // 1. 客户端上线身份绑定
      if (data.type === 'bind') {
        currentId = data.userId // 例如 "user_101" 或 "doctor_201"
        clients.set(currentId, ws)
        console.log(`✅ 用户/医生上线绑定成功: ${currentId}`)
        return
      }

      // 2. 聊天消息转发 (type: 'chat')
      if (data.type === 'chat') {
        const { targetId, content, senderId } = data
        const targetSocket = clients.get(targetId)

        // 构建要发送给接收方的消息格式
        const payload = JSON.stringify({
          type: 'chat',
          senderId,
          content,
          timestamp: Date.now(),
        })

        // 如果目标在线，实时推送
        if (targetSocket && targetSocket.readyState === 1) {
          targetSocket.send(payload)
          console.log(`📩 消息已从 ${senderId} 成功推送到 ${targetId}`)
        } else {
          console.log(`⚠️ 目标 ${targetId} 不在线，可在真实业务中存入数据库作为未读消息`)
        }
      }
    } catch (err) {
      console.error('解析消息失败:', err)
    }
  })

  // 3. 客户端断开连接清理
  ws.on('close', () => {
    if (currentId) {
      clients.delete(currentId)
      console.log(`❌ 用户/医生下线: ${currentId}`)
    }
  })
})
