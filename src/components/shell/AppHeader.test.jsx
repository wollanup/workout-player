// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Providers } from '../../app/Providers.jsx';
import { AppHeader } from './AppHeader.jsx';

afterEach(() => { cleanup(); localStorage.clear(); });

describe('AppHeader', () => {
  it('shows the app name and a menu with sources, theme and help', async () => {
    render(<Providers><AppHeader /></Providers>);
    expect(screen.getByText('Workout Player')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Menu' }));
    const items = await screen.findAllByRole('menuitem');
    expect(items.map(i => i.textContent)).toEqual(['Sources', 'Thème', 'Aide']);
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

  it('toggles sources, keeps at least one, and hides Apple Music without developer token', async () => {
    render(<Providers><AppHeader apple={{ configured: false }} /></Providers>);
    await userEvent.click(screen.getByRole('button', { name: 'Menu' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Sources' }));
    expect(await screen.findByText(/Les publicités dépendent de ton abonnement/)).toBeInTheDocument();
    expect(screen.queryByRole('switch', { name: 'Apple Music' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('switch', { name: 'YouTube' }));
    expect(JSON.parse(localStorage.getItem('wp.sources'))).toEqual({ yt: false });
    expect(screen.getByRole('switch', { name: 'Fichier' })).toBeDisabled(); // last one left
  });

  it('mentions Apple Music in the help only when it is built in', async () => {
    const { unmount } = render(<Providers><AppHeader apple={{ configured: false }} /></Providers>);
    await userEvent.click(screen.getByRole('button', { name: 'Menu' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Aide' }));
    expect(await screen.findByText(/publique ou non répertoriée/)).toBeInTheDocument();
    expect(screen.queryByText(/Apple Music/)).not.toBeInTheDocument();
    unmount();
  });

  it('connects the Apple Music account from the sources', async () => {
    let authorized = false;
    const listeners = new Set();
    const apple = {
      configured: true,
      isAuthorized: () => authorized,
      subscribe: fn => { listeners.add(fn); return () => listeners.delete(fn); },
      authorize: vi.fn(async () => { authorized = true; listeners.forEach(fn => fn()); }),
      unauthorize: vi.fn(),
    };
    render(<Providers><AppHeader apple={apple} /></Providers>);
    await userEvent.click(screen.getByRole('button', { name: 'Menu' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Sources' }));
    expect(await screen.findByRole('switch', { name: 'Apple Music' })).toBeChecked();
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }));
    expect(apple.authorize).toHaveBeenCalled();
    expect(await screen.findByText('Connecté')).toBeInTheDocument();
  });
});
