import { Box, Container, Paper, Stack, Typography } from '@mui/material';

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function AuthLayout({ title, subtitle, children, footer }: Props) {
  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'center',
        bgcolor: 'background.default',
        py: { xs: 4, sm: 6 },
        px: 2,
      }}
    >
      <Container maxWidth="xs" disableGutters>
        <Stack spacing={3} alignItems="center">
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Diana
          </Typography>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 4 },
              width: '100%',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Stack spacing={3}>
              <Box>
                <Typography variant="h5">{title}</Typography>
                {subtitle && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {subtitle}
                  </Typography>
                )}
              </Box>
              {children}
            </Stack>
          </Paper>
          {footer && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              {footer}
            </Typography>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
