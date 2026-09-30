import { useEffect, useRef, useState } from 'react';
import {
  ActionIcon, Button, FileButton, Group, NumberInput, Paper, SimpleGrid, Stack, Text, TextInput,
} from '@mantine/core';
import {
  IconArrowLeft, IconBrandYoutube, IconDeviceFloppy, IconFileMusic, IconPlayerPause,
} from '@tabler/icons-react';
import { StepCard } from './StepCard.jsx';
import { PlaylistImport } from './PlaylistImport.jsx';
import { DurationBadge } from './DurationBadge.jsx';
import { newMusic, newPause, totalDuration, uid, validateSession } from '../core/model.js';
import { FileStore } from '../services/storage.js';
import { plural } from '../core/plural.js';
import { localTrackInfo, youTubeTrackInfo } from '../services/trackInfo.js';
import { confirm, notifyError } from '../app/feedback.jsx';

export function SessionEditor({ session, youtube, onSave, onClose }) {
  const [draft, setDraft] = useState(() => structuredClone(session));
  const [dirty, setDirty] = useState(false);

  const [analyzing, setAnalyzing] = useState(() => new Set());

  const update = (fn, markDirty = true) => { setDraft(d => fn(structuredClone(d))); if (markDirty) setDirty(true); };
  const setField = (field, value) => update(d => ({ ...d, [field]: value }));
  const updateStep = (id, patch, markDirty = true) =>
    update(d => ({ ...d, steps: d.steps.map(s => s.id === id ? { ...s, ...patch } : s) }), markDirty);
  const addSteps = steps => update(d => ({ ...d, steps: [...d.steps, ...steps] }));
  const removeStep = id => update(d => ({ ...d, steps: d.steps.filter(s => s.id !== id) }));
  const moveStep = (i, dir) => update(d => {
    [d.steps[i], d.steps[i + dir]] = [d.steps[i + dir], d.steps[i]];
    return d;
  });

  /** Runs a track analysis for a step, showing a loader on its card meanwhile. */
  async function withAnalysis(id, job) {
    setAnalyzing(a => new Set(a).add(id));
    try {
      return await job();
    } finally {
      setAnalyzing(a => { const n = new Set(a); n.delete(id); return n; });
    }
  }

  async function changeVideo(step, { videoId }) {
    updateStep(step.id, { videoId, trackDuration: undefined });
    const info = await withAnalysis(step.id, () => youTubeTrackInfo(youtube, videoId));
    updateStep(step.id, { trackDuration: info.trackDuration, ...(info.label && { label: info.label }) });
  }

  // Older sessions have no track duration yet: fill it in quietly (not a user edit).
  const initial = useRef(draft.steps);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const s of initial.current) {
        if (cancelled) return;
        if (s.type !== 'music' || s.trackDuration > 0) continue;
        const info = await withAnalysis(s.id, async () => {
          if (s.source === 'yt') return s.videoId ? youTubeTrackInfo(youtube, s.videoId) : null;
          const file = s.fileId && await FileStore.get(s.fileId).catch(() => null);
          return file ? localTrackInfo(file) : null;
        });
        if (cancelled || !info?.trackDuration) continue;
        updateStep(s.id, { trackDuration: info.trackDuration, ...(!s.label && info.label && { label: info.label }) }, false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function storeFile(file) {
    const fileId = uid();
    const [info] = await Promise.all([localTrackInfo(file), FileStore.put(fileId, file)]);
    return { fileId, fileName: file.name, ...info };
  }

  async function addFiles(files) {
    if (!files?.length) return;
    navigator.storage?.persist?.();
    try {
      const steps = [];
      for (const f of files) steps.push(newMusic('local', await storeFile(f)));
      addSteps(steps);
    } catch (err) {
      notifyError(err.message, 'Impossible d’enregistrer le fichier');
    }
  }

  async function replaceFile(step, file) {
    try {
      const info = await storeFile(file);
      updateStep(step.id, info);
    } catch (err) {
      notifyError(err.message, 'Impossible d’enregistrer le fichier');
    }
  }

  async function back() {
    if (!dirty || await confirm({ title: 'Quitter sans enregistrer ?', confirmLabel: 'Quitter', danger: true })) onClose();
  }

  async function save() {
    const d = { ...draft, name: draft.name.trim() || 'Séance' };
    const errors = validateSession(d);
    if (errors.length) return notifyError(errors.join('\n'), 'Séance incomplète');
    await onSave(d);
  }

  return (
    <Stack gap="md">
      <Paper className="sticky-bar" py="sm">
        <Group justify="space-between" wrap="nowrap">
          <Group gap={6} wrap="nowrap" miw={0}>
            <ActionIcon variant="subtle" size="lg" onClick={back} aria-label="Retour">
              <IconArrowLeft />
            </ActionIcon>
            <DurationBadge seconds={totalDuration(draft)} data-testid="total" />
            <Text size="sm" c="dimmed" truncate>{plural(draft.steps.length, 'étape')}</Text>
          </Group>
          <Button leftSection={<IconDeviceFloppy size={20} />} onClick={save} px="sm" style={{ flexShrink: 0 }}>Enregistrer</Button>
        </Group>
      </Paper>

      <TextInput label="Nom" value={draft.name} onChange={e => setField('name', e.currentTarget.value)} />
      <SimpleGrid cols={2}>
        <NumberInput label="Décompte départ (s)" min={0} max={60} allowDecimal={false}
          value={draft.lead} onChange={v => setField('lead', Math.max(0, +v || 0))} />
        <NumberInput label="Bips avant fin (s)" min={0} max={15} allowDecimal={false}
          value={draft.countdown} onChange={v => setField('countdown', Math.max(0, +v || 0))} />
      </SimpleGrid>

      {draft.steps.length === 0 && <Text c="dimmed">Aucune étape : ajoute des morceaux et des pauses.</Text>}
      {draft.steps.map((s, i) => (
        <StepCard
          key={s.id}
          step={s}
          index={i}
          isFirst={i === 0}
          isLast={i === draft.steps.length - 1}
          analyzing={analyzing.has(s.id)}
          onChange={patch => updateStep(s.id, patch)}
          onVideo={v => changeVideo(s, v)}
          onMove={dir => moveStep(i, dir)}
          onRemove={() => removeStep(s.id)}
          onPickFile={f => replaceFile(s, f)}
        />
      ))}

      <SimpleGrid cols={{ base: 1, xs: 3 }} spacing="xs">
        <Button variant="light" color="red" leftSection={<IconBrandYoutube size={20} />}
          onClick={() => addSteps([newMusic('yt')])}>YouTube</Button>
        <FileButton accept="audio/*" multiple onChange={addFiles}>
          {props => <Button variant="light" color="blue" leftSection={<IconFileMusic size={20} />} {...props}>Fichier</Button>}
        </FileButton>
        <Button variant="light" color="orange" leftSection={<IconPlayerPause size={20} />}
          onClick={() => addSteps([newPause()])}>Pause</Button>
      </SimpleGrid>

      <PlaylistImport youtube={youtube} onAdd={addSteps} onUpdate={updateStep} />
    </Stack>
  );
}
