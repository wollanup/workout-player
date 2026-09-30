// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Providers } from '../../app/Providers.jsx';
import { AppHeader } from './AppHeader.jsx';

afterEach(() => { cleanup(); localStorage.clear(); });

describe('AppHeader', () => {
  it('shows the app name and a menu with theme and help', async () => {
    render(<Providers><AppHeader /></Providers>);
    expect(screen.getByText('Workout Player')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Menu' }));
    const items = await screen.findAllByRole('menuitem');
    expect(items.map(i => i.textContent)).toEqual(['Thème', 'Aide']);
  });

  it('persists the accent color and color scheme', async () => {
    render(<Providers><AppHeader /></Providers>);
    await userEvent.click(screen.getByRole('button', { name: 'Menu' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Thème' }));
    await userEvent.click(await screen.findByRole('button', { name: 'violet' }));
    expect(JSON.parse(localStorage.getItem('wp.accent'))).toBe('violet');
    expect(screen.getByRole('button', { name: 'violet' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByText('Clair'));
    expect(localStorage.getItem('mantine-color-scheme-value')).toBe('light');
  });
});
