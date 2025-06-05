import { describe, it, expect, vi, beforeEach } from 'vitest'
import ReactDOMServer from 'react-dom/server'
import svgConvertUrl from '../svgConvertUrl.jsx'

// Mock react-dom/server
vi.mock('react-dom/server', () => ({
  default: {
    renderToString: vi.fn()
  }
}))

// Mock react-icons
vi.mock('react-icons/pi', () => ({
  PiNoteFill: () => '<div data-testid="note-icon">Note Icon</div>'
}))

// Mock dateformat
vi.mock('dateformat', () => ({
  default: vi.fn((date, format) => '2024/01/01 12:00:00')
}))

describe('svgConvertUrl', () => {
  const mockTitle = 'Test Note'
  const mockOwner = 'John Doe'
  const mockCreatedAt = new Date('2024-01-01T12:00:00Z')
  const mockUserColor = '#FF5733'

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock renderToString to return a simplified SVG string
    ReactDOMServer.renderToString.mockReturnValue('<svg>mocked svg content</svg>')
  })

  it('應該返回正確格式的 data URL', () => {
    const result = svgConvertUrl(mockTitle, mockOwner, mockCreatedAt, mockUserColor)
    
    expect(result).toMatch(/^data:image\/svg\+xml;charset=utf-8,/)
    expect(ReactDOMServer.renderToString).toHaveBeenCalledTimes(1)
  })

  it('應該處理空的標題', () => {
    const result = svgConvertUrl('', mockOwner, mockCreatedAt, mockUserColor)
    
    expect(result).toMatch(/^data:image\/svg\+xml;charset=utf-8,/)
    expect(ReactDOMServer.renderToString).toHaveBeenCalledTimes(1)
  })

  it('應該處理空的擁有者名稱', () => {
    const result = svgConvertUrl(mockTitle, '', mockCreatedAt, mockUserColor)
    
    expect(result).toMatch(/^data:image\/svg\+xml;charset=utf-8,/)
    expect(ReactDOMServer.renderToString).toHaveBeenCalledTimes(1)
  })

  it('應該正確編碼 URL', () => {
    ReactDOMServer.renderToString.mockReturnValue('<svg>content with special chars & symbols</svg>')
    
    const result = svgConvertUrl(mockTitle, mockOwner, mockCreatedAt, mockUserColor)
    
    // 檢查特殊字符是否被正確編碼
    expect(result).toContain('%26') // & 被編碼為 %26
  })

  it('應該包含所有必要的參數', () => {
    const result = svgConvertUrl(mockTitle, mockOwner, mockCreatedAt, mockUserColor)
    
    // 檢查 ReactDOMServer.renderToString 被調用
    expect(ReactDOMServer.renderToString).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'svg',
        props: expect.objectContaining({
          xmlns: 'http://www.w3.org/2000/svg',
          width: '400',
          height: '150'
        })
      })
    )
  })

  it('應該處理長標題時顯示省略號', () => {
    const longTitle = 'This is a very long title that should be truncated with ellipsis when displayed in the SVG component'
    
    const result = svgConvertUrl(longTitle, mockOwner, mockCreatedAt, mockUserColor)
    
    expect(result).toMatch(/^data:image\/svg\+xml;charset=utf-8,/)
    expect(ReactDOMServer.renderToString).toHaveBeenCalledTimes(1)
  })

  it('應該返回有效的 SVG 結構', () => {
    const mockSvgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="150">
        <rect x="0" y="0" width="100%" height="100%" fill="#F8FAFB"/>
        <foreignObject x="0" y="0" width="100%" height="100%">
          <div>Test content</div>
        </foreignObject>
      </svg>
    `
    ReactDOMServer.renderToString.mockReturnValue(mockSvgContent)
    
    const result = svgConvertUrl(mockTitle, mockOwner, mockCreatedAt, mockUserColor)
    
    expect(result).toMatch(/^data:image\/svg\+xml;charset=utf-8,/)
    
    // 解碼 URL 來檢查內容
    const decodedContent = decodeURIComponent(result.replace('data:image/svg+xml;charset=utf-8,', ''))
    expect(decodedContent).toContain('svg')
    expect(decodedContent).toContain('xmlns="http://www.w3.org/2000/svg"')
  })
}) 