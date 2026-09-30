// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup, render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Providers } from '../app/Providers.jsx';
import { SessionEditor } from './SessionEditor.jsx';
import { newMusic, newSession } from '../core/model.js';
import { beepPlan } from '../core/beeps.js';

const youtube = { playlistIds: vi.fn(), probe: vi.fn(async () => null) };
const beeper = { schedule: vi.fn(), cancel: vi.fn() };
const renderEditor = (session = newSession(), props = {}) => {
  const onSave = vi.fn();
  const onClose = vi.fn();
  render(<Providers><SessionEditor session={session} youtube={youtube} beeper={beeper} onSave={onSave} onClose={onClose} {...props} /></Providers>);
  return { onSave, onClose };
};

afterEach(() => { cleanup(); localStorage.clear(); });

describe('SessionEditor', () => {
  it('shows the total duration, updated live', async () => {
    renderEditor();
    expect(screen.getByTestId('total')).toHaveTextContent('0:05'); // lead only
    await userEvent.click(screen.getByRole('button', { name: 'Pause' }));
    expect(screen.getByTestId('total')).toHaveTextContent('0:25');

    await userEvent.click(screen.getByRole('button', { name: 'Durée : 0:20' }));
    await userEvent.click(await screen.findByRole('button', { name: '1 min' }));
    expect(screen.getByTestId('total')).toHaveTextContent('0:25'); // not applied until validated
    await userEvent.click(screen.getByRole('button', { name: 'Valider' }));
    expect(screen.getByTestId('total')).toHaveTextContent('1:05');
  });

  it('picks minutes and seconds (10 s steps) with wheels in a modal, cancel keeps the value', async () => {
    renderEditor();
    await userEvent.click(screen.getByRole('button', { name: 'Pause' }));
    await userEvent.click(screen.getByRole('button', { name: 'Durée : 0:20' }));
    fireEvent.keyDown(await screen.findByRole('spinbutton', { name: 'Durée (minutes)' }), { key: 'ArrowDown' });
    fireEvent.keyDown(screen.getByRole('spinbutton', { name: 'Durée (secondes)' }), { key: 'ArrowDown' });
    expect(screen.getByTestId('Durée-value')).toHaveTextContent('1:30');
    await userEvent.click(screen.getByText('50'));
    expect(screen.getByTestId('Durée-value')).toHaveTextContent('1:50');

    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(screen.getByTestId('total')).toHaveTextContent('0:25');

    await userEvent.click(screen.getByRole('button', { name: 'Durée : 0:20' }));
    fireEvent.keyDown(await screen.findByRole('spinbutton', { name: 'Durée (minutes)' }), { key: 'ArrowDown' });
    await userEvent.click(screen.getByRole('button', { name: 'Valider' }));
    expect(screen.getByTestId('total')).toHaveTextContent('1:25');
  });

  it('analyses a new video: "Artiste - Titre" label and track duration', async () => {
    youtube.probe.mockResolvedValueOnce({ title: 'Around the World (Official Video)', author: 'Daft Punk - Topic', duration: 150 });
    renderEditor();
    await userEvent.click(screen.getByRole('button', { name: 'YouTube' }));
    const url = screen.getByLabelText('Vidéo');
    await userEvent.type(url, 'https://youtu.be/dQw4w9WgXcQ');
    fireEvent.blur(url);
    expect(await screen.findByDisplayValue('Daft Punk - Around the World')).toBeInTheDocument();
    expect(screen.getByTitle('Durée du morceau')).toHaveTextContent('2:30');
    // Default step is 3:00 > 2:30 of track.
    expect(screen.getByText(/il reprendra au début/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Ajuster la durée à 2:30' }));
    expect(screen.queryByText(/il reprendra au début/)).not.toBeInTheDocument();
  });

  it('fills missing track durations on open without marking the session dirty', async () => {
    youtube.probe.mockResolvedValueOnce({ title: 'T', author: 'A', duration: 200 });
    const session = { ...newSession(), steps: [newMusic('yt', { videoId: 'dQw4w9WgXcQ', label: 'Mon titre' })] };
    const { onClose, onSave } = renderEditor(session);
    expect(await screen.findByTitle('Durée du morceau')).toHaveTextContent('3:20');
    expect(screen.getByDisplayValue('Mon titre')).toBeInTheDocument();
    await new Promise(r => setTimeout(r, 600));
    expect(onSave).not.toHaveBeenCalled(); // background analysis is not a user edit
    await userEvent.click(screen.getByRole('button', { name: 'Retour' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('sets countdown / beeps with a wheel, 0 shown as "Non"', async () => {
    renderEditor();
    expect(screen.getByRole('button', { name: 'Décompte départ : 5 s' })).toHaveTextContent('5 s');
    await userEvent.click(screen.getByRole('button', { name: 'Bips avant fin : 5 s' }));
    await userEvent.click(await screen.findByText('Non'));
    expect(screen.getByTestId('Bips avant fin-value')).toHaveTextContent('Non');
    await userEvent.click(screen.getByRole('button', { name: 'Valider' }));
    expect(screen.getByRole('button', { name: 'Bips avant fin : Non' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Décompte départ : 5 s' }));
    fireEvent.keyDown(await screen.findByRole('spinbutton', { name: 'Décompte départ' }), { key: 'ArrowDown' });
    await userEvent.click(screen.getByRole('button', { name: 'Valider' }));
    expect(screen.getByTestId('total')).toHaveTextContent('0:06');
  });

  it('previews the end-of-step beeps with the current setting', async () => {
    renderEditor();
    await userEvent.click(screen.getByRole('button', { name: 'Écouter les bips' }));
    expect(beeper.schedule).toHaveBeenLastCalledWith(beepPlan(5, 5));

    await userEvent.click(screen.getByRole('button', { name: 'Bips avant fin : 5 s' }));
    fireEvent.keyDown(await screen.findByRole('spinbutton', { name: 'Bips avant fin' }), { key: 'ArrowUp' });
    await userEvent.click(screen.getByRole('button', { name: 'Écouter' }));
    expect(beeper.schedule).toHaveBeenLastCalledWith(beepPlan(4, 4));
  });

  it('autosaves changes (debounced), without any save button', async () => {
    const { onSave } = renderEditor();
    expect(screen.queryByRole('button', { name: 'Enregistrer' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Pause' }));
    await userEvent.click(screen.getByRole('button', { name: 'Pause' }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.lastCall[0].steps).toHaveLength(2);
    expect(screen.getByLabelText('Enregistré')).toBeInTheDocument();
  });

  it('flushes a pending change when leaving', async () => {
    const { onSave } = renderEditor();
    await userEvent.click(screen.getByRole('button', { name: 'Pause' }));
    cleanup();
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ steps: [expect.any(Object)] }), { leaving: true });
  });

  it('does not save an untouched session', async () => {
    const { onSave } = renderEditor();
    await new Promise(r => setTimeout(r, 600));
    cleanup();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('launches the current draft', async () => {
    const onPlay = vi.fn();
    const session = { ...newSession(), name: 'Jambes', steps: [newMusic('yt', { videoId: 'dQw4w9WgXcQ' })] };
    renderEditor(session, { onPlay });
    await userEvent.click(screen.getByRole('button', { name: 'Lancer' }));
    expect(onPlay).toHaveBeenCalledWith(expect.objectContaining({ name: 'Jambes' }));
  });

  describe('with Apple Music', () => {
    const track = { appleId: '697195462', label: 'Daft Punk - One More Time', trackDuration: 320, artwork: 'https://x/80x80.jpg' };
    const makeApple = () => ({
      configured: true,
      isAuthorized: () => true,
      subscribe: () => () => {},
      search: vi.fn(async () => [track]),
      song: vi.fn(async () => track),
      tracks: vi.fn(async () => [track, { ...track, appleId: '2', label: 'B - C', trackDuration: 100 }]),
      libraryPlaylists: vi.fn(async () => [{ id: 'p.1', name: 'Cardio' }]),
    });

    it('offers only the enabled sources', async () => {
      localStorage.setItem('wp.sources', JSON.stringify({ yt: false }));
      renderEditor(newSession(), { apple: makeApple() });
      expect(screen.getByRole('button', { name: 'Apple Music' })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'Ou lien de playlist / album' })).toBeInTheDocument(); // single provider: no choice step
      expect(screen.getByRole('button', { name: 'Fichier' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'YouTube' })).not.toBeInTheDocument();
    });

    it('searches a song and mixes it with YouTube steps', async () => {
      const apple = makeApple();
      const { onSave } = renderEditor(newSession(), { apple });
      // First buttons = add a step; the playlist import offers the same providers below.
      await userEvent.click(screen.getAllByRole('button', { name: 'YouTube' })[0]);
      await userEvent.click(screen.getAllByRole('button', { name: 'Apple Music' })[0]);
      await userEvent.type(screen.getByRole('textbox', { name: 'Morceau' }), 'one more time{Enter}');
      expect(apple.search).toHaveBeenCalledWith('one more time');
      await userEvent.click(await screen.findByRole('option', { name: /Daft Punk - One More Time/ }));
      expect(screen.getByDisplayValue('Daft Punk - One More Time')).toBeInTheDocument();
      expect(screen.getByText('5:20')).toBeInTheDocument(); // track duration badge
      await waitFor(() => expect(onSave).toHaveBeenCalled());
      const steps = onSave.mock.lastCall[0].steps;
      expect(steps.map(s => s.source)).toEqual(['yt', 'apple']);
      expect(steps[1]).toMatchObject({ appleId: '697195462', trackDuration: 320 });
      expect(steps[1]).not.toHaveProperty('artwork');
    });

    it('imports a playlist after choosing the provider', async () => {
      const apple = makeApple();
      const { onSave } = renderEditor(newSession(), { apple });
      expect(screen.queryByRole('textbox', { name: /playlist/i })).not.toBeInTheDocument();
      await userEvent.click(within(screen.getByRole('group', { name: 'Importer une playlist' })).getByRole('button', { name: 'Apple Music' }));
      await userEvent.type(screen.getByRole('textbox', { name: 'Ou lien de playlist / album' }), 'https://music.apple.com/fr/album/discovery/697194953');
      await userEvent.click(screen.getByRole('button', { name: 'Importer' }));
      expect(apple.tracks).toHaveBeenCalledWith({ storefront: 'fr', albumId: '697194953' });
      expect(await screen.findByText('2 morceaux ajoutés.')).toBeInTheDocument();
      await waitFor(() => expect(onSave).toHaveBeenCalled());
      expect(onSave.mock.lastCall[0].steps.map(s => s.type)).toEqual(['music', 'pause', 'music']);

      await userEvent.click(screen.getByRole('button', { name: 'Changer' }));
      await userEvent.click(within(screen.getByRole('group', { name: 'Importer une playlist' })).getByRole('button', { name: 'YouTube' }));
      expect(screen.getByRole('textbox', { name: 'URL de la playlist' })).toBeInTheDocument();
    });
  });
});
