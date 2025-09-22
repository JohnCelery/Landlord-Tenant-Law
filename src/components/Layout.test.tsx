import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import Layout from './Layout'
import type { ThemeMode } from '../utils/a11y'

const renderLayout = (theme: ThemeMode = 'light') =>
  render(
    <MemoryRouter>
      <Layout
        theme={theme}
        onThemeChange={() => {}}
        meters={{ compliance: 70, residentTrust: 70, ownerROI: 60, risk: 40 }}
      >
        <p>Child content</p>
      </Layout>
    </MemoryRouter>,
  )

describe('Layout', () => {
  it('renders navigation links and children', () => {
    renderLayout('dark')

    expect(screen.getByRole('heading', { name: /garden state manager/i })).toBeInTheDocument()
    expect(screen.getByText('Child content')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: /primary/i })).toBeInTheDocument()
  })
})
