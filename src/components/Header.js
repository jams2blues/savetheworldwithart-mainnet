/*Developed by @jams2blues with love for the Tezos community
  File: src/components/Header.js
  Summary: Toolbar + theme toggle + network selector + guard-rail banners.
           Adds graceful Snackbar-based error handling for Reveal, plus
           explicit “needs funds” notice to avoid empty_transaction failures.
*/

import React, { useContext, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  ListItemButton,
  ListItemText,
  Box,
  useMediaQuery,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider,
  Alert,
  Stack,
  Snackbar         // ⬅ new
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import Link from 'next/link';
import { WalletContext } from '../contexts/WalletContext';
import ColorModeContext from '../contexts/ColorModeContext';

const Logo            = styled('img')({ width: 40, height: 40, marginRight: 8 });
const HeaderContainer = styled(AppBar)`background-color: darkgreen;`;

/* —— Primary nav links (declared outside component for SSR) —— */
const MENU_ITEMS = [
  { text: 'Home',            link: '/' },
  { text: 'Deploy Contract', link: '/generate' },
  { text: 'Manage Contract', link: '/manage-contract' },
  { text: 'On-Chain License',link: '/on-chain-license' },
  { text: 'Terms',           link: '/terms' },
  { text: 'On-Chain Viewer',       link: '/on-chain-viewer' }
];

/* —— Domain redirect helper —— */
const redirectFor = (target) =>
  target === 'mainnet'
    ? 'https://savetheworldwithart.io'
    : 'https://ghostnet.savetheworldwithart.io';

export default function Header () {
  const theme     = useTheme();
  const isMobile  = useMediaQuery(theme.breakpoints.down('sm'));

  const {
    walletAddress,
    isWalletConnected,
    connectWallet,
    disconnectWallet,
    network,
    networkMismatch,
    needsReveal,
    needsFunds,        // ⬅ new flag from WalletContext
    revealAccount
  } = useContext(WalletContext);

  const { mode, toggleColorMode } = useContext(ColorModeContext);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'error' });

  const handleNetworkChange = (e) => { window.location.href = redirectFor(e.target.value); };
  const toggleDrawer        = (open) => () => setDrawerOpen(open);

  const walletLabel  = () =>
    !isWalletConnected
      ? 'Connect Wallet'
      : `Disconnect (${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)})`;
  const walletAction = isWalletConnected ? disconnectWallet : connectWallet;

  /* graceful Reveal with Snackbar feedback */
  const handleReveal = async () => {
    try { await revealAccount(); }
    catch (e) {
      console.error(e);
      setSnack({ open: true, msg: e.message || 'Reveal failed', severity: 'error' });
    }
  };

  return (
    <>
      <HeaderContainer position="static">
        <Toolbar
          sx={{
            minHeight: isMobile ? 60 : 64,
            px: isMobile ? 1 : 3,
            justifyContent: 'space-between'
          }}
        >
          {/* —— Left: logo & hamburger —— */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isMobile && (
              <IconButton color="inherit" edge="start" onClick={toggleDrawer(true)} sx={{ mr: 1 }}>
                <MenuIcon />
              </IconButton>
            )}

            <Link href="/" legacyBehavior passHref>
              <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <Logo src="/images/logo.svg" alt="ZeroArt Logo" />
                <Typography
                  variant="h6"
                  component="a"
                  sx={{ color: '#fff', textDecoration: 'none', fontSize: '1.25rem' }}
                >
                  ZeroArtApp
                </Typography>
              </Box>
            </Link>
          </Box>

          {/* —— Desktop nav —— */}
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, ml: 2 }}>
              {MENU_ITEMS.map((i) => (
                <Link key={i.text} href={i.link} legacyBehavior passHref>
                  <Button sx={{ color: '#fff', mx: 1 }}>{i.text}</Button>
                </Link>
              ))}
            </Box>
          )}

          {/* —— Right: theme, network, wallet —— */}
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
            <IconButton
              aria-label="Toggle light/dark mode"
              color="inherit"
              onClick={toggleColorMode}
              sx={{ mr: isMobile ? 0 : 1 }}
            >
              {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>

            {!isMobile && (
              <FormControl variant="standard" sx={{ minWidth: 90, mr: 2 }}>
                <InputLabel sx={{ color: '#fff' }}>Network</InputLabel>
                <Select
                  value={network}
                  onChange={handleNetworkChange}
                  label="Network"
                  sx={{ color: '#fff' }}
                >
                  <MenuItem value="mainnet">Mainnet</MenuItem>
                  <MenuItem value="ghostnet">Ghostnet</MenuItem>
                </Select>
              </FormControl>
            )}

            <Button
              color="inherit"
              onClick={walletAction}
              startIcon={<AccountBalanceWalletIcon />}
              sx={{ whiteSpace: 'nowrap', fontSize: isMobile ? '0.9rem' : '1rem' }}
            >
              {isMobile
                ? isWalletConnected
                  ? `${walletAddress.slice(0, 4)}…${walletAddress.slice(-4)}`
                  : 'Connect'
                : walletLabel()}
            </Button>
          </Box>
        </Toolbar>

        {/* —— Runtime diagnostics —— */}
        {(networkMismatch || needsFunds || (needsReveal && !networkMismatch)) && (
          <Stack spacing={1} sx={{ px: 2, pb: 2 }}>
            {networkMismatch && (
              <Alert severity="warning">
                Wallet is on <strong>{network === 'mainnet' ? 'Ghostnet' : 'Mainnet'}</strong>; this
                site is <strong>{network}</strong>. Switch networks or open the correct URL.
              </Alert>
            )}

            {needsFunds && !networkMismatch && (
              <Alert severity="info">
                Your account is empty. Fund it with Ghostnet ꜩ from the faucet before revealing.
              </Alert>
            )}

            {needsReveal && !networkMismatch && !needsFunds && (
              <Alert
                severity="info"
                action={
                  <Button color="inherit" size="small" onClick={handleReveal}>
                    Reveal
                  </Button>
                }
              >
                First transaction must reveal your account.
              </Alert>
            )}
          </Stack>
        )}
      </HeaderContainer>

      {/* —— Mobile drawer —— */}
      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
        <Box sx={{ width: 250, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box
            sx={{ flex: '1 1 auto' }}
            onClick={toggleDrawer(false)}
            onKeyDown={toggleDrawer(false)}
          >
            {MENU_ITEMS.map((i) => (
              <Link key={i.text} href={i.link} legacyBehavior passHref>
                <ListItemButton>
                  <ListItemText primary={i.text} />
                </ListItemButton>
              </Link>
            ))}
            <Divider sx={{ my: 1 }} />

            <ListItemButton onClick={toggleColorMode}>
              <ListItemText
                primary={mode === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              />
              {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </ListItemButton>

            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                Select Network
              </Typography>
              <FormControl variant="standard" fullWidth>
                <Select value={network} onChange={handleNetworkChange}>
                  <MenuItem value="mainnet">Mainnet</MenuItem>
                  <MenuItem value="ghostnet">Ghostnet</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
          <Box sx={{ flexShrink: 0 }} />
        </Box>
      </Drawer>

      {/* —— Global Snackbar —— */}
      <Snackbar
        open={snack.open}
        autoHideDuration={6000}
        onClose={() => setSnack((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity={snack.severity}
          sx={{ width: '100%' }}
          onClose={() => setSnack((p) => ({ ...p, open: false }))}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </>
  );
}
