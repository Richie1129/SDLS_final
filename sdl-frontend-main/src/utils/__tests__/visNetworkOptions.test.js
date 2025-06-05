import { describe, it, expect } from 'vitest'
import { visNetworkOptions } from '../visNetworkOptions.js'

describe('visNetworkOptions', () => {
  it('應該有正確的邊緣配置', () => {
    expect(visNetworkOptions.edges).toBeDefined()
    expect(visNetworkOptions.edges.arrows.to.enabled).toBe(true)
    expect(visNetworkOptions.edges.arrows.to.scaleFactor).toBe(0.5)
    expect(visNetworkOptions.edges.arrows.to.type).toBe('arrow')
  })

  it('應該有平滑的邊緣設置', () => {
    expect(visNetworkOptions.edges.smooth.enabled).toBe(true)
    expect(visNetworkOptions.edges.smooth.type).toBe('dynamic')
  })

  it('應該有正確的顏色配置', () => {
    const colors = visNetworkOptions.edges.color
    expect(colors.color).toBe('#4d4c4c')
    expect(colors.highlight).toBe('#121619')
    expect(colors.hover).toBe('#353535')
  })

  it('應該啟用物理引擎', () => {
    expect(visNetworkOptions.physics.enabled).toBe(true)
    expect(visNetworkOptions.physics.barnesHut.avoidOverlap).toBe(0.2)
  })

  it('應該啟用交互功能', () => {
    expect(visNetworkOptions.interaction.hover).toBe(true)
  })

  it('應該啟用操作功能', () => {
    expect(visNetworkOptions.manipulation.enabled).toBe(true)
  })

  it('應該是一個有效的配置對象', () => {
    expect(typeof visNetworkOptions).toBe('object')
    expect(visNetworkOptions).not.toBeNull()
  })

  it('應該有所有必需的頂層屬性', () => {
    const requiredProperties = ['edges', 'physics', 'interaction', 'manipulation']
    
    requiredProperties.forEach(prop => {
      expect(visNetworkOptions).toHaveProperty(prop)
    })
  })
}) 