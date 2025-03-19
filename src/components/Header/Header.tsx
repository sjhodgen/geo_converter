import React from 'react';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';

interface HeaderProps {
  version: string;
}

const Header: React.FC<HeaderProps> = ({ version }) => {
  return (
    <AppBar position="static" color="default" elevation={0} className="header">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          GeoConverter
        </Typography>
        <Box>
          <Typography variant="caption" color="text.secondary">
            &nbsp;&nbsp;&nbsp;Version: {version}
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;