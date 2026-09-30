// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App.jsx';

vi.mock('./services/storage.js', async orig => ({ ...await orig(), gcFiles: vi.fn(async () => {}) }));
const atList = () => expect(location.hash).toMatch(/^(#\/)?$/);

const back = () => act(async () => {
  history.back();
  await new Promise(r => setTimeout(r, 50));
});

afterEach(() => { cleanup(); localStorage.clear(); });

describe('App navigation', () => {
  it('keeps the editor in the URL and goes back to the list with the back button', async () => {
    render(<App />);
    await userEvent.click(await screen.findByRole('button', { name: 'Nouvelle séance' }));
    await waitFor(() => expect(location.hash).toMatch(/^#\/s\/[\w-]+$/));
    expect(screen.getByRole('button', { name: 'Retour' })).toBeInTheDocument();

    await back();
    await waitFor(atList);
    expect(await screen.findByRole('button', { name: 'Nouvelle séance' })).toBeInTheDocument();
  });

  it('sends unknown URLs to the list', async () => {
    location.hash = '#/s/nope';
    render(<App />);
    await waitFor(atList);
  });
});
