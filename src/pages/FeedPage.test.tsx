import { describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { FeedPage } from './FeedPage'
import { createTestQueryClient } from '@/test/test-utils'

function renderFeed() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter>
        <FeedPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('FeedPage tabs', () => {
  it('shows 4 tabs: Todo, Posts, Hospedaje, Transporte', async () => {
    renderFeed()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Todo' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Posts' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Hospedaje' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Transporte' })).toBeInTheDocument()
    })
  })
})
