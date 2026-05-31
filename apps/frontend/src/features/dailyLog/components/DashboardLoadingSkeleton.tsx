import { Skeleton, Stack } from '@mui/material';

export function DashboardLoadingSkeleton() {
  return (
    <Stack spacing={2}>
      <Skeleton variant="rounded" height={120} />
      <Skeleton variant="rounded" height={120} />
      <Skeleton variant="rounded" height={56} />
    </Stack>
  );
}
