import { Button, Card, CardContent, Stack, Typography } from '@mui/material';

type Props = {
  onStart: () => void;
};

export function DailyLogStartPrompt({ onStart }: Props) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2.5} alignItems="stretch">
          <Stack spacing={1}>
            <Typography variant="h6">Ta journée en quelques gestes</Typography>
            <Typography variant="body2" color="text.secondary">
              On avance pas à pas : ressenti, anxiété, sommeil, puis le reste. Tu pourras tout
              revoir et modifier ensuite.
            </Typography>
          </Stack>
          <Button variant="contained" size="large" onClick={onStart} fullWidth>
            Commencer mon bilan du jour
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
