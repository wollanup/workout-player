import { Badge } from '@mantine/core';
import { IconClock } from '@tabler/icons-react';
import { formatTime } from '../core/time.js';

export function DurationBadge({ seconds, size = 'lg', ...props }) {
  return (
    <Badge size={size} variant="light" color="gray" leftSection={<IconClock size={16} />}
      style={{ flexShrink: 0 }} styles={{ label: { overflow: 'visible' } }} {...props}>
      {formatTime(seconds)}
    </Badge>
  );
}
