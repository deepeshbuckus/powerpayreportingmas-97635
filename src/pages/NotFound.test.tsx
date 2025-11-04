import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotFound from './NotFound';
import { BrowserRouter } from 'react-router-dom';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderNotFound = () => {
  return render(
    <BrowserRouter>
      <NotFound />
    </BrowserRouter>
  );
};

describe('NotFound Page', () => {
  it('renders 404 message', () => {
    renderNotFound();
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('renders page not found text', () => {
    renderNotFound();
    expect(screen.getByText(/Page Not Found/i)).toBeInTheDocument();
  });

  it('has a button to go back home', () => {
    renderNotFound();
    expect(screen.getByRole('button', { name: /Go Back Home/i })).toBeInTheDocument();
  });

  it('navigates to home when button is clicked', async () => {
    const user = userEvent.setup();
    renderNotFound();

    const homeButton = screen.getByRole('button', { name: /Go Back Home/i });
    await user.click(homeButton);

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
