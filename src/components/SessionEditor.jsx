import { useState } from 'react';
import {
  ActionIcon, Button, FileButton, Group, NumberInput, Paper, SimpleGrid, Stack, Text, TextInput,
} from '@mantine/core';
import {
  IconArrowLeft, IconBrandYoutube, IconDeviceFloppy, IconFileMusic, IconListNumbers, IconPlayerPause,
} from '@tabler/icons-react';
import { StepCard } from './StepCard.jsx';
import { PlaylistImport } from './PlaylistImport.jsx';
import { DurationBadge } from './DurationBadge.jsx';
import { newMusic, newPause, totalDuration, uid, validateSession } from '../core/model.js';
import { FileStore } from '../services/storage.js';
import { confirm, notifyError } from '../app/feedback.jsx';

export function SessionEditor({ session, youtube, onSave, onClose }) {
  const [draft, setDraft] = useState(() => structuredClone(session));
  const [dirty, setDirty] = useState(false);

  const update = fn => { setDraft(d => fn(structuredClone(d))); setDirty(true); };
  const setField = (field, value) => update(d => ({ ...d, [field]: value }));
  const updateStep = (id, patch) => update(d => ({ ...d, steps: d.steps.map(s => s.id === id ? { ...s, ...patch } : s) }));
  const addSteps = steps => update(d => ({ ...d, steps: [...d.steps, ...steps] }));
  const removeStep = id => update(d => ({ ...d, steps: d.steps.filter(s => s.id !== id) }));
  const moveStep = (i, dir) => update(d => {
    [d.steps[i], d.steps[i + dir]] = [d.steps[i + dir], d.steps[i]];
    return d;
  });

  async function storeFile(file) {
    const fileId = uid();
    await FileStore.put(fileId, file);
    return { fileId, fileName: file.name, label: file.name.replace(/\.[^.]+$/, '') };
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
      updateStep(step.id, { ...info, label: step.label || info.label });
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
          <Group gap="xs" wrap="nowrap">
            <ActionIcon variant="subtle" size="xl" onClick={back} aria-label="Retour">
              <IconArrowLeft />
            </ActionIcon>
            <DurationBadge seconds={totalDuration(draft)} data-testid="total" />
            <Text size="sm" c="dimmed" className="nowrap">
              <IconListNumbers size={14} style={{ verticalAlign: -2 }} /> {draft.steps.length}
            </Text>
          </Group>
          <Button leftSection={<IconDeviceFloppy size={20} />} onClick={save}>Enregistrer</Button>
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
          onChange={patch => updateStep(s.id, patch)}
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
