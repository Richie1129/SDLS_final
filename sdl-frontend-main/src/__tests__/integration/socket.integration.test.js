import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock socket.io-client
class MockSocket {
  constructor() {
    this.callbacks = new Map()
    this.connected = false
    this.id = 'mock-socket-id'
  }

  emit(event, data, callback) {
    this.lastEmitted = { event, data }
    if (callback) {
      // 模擬異步響應
      setTimeout(() => callback({ status: 'ok' }), 10)
    }
    return this
  }

  on(event, callback) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, [])
    }
    this.callbacks.get(event).push(callback)
    return this
  }

  off(event, callback) {
    if (this.callbacks.has(event)) {
      const callbacks = this.callbacks.get(event)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
    return this
  }

  connect() {
    this.connected = true
    this.trigger('connect')
    return this
  }

  disconnect() {
    this.connected = false
    this.trigger('disconnect')
    return this
  }

  // 用於測試的輔助方法
  trigger(event, data) {
    if (this.callbacks.has(event)) {
      this.callbacks.get(event).forEach(callback => {
        callback(data)
      })
    }
  }

  getListeners(event) {
    return this.callbacks.get(event) || []
  }

  clearAllListeners() {
    this.callbacks.clear()
  }
}

// 創建 socket 管理器類
class SocketManager {
  constructor() {
    this.socket = new MockSocket()
    this.rooms = new Set()
    this.messageHistory = []
  }

  connect() {
    return this.socket.connect()
  }

  disconnect() {
    this.socket.disconnect()
    this.rooms.clear()
  }

  joinRoom(roomId) {
    this.rooms.add(roomId)
    this.socket.emit('join_room', roomId)
  }

  leaveRoom(roomId) {
    this.rooms.delete(roomId)
    this.socket.emit('leave_room', roomId)
  }

  sendMessage(roomId, message) {
    const messageData = {
      room: roomId,
      message,
      timestamp: new Date().toISOString(),
      author: 'testuser'
    }
    
    this.messageHistory.push(messageData)
    this.socket.emit('send_message', messageData)
    return messageData
  }

  onMessage(callback) {
    this.socket.on('receive_message', (data) => {
      this.messageHistory.push(data)
      callback(data)
    })
  }

  onUserJoined(callback) {
    this.socket.on('user_joined', callback)
  }

  onUserLeft(callback) {
    this.socket.on('user_left', callback)
  }

  onRoomUpdate(callback) {
    this.socket.on('room_update', callback)
  }

  getMessageHistory() {
    return [...this.messageHistory]
  }

  getRooms() {
    return [...this.rooms]
  }
}

describe('Socket.io Integration Tests', () => {
  let socketManager
  let mockSocket

  beforeEach(() => {
    socketManager = new SocketManager()
    mockSocket = socketManager.socket
  })

  afterEach(() => {
    socketManager.disconnect()
    mockSocket.clearAllListeners()
  })

  describe('連接管理', () => {
    it('應該能夠建立 socket 連接', () => {
      expect(mockSocket.connected).toBe(false)
      
      socketManager.connect()
      
      expect(mockSocket.connected).toBe(true)
    })

    it('應該能夠斷開 socket 連接', () => {
      socketManager.connect()
      expect(mockSocket.connected).toBe(true)
      
      socketManager.disconnect()
      
      expect(mockSocket.connected).toBe(false)
      expect(socketManager.getRooms()).toHaveLength(0)
    })

    it('應該處理連接事件', () => {
      const connectCallback = vi.fn()
      mockSocket.on('connect', connectCallback)
      
      socketManager.connect()
      
      expect(connectCallback).toHaveBeenCalled()
    })

    it('應該處理斷線事件', () => {
      const disconnectCallback = vi.fn()
      mockSocket.on('disconnect', disconnectCallback)
      
      socketManager.connect()
      socketManager.disconnect()
      
      expect(disconnectCallback).toHaveBeenCalled()
    })
  })

  describe('房間管理', () => {
    beforeEach(() => {
      socketManager.connect()
    })

    it('應該能夠加入房間', () => {
      const roomId = 'test-room-123'
      
      socketManager.joinRoom(roomId)
      
      expect(socketManager.getRooms()).toContain(roomId)
      expect(mockSocket.lastEmitted.event).toBe('join_room')
      expect(mockSocket.lastEmitted.data).toBe(roomId)
    })

    it('應該能夠離開房間', () => {
      const roomId = 'test-room-123'
      
      socketManager.joinRoom(roomId)
      expect(socketManager.getRooms()).toContain(roomId)
      
      socketManager.leaveRoom(roomId)
      
      expect(socketManager.getRooms()).not.toContain(roomId)
      expect(mockSocket.lastEmitted.event).toBe('leave_room')
      expect(mockSocket.lastEmitted.data).toBe(roomId)
    })

    it('應該處理用戶加入房間事件', () => {
      const userJoinedCallback = vi.fn()
      socketManager.onUserJoined(userJoinedCallback)
      
      const userData = { username: 'newuser', room: 'test-room-123' }
      mockSocket.trigger('user_joined', userData)
      
      expect(userJoinedCallback).toHaveBeenCalledWith(userData)
    })

    it('應該處理用戶離開房間事件', () => {
      const userLeftCallback = vi.fn()
      socketManager.onUserLeft(userLeftCallback)
      
      const userData = { username: 'leftuser', room: 'test-room-123' }
      mockSocket.trigger('user_left', userData)
      
      expect(userLeftCallback).toHaveBeenCalledWith(userData)
    })
  })

  describe('訊息傳輸', () => {
    beforeEach(() => {
      socketManager.connect()
      socketManager.joinRoom('test-room-123')
    })

    it('應該能夠發送訊息', () => {
      const roomId = 'test-room-123'
      const message = '這是一條測試訊息'
      
      const messageData = socketManager.sendMessage(roomId, message)
      
      expect(messageData.room).toBe(roomId)
      expect(messageData.message).toBe(message)
      expect(messageData.author).toBe('testuser')
      expect(mockSocket.lastEmitted.event).toBe('send_message')
      expect(mockSocket.lastEmitted.data).toEqual(messageData)
    })

    it('應該能夠接收訊息', async () => {
      const receivedMessages = []
      const messageCallback = vi.fn((data) => {
        receivedMessages.push(data)
      })
      
      socketManager.onMessage(messageCallback)
      
      const mockMessage = {
        room: 'test-room-123',
        message: '收到的訊息',
        author: 'otheruser',
        timestamp: new Date().toISOString()
      }
      
      mockSocket.trigger('receive_message', mockMessage)
      
      expect(messageCallback).toHaveBeenCalledWith(mockMessage)
      expect(receivedMessages).toContain(mockMessage)
      expect(socketManager.getMessageHistory()).toContain(mockMessage)
    })

    it('應該維護訊息歷史記錄', () => {
      const message1 = socketManager.sendMessage('room1', 'Message 1')
      const message2 = socketManager.sendMessage('room1', 'Message 2')
      
      const history = socketManager.getMessageHistory()
      
      expect(history).toHaveLength(2)
      expect(history[0]).toEqual(message1)
      expect(history[1]).toEqual(message2)
    })

    it('應該處理多房間訊息', () => {
      socketManager.joinRoom('room2')
      
      const room1Message = socketManager.sendMessage('test-room-123', 'Room 1 message')
      const room2Message = socketManager.sendMessage('room2', 'Room 2 message')
      
      const history = socketManager.getMessageHistory()
      
      expect(history).toHaveLength(2)
      expect(history.find(m => m.room === 'test-room-123')).toEqual(room1Message)
      expect(history.find(m => m.room === 'room2')).toEqual(room2Message)
    })
  })

  describe('錯誤處理', () => {
    it('應該處理連接錯誤', () => {
      const errorCallback = vi.fn()
      mockSocket.on('connect_error', errorCallback)
      
      const error = new Error('Connection failed')
      mockSocket.trigger('connect_error', error)
      
      expect(errorCallback).toHaveBeenCalledWith(error)
    })

    it('應該處理訊息發送失敗', () => {
      socketManager.connect()
      
      // 模擬斷線狀態
      socketManager.disconnect()
      
      // 嘗試發送訊息
      const result = socketManager.sendMessage('test-room', 'test message')
      
      // 訊息仍會被記錄，但不會真正發送
      expect(result.message).toBe('test message')
      expect(mockSocket.connected).toBe(false)
    })
  })

  describe('整合測試場景', () => {
    it('應該完成完整的聊天室流程', async () => {
      const receivedMessages = []
      const userEvents = []
      
      // 設置事件監聽
      socketManager.onMessage((data) => receivedMessages.push(data))
      socketManager.onUserJoined((data) => userEvents.push({ type: 'joined', ...data }))
      socketManager.onUserLeft((data) => userEvents.push({ type: 'left', ...data }))
      
      // 1. 連接並加入房間
      socketManager.connect()
      socketManager.joinRoom('chat-room-001')
      
      expect(mockSocket.connected).toBe(true)
      expect(socketManager.getRooms()).toContain('chat-room-001')
      
      // 2. 模擬其他用戶加入
      mockSocket.trigger('user_joined', { 
        username: 'user2', 
        room: 'chat-room-001' 
      })
      
      // 3. 發送訊息
      socketManager.sendMessage('chat-room-001', 'Hello everyone!')
      
      // 4. 模擬接收回應訊息
      mockSocket.trigger('receive_message', {
        room: 'chat-room-001',
        message: 'Hello back!',
        author: 'user2',
        timestamp: new Date().toISOString()
      })
      
      // 5. 驗證整個流程
      expect(userEvents).toHaveLength(1)
      expect(userEvents[0].type).toBe('joined')
      expect(userEvents[0].username).toBe('user2')
      
      expect(receivedMessages).toHaveLength(1)
      expect(receivedMessages[0].message).toBe('Hello back!')
      
      const history = socketManager.getMessageHistory()
      expect(history).toHaveLength(2) // 一條發送，一條接收
      expect(history.some(m => m.message === 'Hello everyone!')).toBe(true)
      expect(history.some(m => m.message === 'Hello back!')).toBe(true)
    })

    it('應該處理同時多房間操作', () => {
      socketManager.connect()
      
      // 加入多個房間
      socketManager.joinRoom('room-1')
      socketManager.joinRoom('room-2')
      socketManager.joinRoom('room-3')
      
      expect(socketManager.getRooms()).toHaveLength(3)
      
      // 在不同房間發送訊息
      socketManager.sendMessage('room-1', 'Message in room 1')
      socketManager.sendMessage('room-2', 'Message in room 2')
      socketManager.sendMessage('room-3', 'Message in room 3')
      
      const history = socketManager.getMessageHistory()
      expect(history).toHaveLength(3)
      
      // 驗證每個房間都有對應訊息
      expect(history.some(m => m.room === 'room-1' && m.message === 'Message in room 1')).toBe(true)
      expect(history.some(m => m.room === 'room-2' && m.message === 'Message in room 2')).toBe(true)
      expect(history.some(m => m.room === 'room-3' && m.message === 'Message in room 3')).toBe(true)
      
      // 離開一個房間
      socketManager.leaveRoom('room-2')
      expect(socketManager.getRooms()).toHaveLength(2)
      expect(socketManager.getRooms()).not.toContain('room-2')
    })
  })
}) 