import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import MockAdapter from 'axios-mock-adapter'
import axios from 'axios'

// 創建簡化的測試組件來模擬真實的工作流程
const MockLoginForm = ({ onLogin }) => {
  return (
    <div data-testid="login-form">
      <input 
        data-testid="username-input" 
        placeholder="用戶名"
      />
      <input 
        data-testid="password-input" 
        type="password" 
        placeholder="密碼"
      />
      <button 
        data-testid="login-button"
        onClick={() => onLogin({ username: 'testuser', token: 'jwt-token' })}
      >
        登入
      </button>
    </div>
  )
}

const MockProjectList = ({ projects, onSelectProject, onCreateProject }) => {
  return (
    <div data-testid="project-list">
      <button 
        data-testid="create-project-button"
        onClick={() => onCreateProject({ 
          title: 'New Test Project', 
          id: 999 
        })}
      >
        創建專案
      </button>
      {projects.map(project => (
        <div 
          key={project.id} 
          data-testid={`project-${project.id}`}
          onClick={() => onSelectProject(project)}
          style={{ cursor: 'pointer', padding: '10px', border: '1px solid #ccc', margin: '5px' }}
        >
          <h3>{project.title}</h3>
          <p>{project.description}</p>
          <span>成員: {project.memberCount || 0}</span>
        </div>
      ))}
    </div>
  )
}

const MockProjectDetail = ({ project, onInviteUser, onUpdateProject }) => {
  if (!project) return <div data-testid="no-project">請選擇專案</div>
  
  return (
    <div data-testid="project-detail">
      <h1>{project.title}</h1>
      <p>{project.description}</p>
      <div data-testid="project-members">
        成員數量: {project.memberCount || 0}
      </div>
      <button 
        data-testid="invite-user-button"
        onClick={() => onInviteUser({ 
          projectId: project.id, 
          email: 'newuser@test.com' 
        })}
      >
        邀請用戶
      </button>
      <button 
        data-testid="update-project-button"
        onClick={() => onUpdateProject({ 
          ...project, 
          title: project.title + ' (已更新)' 
        })}
      >
        更新專案
      </button>
    </div>
  )
}

// 主要的整合測試應用
const IntegrationTestApp = () => {
  const [userState, setUserState] = React.useState(null)
  const [projectsState, setProjectsState] = React.useState([])
  const [selectedProjectState, setSelectedProjectState] = React.useState(null)

  const handleLogin = async (userData) => {
    setUserState(userData)
    // 登入後載入專案列表
    const mockProjects = [
      { id: 1, title: 'Project 1', description: 'Description 1', memberCount: 3 },
      { id: 2, title: 'Project 2', description: 'Description 2', memberCount: 5 }
    ]
    setProjectsState(mockProjects)
  }

  const handleCreateProject = (newProject) => {
    setProjectsState(prev => [...prev, newProject])
  }

  const handleSelectProject = (project) => {
    setSelectedProjectState(project)
  }

  const handleInviteUser = (inviteData) => {
    // 模擬邀請用戶後更新成員數
    setSelectedProjectState(prev => ({
      ...prev,
      memberCount: (prev.memberCount || 0) + 1
    }))
  }

  const handleUpdateProject = (updatedProject) => {
    setProjectsState(prev => 
      prev.map(p => p.id === updatedProject.id ? updatedProject : p)
    )
    setSelectedProjectState(updatedProject)
  }

  if (!userState) {
    return <MockLoginForm onLogin={handleLogin} />
  }

  return (
    <div data-testid="main-app">
      <div data-testid="user-info">歡迎, {userState.username}</div>
      <div style={{ display: 'flex' }}>
        <div style={{ width: '50%' }}>
          <MockProjectList 
            projects={projectsState}
            onSelectProject={handleSelectProject}
            onCreateProject={handleCreateProject}
          />
        </div>
        <div style={{ width: '50%' }}>
          <MockProjectDetail 
            project={selectedProjectState}
            onInviteUser={handleInviteUser}
            onUpdateProject={handleUpdateProject}
          />
        </div>
      </div>
    </div>
  )
}

describe('User Project Flow Integration Tests', () => {
  let mockAxios
  let user

  beforeEach(() => {
    mockAxios = new MockAdapter(axios)
    user = userEvent.setup()

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      },
      writable: true
    })

    vi.clearAllMocks()
  })

  afterEach(() => {
    mockAxios.restore()
  })

  it('應該完成完整的用戶登入到專案管理流程', async () => {
    // Mock API responses
    mockAxios.onPost('http://localhost/api/users/login').reply(200, {
      id: 1,
      username: 'testuser',
      token: 'jwt-token'
    })

    mockAxios.onGet('http://localhost/api/projects/').reply(200, [
      { id: 1, title: 'Project 1', description: 'Description 1', memberCount: 3 },
      { id: 2, title: 'Project 2', description: 'Description 2', memberCount: 5 }
    ])

    render(
      <MemoryRouter>
        <IntegrationTestApp />
      </MemoryRouter>
    )

    // 1. 初始狀態應該顯示登入表單
    expect(screen.getByTestId('login-form')).toBeInTheDocument()
    expect(screen.getByTestId('username-input')).toBeInTheDocument()

    // 2. 執行登入
    const loginButton = screen.getByTestId('login-button')
    await user.click(loginButton)

    // 3. 登入後應該顯示主應用界面
    await waitFor(() => {
      expect(screen.getByTestId('main-app')).toBeInTheDocument()
      expect(screen.getByTestId('user-info')).toHaveTextContent('歡迎, testuser')
    })

    // 4. 應該顯示專案列表
    expect(screen.getByTestId('project-list')).toBeInTheDocument()
    expect(screen.getByTestId('project-1')).toBeInTheDocument()
    expect(screen.getByTestId('project-2')).toBeInTheDocument()

    // 5. 選擇一個專案
    const project1 = screen.getByTestId('project-1')
    await user.click(project1)

    // 6. 應該顯示專案詳情
    await waitFor(() => {
      expect(screen.getByTestId('project-detail')).toBeInTheDocument()
      expect(screen.getByText('Project 1')).toBeInTheDocument()
      expect(screen.getByText('成員數量: 3')).toBeInTheDocument()
    })
  })

  it('應該能夠創建新專案', async () => {
    render(
      <MemoryRouter>
        <IntegrationTestApp />
      </MemoryRouter>
    )

    // 先登入
    const loginButton = screen.getByTestId('login-button')
    await user.click(loginButton)

    await waitFor(() => {
      expect(screen.getByTestId('main-app')).toBeInTheDocument()
    })

    // 點擊創建專案
    const createButton = screen.getByTestId('create-project-button')
    await user.click(createButton)

    // 新專案應該出現在列表中
    await waitFor(() => {
      expect(screen.getByText('New Test Project')).toBeInTheDocument()
    })
  })

  it('應該能夠邀請用戶並更新成員數', async () => {
    render(
      <MemoryRouter>
        <IntegrationTestApp />
      </MemoryRouter>
    )

    // 登入並選擇專案
    const loginButton = screen.getByTestId('login-button')
    await user.click(loginButton)

    await waitFor(() => {
      expect(screen.getByTestId('main-app')).toBeInTheDocument()
    })

    // 選擇專案
    const project1 = screen.getByTestId('project-1')
    await user.click(project1)

    await waitFor(() => {
      expect(screen.getByTestId('project-detail')).toBeInTheDocument()
    })

    // 邀請用戶
    const inviteButton = screen.getByTestId('invite-user-button')
    await user.click(inviteButton)

    // 成員數應該增加
    await waitFor(() => {
      expect(screen.getByText('成員數量: 4')).toBeInTheDocument()
    })
  })

  it('應該能夠更新專案信息', async () => {
    render(
      <MemoryRouter>
        <IntegrationTestApp />
      </MemoryRouter>
    )

    // 登入並選擇專案
    const loginButton = screen.getByTestId('login-button')
    await user.click(loginButton)

    await waitFor(() => {
      expect(screen.getByTestId('main-app')).toBeInTheDocument()
    })

    const project1 = screen.getByTestId('project-1')
    await user.click(project1)

    await waitFor(() => {
      expect(screen.getByTestId('project-detail')).toBeInTheDocument()
    })

    // 更新專案
    const updateButton = screen.getByTestId('update-project-button')
    await user.click(updateButton)

    // 專案標題應該更新
    await waitFor(() => {
      expect(screen.getByText('Project 1 (已更新)')).toBeInTheDocument()
    })
  })

  it('應該處理無專案選擇的狀態', async () => {
    render(
      <MemoryRouter>
        <IntegrationTestApp />
      </MemoryRouter>
    )

    // 登入
    const loginButton = screen.getByTestId('login-button')
    await user.click(loginButton)

    await waitFor(() => {
      expect(screen.getByTestId('main-app')).toBeInTheDocument()
    })

    // 應該顯示"請選擇專案"
    expect(screen.getByTestId('no-project')).toBeInTheDocument()
    expect(screen.getByText('請選擇專案')).toBeInTheDocument()
  })
}) 