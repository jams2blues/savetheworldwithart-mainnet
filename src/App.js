// src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './components/Home';
import GenerateContract from './components/GenerateContract';
// import ImpactMetrics from './components/ImpactMetrics'; // Removed ImpactMetrics import
import MintBurnTransfer from './components/MintBurnTransfer/MintBurnTransfer';
import Terms from './components/Terms';
import OnChainLicense from './components/OnChainLicense'; // Import the new component
import styled from 'styled-components';

// Removed MintChunked and MintInteractive imports

const MainContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
`;

function App() {
  return (
    <Router>
      <Header />
      <MainContainer>
        {/* <ImpactMetrics /> */} {/* Removed ImpactMetrics usage */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/generate" element={<GenerateContract />} />
          <Route path="/mint-burn-transfer" element={<MintBurnTransfer />} />
          {/* Removed MintChunked and MintInteractive routes */}
          <Route path="/terms" element={<Terms />} />
          <Route path="/on-chain-license" element={<OnChainLicense />} /> {/* Add new route */}
          {/* Add other routes as needed */}
        </Routes>
      </MainContainer>
    </Router>
  );
}

export default App;
