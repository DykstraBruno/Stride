import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChecklistProgress } from './ChecklistProgress'
import { makeTask } from '../test/mocks'

describe('ChecklistProgress', () => {
  it('renders nothing when no tasks', () => {
    const { container } = render(<ChecklistProgress tasks={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('shows 0% when no tasks are completed', () => {
    const tasks = [makeTask({ status: 'pending' }), makeTask({ id: '2', status: 'pending' })]
    render(<ChecklistProgress tasks={tasks} />)
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('shows 100% when all tasks are completed', () => {
    const tasks = [
      makeTask({ status: 'completed' }),
      makeTask({ id: '2', status: 'completed' }),
    ]
    render(<ChecklistProgress tasks={tasks} />)
    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getByText('Parabéns! Todas as tarefas concluídas!')).toBeInTheDocument()
  })

  it('shows 50% when half are completed', () => {
    const tasks = [
      makeTask({ status: 'completed' }),
      makeTask({ id: '2', status: 'pending' }),
    ]
    render(<ChecklistProgress tasks={tasks} />)
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('shows overdue tasks count', () => {
    const tasks = [
      makeTask({ status: 'overdue' }),
      makeTask({ id: '2', status: 'pending' }),
    ]
    render(<ChecklistProgress tasks={tasks} />)
    expect(screen.getByText('Atrasadas')).toBeInTheDocument()
  })
})
