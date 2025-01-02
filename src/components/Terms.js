// src/components/Terms.js

import React from 'react';
import styled from 'styled-components';
import { Typography, Container, Paper, Link, Alert, Box } from '@mui/material';

// Optional: Define Section using Box if not already defined
const Section = styled(Box)`
  margin-bottom: 20px;
`;

const StyledContainer = styled(Container)`
  padding: 40px;
  margin: 20px auto;
  max-width: 800px;
`;

const StyledPaper = styled(Paper)`
  padding: 30px;
`;

const Terms = () => {
  return (
    <StyledContainer>
      <StyledPaper elevation={3}>

        {/* Liability Disclaimer */}
        <Section>
          <Alert severity="warning">
            <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', md: '1rem' } }}>
              <strong>Disclaimer:</strong> By deploying contracts and NFTs via this platform, you accept full
              responsibility for your on-chain actions. On Tezos, contracts are immutable and cannot be deleted or
              altered once deployed. The Zero Contract™ holds no liability for any content you create or deploy.
              Always test thoroughly on{' '}
              <Link
                href="https://mainnet.zerocontract.io"
                color="primary"
                underline="hover"
                target="_blank"
                rel="noopener noreferrer"
              >
                Mainnet
              </Link>{' '}
              before deploying, as all actions are final and permanent. If you make a mistake, you can hide the collection from your main OBJKT portfolio or burn any erroneous tokens. ⚠️ OBJKT might not display
              Collection Thumbnails over 254 Characters, so make 'em teeny tiny!
            </Typography>
          </Alert>
        </Section>
        <Typography variant="h4" gutterBottom>
          Terms and Conditions
        </Typography>
        <Typography variant="body1" gutterBottom>
          <strong>Last Updated:</strong> November 14, 2023
        </Typography>
        <Typography variant="body2" paragraph>
          Welcome to The Zero Contract! By accessing or using our platform, you agree to be bound by these Terms and Conditions. Please read them carefully.
        </Typography>

        <Typography variant="h6" gutterBottom>
          1. Acceptance of Terms
        </Typography>
        <Typography variant="body2" paragraph>
          By using The Zero Contract, you accept these Terms and Conditions in full. If you disagree with any part of these terms, do not use our platform.
        </Typography>

        <Typography variant="h6" gutterBottom>
          2. Use of the Platform
        </Typography>
        <Typography variant="body2" paragraph>
          The Zero Contract allows artists to create, manage, deploy, and mint NFTs directly on the Tezos blockchain. You agree to use the platform solely for lawful purposes and in a manner that does not infringe the rights of others.
        </Typography>

        <Typography variant="h6" gutterBottom>
          3. Intellectual Property
        </Typography>
        <Typography variant="body2" paragraph>
          You retain ownership of all intellectual property rights in the content you create and upload. By deploying NFTs through our platform, you grant The Zero Contract a non-exclusive, worldwide, royalty-free license to use, reproduce, and display your content as necessary to provide the services.
        </Typography>

        <Typography variant="h6" gutterBottom>
          4. Disclaimer of Warranties
        </Typography>
        <Typography variant="body2" paragraph>
          The platform is provided "as is" without any warranties of any kind. We do not guarantee the accuracy, reliability, or availability of the platform.
        </Typography>

        <Typography variant="h6" gutterBottom>
          5. Limitation of Liability
        </Typography>
        <Typography variant="body2" paragraph>
          The Zero Contract shall not be liable for any direct, indirect, incidental, or consequential damages arising from your use of the platform.
        </Typography>

        <Typography variant="h6" gutterBottom>
          6. Indemnification
        </Typography>
        <Typography variant="body2" paragraph>
          You agree to indemnify and hold harmless The Zero Contract from any claims, damages, losses, liabilities, and expenses arising out of your use of the platform.
        </Typography>

        <Typography variant="h6" gutterBottom>
          7. Governing Law
        </Typography>
        <Typography variant="body2" paragraph>
          These Terms and Conditions are governed by and construed in accordance with the laws of the jurisdiction in which The Zero Contract operates.
        </Typography>

        <Typography variant="h6" gutterBottom>
          8. Changes to Terms
        </Typography>
        <Typography variant="body2" paragraph>
          We reserve the right to modify these Terms and Conditions at any time. Any changes will be effective immediately upon posting.
        </Typography>

        <Typography variant="h6" gutterBottom>
          9. Contact Us
        </Typography>
        <Typography variant="body2" paragraph>
          If you have any questions about these Terms and Conditions, please contact us on Twitter{' '}
          <Link
            href="https://x.com/JestemZero"
            target="_blank"
            rel="noopener noreferrer"
            color="primary"
            underline="hover"
          >
            @jestemZero
          </Link>
          .
        </Typography>

        {/* Updated Section: Understanding #ZeroContracts */}
        <Typography variant="h6" gutterBottom>
          10. How #ZeroContracts Work
        </Typography>
        <Typography variant="body2" paragraph>
          At The Zero Contract, we offer two versions of our smart contracts, known as <strong>#ZeroContracts</strong>, designed to simplify the process of creating and managing your NFT collections on the Tezos blockchain. Both versions share the following key entrypoints:
        </Typography>
        <ul>
          <li>
            <strong>mint:</strong> Allows you to create new NFTs by providing their metadata and specifying the recipient's address. In Version 2, this entrypoint supports minting multiple editions of an NFT.
          </li>
          <li>
            <strong>burn:</strong> Enables you to permanently remove NFTs from circulation by specifying their unique identifiers.
          </li>
          <li>
            <strong>balance_of:</strong> Lets you check the ownership balance by querying the contract with specific requests and receiving callbacks with the relevant information.
          </li>
          <li>
            <strong>transfer:</strong> Facilitates the transfer of NFTs from one address to another, ensuring seamless ownership changes.
          </li>
          <li>
            <strong>update_operators:</strong> Allows you to manage permissions by adding or removing operators who can handle your NFTs on your behalf.
          </li>
          <li>
            <strong>add_parent / add_child:</strong> Manage hierarchical relationships between contracts, allowing for complex NFT structures.
          </li>
          <li>
            <strong>remove_parent / remove_child:</strong> Remove existing hierarchical relationships between contracts.
          </li>
        </ul>

        <Typography variant="body2" paragraph>
          <strong>Version 1</strong> is tailored for artists who want to create unique, single-edition NFTs. Each NFT is one-of-a-kind and cannot be replicated.
        </Typography>
        <Typography variant="body2" paragraph>
          <strong>Version 2</strong> is designed for artists who wish to mint multiple editions of their NFTs, offering greater flexibility. This version allows you to mint several copies of an NFT in a single transaction, making it ideal for limited series or collectible works.
        </Typography>

        {/* Explanation of Metadata and On-Chain NFTs */}
        <Typography variant="body2" paragraph>
          <strong>Metadata Storage:</strong><br />
          All the information about your NFTs, such as their names, descriptions, creators, and images, is stored directly on the Tezos blockchain. This ensures that your NFTs are fully on-chain, making them immutable and secure.
        </Typography>
        <Typography variant="body2" paragraph>
          <strong>On-Chain NFTs:</strong><br />
          By deploying your NFTs on-chain, you ensure that they exist permanently and transparently on the blockchain. This provides a trustworthy record of ownership and provenance, enhancing the value and authenticity of your artwork.
        </Typography>
        <Typography variant="body2" paragraph>
          <strong>Collection Thumbnails:</strong><br />
          The thumbnail images representing your NFT collection are also stored on-chain as part of the metadata. To ensure optimal performance and compatibility with platforms like OBJKT.com, thumbnails are compressed and kept under 20KB in size.
        </Typography>
        <Typography variant="body2" paragraph>
          <strong>Automated, No-Code Deployment:</strong><br />
          Our platform automates the complex process of deploying smart contracts and minting NFTs, providing a user-friendly, no-code experience. This empowers artists to effortlessly bring their creations to the blockchain without requiring technical expertise.
        </Typography>
        <Typography variant="body2" paragraph>
          <strong>Join the World of Compressionism and Pixel Art:</strong><br />
          Dive into a fascinating world where art meets blockchain technology. Our platform supports various art forms, including compressionism and pixel art, allowing you to showcase your unique style on the Tezos network.
        </Typography>

        {/* Attribution */}
        <Typography variant="body2" paragraph>
          <strong>Attributions:</strong>  
          The platform was meticulously designed by <Link href="https://x.com/jams2blues" target="_blank" rel="noopener noreferrer">@jams2blues</Link>, and the smart contracts were expertly crafted by <Link href="https://x.com/JestemZero" target="_blank" rel="noopener noreferrer">@JestemZero</Link>. Our role was to automate the deployment process, creating an intuitive, no-code interface that enables artists to seamlessly bring their work on-chain.
        </Typography>

        <Typography variant="body2" paragraph>
          By using The Zero Contract, you embrace the ease and security of deploying your art as NFTs on the Tezos blockchain, contributing to a sustainable and decentralized digital art ecosystem.
        </Typography>
      </StyledPaper>
    </StyledContainer>
  );
};

export default Terms;
