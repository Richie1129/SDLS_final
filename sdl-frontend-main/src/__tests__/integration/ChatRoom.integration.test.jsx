import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import MockAdapter from 'axios-mock-adapter'
import axios from 'axios'

// Mock socket.io-client - 移到外面定義
const mockSocket = {
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn()
}

vi.mock('../../utils/socket', () => ({
  socket: mockSocket
}))

// Mock getChatroomHistory API
vi.mock('../../api/chatroom', () => ({
  getChatroomHistory: vi.fn()
}))

// Mock useParams
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ projectId: 'test-project-123' }),
    useLocation: () => ({ pathname: '/project/test-project-123' })
  }
})

// 延遲導入 ChatRoom，確保所有 mock 都已設置
const ChatRoomWrapper = ({ chatRoomOpen = true, setChatRoomOpen = vi.fn() }) => {
  const ChatRoom = require('../../components/ChatRoom.jsx').default
  return (
    <BrowserRouter>
      <ChatRoom 
        chatRoomOpen={chatRoomOpen} 
        setChatRoomOpen={setChatRoomOpen} 
      />
    </BrowserRouter>
  )
}

describe('ChatRoom Integration Tests', () => {
  let mockAxios
  let mockSetChatRoomOpen
  let user

  beforeEach(() => {
    mockAxios = new MockAdapter(axios)
    mockSetChatRoomOpen = vi.fn()
    user = userEvent.setup()
    
    // Setup localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key) => {
          if (key === 'username') return 'testuser'
          if (key === 'id') return '1'
          return null
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      },
      writable: true
    })

    // Clear all mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    mockAxios.restore()
  })

  it('應該正確渲染聊天室界面', async () => {
    // Mock API response for chat history
    const { getChatroomHistory } = await import('../../api/chatroom')
    getChatroomHistory.mockResolvedValue([
      {
        id: 1,
        author: 'testuser',
        creator: '1',
        message: '測試訊息',
        createdAt: '2024-01-15T12:00:00Z'
      }
    ])

    render(<ChatRoomWrapper />)

    expect(screen.getByText('小組討論區')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    
    // Wait for history to load
    await waitFor(() => {
      expect(getChatroomHistory).toHaveBeenCalledWith('test-project-123')
    })
  })

  it('應該發送訊息並更新聊天列表', async () => {
    const { getChatroomHistory } = await import('../../api/chatroom')
    getChatroomHistory.mockResolvedValue([])

    render(<ChatRoomWrapper />)

    const input = screen.getByRole('textbox')
    const sendButton = screen.getByRole('button')

    // 輸入訊息
    await user.type(input, '這是一條測試訊息')
    expect(input.value).toBe('這是一條測試訊息')

    // 點擊發送
    await user.click(sendButton)

    // 驗證 socket 被調用
    expect(mockSocket.emit).toHaveBeenCalledWith('send_message', expect.objectContaining({
      room: 'test-project-123',
      author: 'testuser',
      creator: '1',
      message: '這是一條測試訊息'
    }))

    // 輸入框應該被清空
    expect(input.value).toBe('')
  })

  it('應該使用 Enter 鍵發送訊息', async () => {
    const { getChatroomHistory } = await import('../../api/chatroom')
    getChatroomHistory.mockResolvedValue([])

    render(<ChatRoomWrapper />)

    const input = screen.getByRole('textbox')

    await user.type(input, '使用 Enter 發送{enter}')

    expect(mockSocket.emit).toHaveBeenCalledWith('send_message', expect.objectContaining({
      message: '使用 Enter 發送'
    }))
  })

  it('應該過濾空白訊息', async () => {
    const { getChatroomHistory } = await import('../../api/chatroom')
    getChatroomHistory.mockResolvedValue([])

    render(<ChatRoomWrapper />)

    const input = screen.getByRole('textbox')
    const sendButton = screen.getByRole('button')

    // 嘗試發送空白訊息
    await user.type(input, '   ')
    await user.click(sendButton)

    expect(mockSocket.emit).not.toHaveBeenCalled()
  })

  it('應該正確處理接收到的訊息', async () => {
    const { getChatroomHistory } = await import('../../api/chatroom')
    getChatroomHistory.mockResolvedValue([])

    render(<ChatRoomWrapper />)

    // 模擬 socket 事件監聽
    expect(mockSocket.on).toHaveBeenCalledWith('receive_message', expect.any(Function))

    // 獲取監聽函數
    const receiveMessageCallback = mockSocket.on.mock.calls.find(
      call => call[0] === 'receive_message'
    )[1]

    // 模擬接收訊息
    const mockMessage = {
      author: 'otheruser',
      creator: '2',
      message: '來自其他用戶的訊息',
      createdAt: '2024-01-15T12:05:00Z'
    }

    receiveMessageCallback(mockMessage)

    // 這裡可以進一步測試訊息是否正確顯示在界面上
  })

  it('應該在聊天室打開時加入房間', async () => {
    const { getChatroomHistory } = await import('../../api/chatroom')
    getChatroomHistory.mockResolvedValue([])

    render(<ChatRoomWrapper chatRoomOpen={true} />)

    expect(mockSocket.emit).toHaveBeenCalledWith('join_room', 'test-project-123')
  })

  it('應該正確關閉聊天室', async () => {
    const mockSetChatRoomOpen = vi.fn()
    const { getChatroomHistory } = await import('../../api/chatroom')
    getChatroomHistory.mockResolvedValue([])

    render(<ChatRoomWrapper setChatRoomOpen={mockSetChatRoomOpen} />)

    const closeButton = screen.getByRole('button', { name: /close/i }) || 
                      screen.getByLabelText(/close/i) ||
                      screen.getByTitle(/close/i) ||
                      document.querySelector('button svg').closest('button')

    if (closeButton) {
      await user.click(closeButton)
      expect(mockSetChatRoomOpen).toHaveBeenCalledWith(false)
    }
  })

  it('應該處理聊天歷史載入錯誤', async () => {
    const { getChatroomHistory } = await import('../../api/chatroom')
    getChatroomHistory.mockRejectedValue(new Error('Failed to fetch history'))

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<ChatRoomWrapper />)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to fetch chatroom history:',
        expect.any(Error)
      )
    })

    consoleSpy.mockRestore()
  })

  it('應該正確格式化時間顯示', async () => {
    const { getChatroomHistory } = await import('../../api/chatroom')
    
    const mockHistory = [
      {
        id: 1,
        author: 'testuser',
        creator: '1',
        message: '今天的訊息',
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        author: 'testuser',
        creator: '1', 
        message: '昨天的訊息',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      }
    ]

    getChatroomHistory.mockResolvedValue(mockHistory)

    render(<ChatRoomWrapper />)

    await waitFor(() => {
      expect(screen.getByText('今天的訊息')).toBeInTheDocument()
      expect(screen.getByText('昨天的訊息')).toBeInTheDocument()
    })

    // 檢查是否有今天的標示
    await waitFor(() => {
      expect(screen.getByText('-今天-')).toBeInTheDocument()
    })
  })
}) 