import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock axios 模組
const mockAxios = {
  post: vi.fn(),
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn()
}

vi.mock('axios', () => ({
  default: mockAxios,
  ...mockAxios
}))

// 直接導入 API 函數，這樣它們會使用 mocked axios
import {
  userLogin,
  userRegister,
  getProjectUser,
  getAllTeachers
} from '../../api/users.js'
import {
  getProject,
  getAllProject,
  createProject,
  updateProject,
  deleteProject
} from '../../api/project.js'

describe('API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('User API', () => {
    it('應該成功登入用戶', async () => {
      const userData = { username: 'testuser', password: 'password123' }
      const mockResponse = { 
        data: { 
          id: 1, 
          username: 'testuser', 
          token: 'mock-jwt-token' 
        } 
      }

      mockAxios.post.mockResolvedValue(mockResponse)

      const response = await userLogin(userData)
      
      expect(mockAxios.post).toHaveBeenCalledWith('http://localhost/api/users/login', userData)
      expect(response.data.username).toBe('testuser')
      expect(response.data.token).toBe('mock-jwt-token')
    })

    it('應該處理登入失敗', async () => {
      const userData = { username: 'wronguser', password: 'wrongpass' }
      
      const mockError = {
        response: {
          status: 401,
          data: { error: 'Invalid credentials' }
        }
      }

      mockAxios.post.mockRejectedValue(mockError)

      try {
        await userLogin(userData)
        expect.fail('應該拋出錯誤')
      } catch (error) {
        expect(error.response.status).toBe(401)
        expect(error.response.data.error).toBe('Invalid credentials')
      }
    })

    it('應該成功註冊用戶', async () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@test.com',
        password: 'password123'
      }
      
      const mockResponse = {
        status: 201,
        data: {
          id: 2,
          username: 'newuser',
          email: 'newuser@test.com'
        }
      }

      mockAxios.post.mockResolvedValue(mockResponse)

      const response = await userRegister(userData)
      
      expect(response.status).toBe(201)
      expect(response.data.username).toBe('newuser')
    })

    it('應該獲取專案用戶列表', async () => {
      const projectId = '123'
      const mockUsers = [
        { id: 1, username: 'user1', role: 'student' },
        { id: 2, username: 'user2', role: 'teacher' }
      ]

      mockAxios.get.mockResolvedValue({ data: mockUsers })

      const response = await getProjectUser(projectId)
      
      expect(mockAxios.get).toHaveBeenCalledWith(`http://localhost/api/users/project/${projectId}`)
      expect(Array.isArray(response)).toBe(true)
      expect(response).toHaveLength(2)
      expect(response[0].username).toBe('user1')
    })

    it('應該獲取所有老師', async () => {
      const mockTeachers = [
        { id: 1, username: 'teacher1', role: 'teacher' },
        { id: 2, username: 'teacher2', role: 'teacher' }
      ]

      mockAxios.get.mockResolvedValue({ data: mockTeachers })

      const response = await getAllTeachers()
      
      expect(mockAxios.get).toHaveBeenCalledWith('http://localhost/api/users/teachers')
      expect(Array.isArray(response)).toBe(true)
      expect(response).toHaveLength(2)
      expect(response.every(user => user.role === 'teacher')).toBe(true)
    })
  })

  describe('Project API', () => {
    it('應該獲取單個專案', async () => {
      const projectId = '456'
      const mockProject = {
        id: 456,
        title: 'Test Project',
        description: 'A test project',
        status: 'active'
      }

      mockAxios.get.mockResolvedValue({ data: mockProject })

      const response = await getProject(projectId)
      
      expect(mockAxios.get).toHaveBeenCalledWith(`http://localhost/api/projects/${projectId}`)
      expect(response.id).toBe(456)
      expect(response.title).toBe('Test Project')
    })

    it('應該獲取所有專案', async () => {
      const mockProjects = [
        { id: 1, title: 'Project 1' },
        { id: 2, title: 'Project 2' }
      ]

      mockAxios.get.mockResolvedValue({ data: mockProjects })

      const response = await getAllProject()
      
      expect(mockAxios.get).toHaveBeenCalledWith('http://localhost/api/projects/')
      expect(Array.isArray(response)).toBe(true)
      expect(response).toHaveLength(2)
    })

    it('應該創建新專案', async () => {
      const newProject = {
        title: 'New Project',
        description: 'New project description'
      }

      const mockCreatedProject = {
        id: 789,
        ...newProject,
        createdAt: '2024-01-01T00:00:00Z'
      }

      mockAxios.post.mockResolvedValue({ data: mockCreatedProject })

      const response = await createProject(newProject)
      
      expect(mockAxios.post).toHaveBeenCalledWith('http://localhost/api/projects/', newProject)
      expect(response.id).toBe(789)
      expect(response.title).toBe('New Project')
    })

    it('應該更新專案', async () => {
      const projectId = '456'
      const updateData = { title: 'Updated Project Title' }
      
      const mockUpdatedProject = {
        id: 456,
        title: 'Updated Project Title',
        description: 'Original description'
      }

      mockAxios.put.mockResolvedValue({ data: mockUpdatedProject })

      const response = await updateProject(projectId, updateData)
      
      expect(mockAxios.put).toHaveBeenCalledWith(`http://localhost/api/projects/${projectId}`, updateData)
      expect(response.title).toBe('Updated Project Title')
    })

    it('應該刪除專案', async () => {
      const projectId = '456'
      
      mockAxios.delete.mockResolvedValue({
        data: { message: 'Project deleted successfully' }
      })

      const response = await deleteProject(projectId)
      
      expect(mockAxios.delete).toHaveBeenCalledWith(`http://localhost/api/projects/${projectId}`)
      expect(response.message).toBe('Project deleted successfully')
    })
  })

  describe('API Error Handling', () => {
    it('應該處理網路錯誤', async () => {
      const networkError = new Error('Network Error')
      networkError.code = 'ERR_NETWORK'
      
      mockAxios.get.mockRejectedValue(networkError)

      try {
        await getProject('999')
        expect.fail('應該拋出錯誤')
      } catch (error) {
        expect(error.message).toContain('Network Error')
      }
    })

    it('應該處理超時錯誤', async () => {
      const timeoutError = new Error('Timeout')
      timeoutError.code = 'ERR_NETWORK'
      
      mockAxios.get.mockRejectedValue(timeoutError)

      try {
        await getProject('999')
        expect.fail('應該拋出錯誤')
      } catch (error) {
        expect(error.code).toBe('ERR_NETWORK')
      }
    })

    it('應該處理 404 錯誤', async () => {
      const mockError = {
        response: {
          status: 404,
          data: { error: 'Project not found' }
        }
      }

      mockAxios.get.mockRejectedValue(mockError)

      try {
        await getProject('nonexistent')
        expect.fail('應該拋出錯誤')
      } catch (error) {
        expect(error.response.status).toBe(404)
        expect(error.response.data.error).toBe('Project not found')
      }
    })
  })

  describe('API Integration Flow', () => {
    it('應該完成用戶登入到專案創建的完整流程', async () => {
      // 1. 用戶登入
      const userData = { username: 'testuser', password: 'password123' }
      mockAxios.post.mockResolvedValueOnce({
        data: {
          id: 1,
          username: 'testuser',
          token: 'jwt-token'
        }
      })

      const loginResponse = await userLogin(userData)
      expect(loginResponse.data.token).toBe('jwt-token')

      // 2. 創建新專案
      const projectData = {
        title: 'Integration Test Project',
        description: 'Created via integration test'
      }
      
      mockAxios.post.mockResolvedValueOnce({
        data: {
          id: 999,
          ...projectData,
          ownerId: 1
        }
      })

      const projectResponse = await createProject(projectData)
      expect(projectResponse.id).toBe(999)
      expect(projectResponse.ownerId).toBe(1)

      // 3. 獲取專案詳情
      mockAxios.get.mockResolvedValueOnce({
        data: {
          id: 999,
          ...projectData,
          ownerId: 1,
          status: 'active'
        }
      })

      const getProjectResponse = await getProject('999')
      expect(getProjectResponse.title).toBe('Integration Test Project')
    })
  })
}) 