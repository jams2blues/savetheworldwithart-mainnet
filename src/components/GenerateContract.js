// mainnet/src/components/GenerateContract.js

import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';
import {
  Button,
  TextField,
  Typography,
  Paper,
  Snackbar,
  Alert,
  Grid,
  CircularProgress,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Checkbox,
  FormControlLabel,
  Link,
  Tooltip,
  IconButton,
} from '@mui/material';
import { WalletContext } from '../contexts/WalletContext';
import NFTPreview from './NFTPreview';
import FileUpload from './FileUpload';
import { MichelsonMap } from '@taquito/taquito';
import { BigNumber } from 'bignumber.js';
import InfoIcon from '@mui/icons-material/Info';

// Styled Components
const Container = styled(Paper)`
  padding: 20px;
  margin: 20px auto;
  max-width: 1200px;
  width: 95%;
  box-sizing: border-box;

  @media (max-width: 900px) {
    padding: 15px;
    width: 98%;
  }

  @media (max-width: 600px) {
    padding: 10px;
    width: 100%;
  }
`;

const Section = styled.div`
  margin-bottom: 30px;
`;

const Preformatted = styled.pre`
  background-color: #f5f5f5;
  padding: 10px;
  max-height: 300px;
  overflow: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-size: 0.9rem;
  box-sizing: border-box;

  @media (max-width: 600px) {
    max-height: 200px;
    font-size: 0.8rem;
  }
`;

// Helper Functions

// Convert string to hexadecimal
const stringToHex = (str) => {
  return [...str].map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
};

// Validate Tezos address using regex
const isValidTezosAddress = (address) => {
  const tezosAddressRegex = /^(tz1|tz2|tz3|KT1)[1-9A-HJ-NP-Za-km-z]{33}$/;
  return tezosAddressRegex.test(address);
};

// Calculate byte size of Data URI
const getByteSize = (dataUri) => {
  try {
    const base64Data = dataUri.split(',')[1];
    if (!base64Data) return 0;
    const padding = (base64Data.match(/=+$/) || [''])[0].length;
    return Math.floor((base64Data.length * 3) / 4) - padding;
  } catch (error) {
    console.error('Error calculating byte size:', error);
    return 0;
  }
};

// Constants for Metadata Keys
const TEZOS_STORAGE_CONTENT_KEY = 'tezos-storage:content';
const TEZOS_STORAGE_CONTENT_HEX = stringToHex(TEZOS_STORAGE_CONTENT_KEY);

const CONTENT_KEY = 'content';

// Google Form configuration
const GOOGLE_FORM_ACTION_URL =
  'https://docs.google.com/forms/u/0/d/e/1FAIpQLSc7SjaXTLFpeV6Prw7aW4RaZw9BWNC3EOgrd1tylPWyn4g37g/formResponse';

const GOOGLE_FORM_ENTRY_IDS = {
  contractAddress: 'entry.753925675',
  ownerAddress: 'entry.19257702',
  version: 'entry.22875591',
  // deploymentDate: 'entry.1586801890', // Uncomment if you decide to include this field
};

// Define storage cost per byte (tez per byte)
const STORAGE_COST_PER_BYTE = 0.00025; // tez per byte

const GenerateContract = () => {
  // Context and State Variables
  const { Tezos, isWalletConnected, walletAddress } = useContext(WalletContext);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    authors: '',
    authorAddresses: '',
    symbol: '',
    creators: '',
    type: 'art',
    imageUri: '',
    agreeToTerms: false,
    contractVersion: 'v1',
  });
  const [formErrors, setFormErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [contractAddress, setContractAddress] = useState('');
  const [deploying, setDeploying] = useState(false);
  const [modifiedMichelsonCode, setModifiedMichelsonCode] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ open: false, data: null });
  const [contractDialogOpen, setContractDialogOpen] = useState(false);

  const [michelsonCode, setMichelsonCode] = useState('');
  const [estimatedFeeTez, setEstimatedFeeTez] = useState(null);
  // eslint-disable-next-line
  const [estimatedGasLimit, setEstimatedGasLimit] = useState(null);
  // eslint-disable-next-line
  const [estimatedStorageLimit, setEstimatedStorageLimit] = useState(null);
  // eslint-disable-next-line
  const [estimatedBalanceChangeTez, setEstimatedBalanceChangeTez] = useState(null); // New state for balance change

  // Define the symbol validation regex
  const symbolPattern = /^[A-Za-z0-9]{3,5}$/;

  // Define the authors validation regex
  const authorsPattern = /^[A-Za-z0-9\s.,'-]+$/;

  // Supported Filetypes List
  const supportedFiletypesList = [
    'image/bmp',
    'image/gif',
    'image/jpeg',
    'image/png',
    'image/apng',
    'image/svg+xml',
    'image/webp',
    'video/mp4',
    'video/mpeg',
    'video/ogg',
    'video/webm',
    'model/gltf-binary',
    'model/gltf+json',
    'audio/mpeg',
    'audio/ogg',
    'audio/wav',
    'audio/wave',
    'audio/x-pn-wav',
    'audio/vnd.wave',
    'audio/x-wav',
    'audio/flac',
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'multipart/x-zip',
    'text/plain',
    'application/json',
    'text/html',
  ];

  // Fetch and Prepare Michelson Code
  useEffect(() => {
    const fetchMichelson = async () => {
      try {
        const MICHELSON_URLS = {
          v1: '/contracts/FOC.tz',
          v2: '/contracts/nft_editions.tz',
        };

        const response = await fetch(MICHELSON_URLS[formData.contractVersion]);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        let code = await response.text();

        if (!walletAddress) {
          throw new Error('Wallet address is undefined.');
        }

        if (formData.contractVersion === 'v1') {
          if (!code.includes('__ADMIN_ADDRESS__')) {
            throw new Error('Michelson code does not contain the placeholder __ADMIN_ADDRESS__.');
          }
          // Ensure correct replacement based on placeholder format
          // Check if placeholder has quotes or not
          if (code.includes('"__ADMIN_ADDRESS__"')) {
            // Placeholder with quotes
            const cleanWalletAddress = walletAddress.replace(/^"|"$/g, '');
            code = code.replace(/"__ADMIN_ADDRESS__"/g, `"${cleanWalletAddress}"`);
          } else {
            // Placeholder without quotes
            code = code.replace(/__ADMIN_ADDRESS__/g, `"${walletAddress}"`);
          }
        }

        setMichelsonCode(code);
        console.log('Fetched Michelson Code:', code);
      } catch (error) {
        console.error('Error fetching Michelson code:', error);
        setSnackbar({ open: true, message: 'Failed to load Michelson code.', severity: 'error' });
        setMichelsonCode('');
      }
    };

    if (isWalletConnected && walletAddress) {
      fetchMichelson();
    } else {
      setMichelsonCode('');
    }
  }, [walletAddress, isWalletConnected, formData.contractVersion]);

  // Validate Individual Fields
  const validateField = (fieldName, value) => {
    let error = '';

    switch (fieldName) {
      case 'name':
        if (!value) {
          error = 'Name is required.';
        } else if (value.length > 30) {
          error = 'Name cannot exceed 30 characters.';
        }
        break;

      case 'description':
        if (!value) {
          error = 'Description is required.';
        } else if (value.length > 250) {
          error = 'Description cannot exceed 250 characters.';
        }
        break;

      case 'symbol':
        if (!value) {
          error = 'Symbol is required.';
        } else if (value.length < 3) {
          error = 'Symbol must be at least 3 characters.';
        } else if (value.length > 5) {
          error = 'Symbol cannot exceed 5 characters.';
        } else if (!symbolPattern.test(value)) {
          error = 'Symbol must contain only letters and numbers.';
        }
        break;

      case 'creators':
        if (!value) {
          error = 'Creator(s) are required.';
        } else if (value.length > 200) {
          error = 'Creator(s) cannot exceed 200 characters.';
        } else {
          const creatorsArray = value.split(',').map((c) => c.trim());
          const uniqueCreators = new Set(creatorsArray);
          if (uniqueCreators.size !== creatorsArray.length) {
            error = 'Duplicate creators detected.';
          } else {
            for (let addr of creatorsArray) {
              if (!isValidTezosAddress(addr)) {
                error = `Invalid Tezos address detected: ${addr}`;
                break;
              }
            }
          }
        }
        break;

      case 'authors':
        if (!value) {
          error = 'Author(s) are required.';
        } else if (value.length > 50) {
          error = 'Author(s) cannot exceed 50 characters.';
        } else {
          const authorsArray = value.split(',').map((a) => a.trim());
          for (let author of authorsArray) {
            if (!authorsPattern.test(author)) {
              error = 'Author names can only contain letters, numbers, spaces, and standard punctuation (.,\'-). Emojis and special characters are not allowed.';
              break;
            }
          }
        }
        break;

      case 'authorAddresses':
        const authorsArray = formData.authors.split(',').map((a) => a.trim()).filter((a) => a !== '');
        const authorAddressesArray = value.split(',').map((a) => a.trim()).filter((a) => a !== '');
        if (authorsArray.length !== authorAddressesArray.length) {
          error = 'Number of authors and author addresses must match.';
        } else {
          for (let addr of authorAddressesArray) {
            if (!isValidTezosAddress(addr)) {
              error = `Invalid Tezos address detected: ${addr}`;
              break;
            }
          }
        }
        break;

      case 'imageUri':
        if (!value) {
          error = 'Image URI is required.';
        } else {
          const byteSize = getByteSize(value);
          if (byteSize > 20000) {
            error =
              'Image URI must be under 20KB. OBJKT and other platforms may not display thumbnails if it’s too long. Test on Ghostnet first, and compress your image to keep it tiny.';
          }
        }
        break;

      case 'agreeToTerms':
        if (!value) {
          error = 'You must agree to the terms and conditions.';
        }
        break;

      default:
        break;
    }

    return error;
  };

  // Validate the Entire Form
  const validateForm = () => {
    const tempErrors = {};

    // Validate each field and collect errors
    Object.keys(formData).forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) {
        tempErrors[field] = error;
      }
    });

    // Update the formErrors state once with all errors
    setFormErrors(tempErrors);

    // Return whether the form is valid (no errors)
    return Object.keys(tempErrors).length === 0;
  };

  // Handle Input Changes
  const handleInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: newValue }));

    // Validate the specific field that changed
    const error = validateField(name, newValue);
    setFormErrors((prevErrors) => ({
      ...prevErrors,
      [name]: error,
    }));
  };

  // Handle Thumbnail Upload
  const handleThumbnailUpload = (dataUri) => {
    setFormData((prev) => ({ ...prev, imageUri: dataUri }));
    const error = validateField('imageUri', dataUri);
    setFormErrors((prevErrors) => ({
      ...prevErrors,
      imageUri: error,
    }));
  };

  // Prepare Metadata Preview
  const [metadataPreview, setMetadataPreview] = useState(null);
  useEffect(() => {
    const { name, description, authors, authorAddresses, symbol, creators, type, imageUri } = formData;
    if (
      name &&
      description &&
      authors &&
      authorAddresses &&
      symbol &&
      creators &&
      type &&
      imageUri &&
      Object.keys(formErrors).length === 0
    ) {
      const metadataObj = {
        name: name,
        description: description,
        interfaces: ['TZIP-012', 'TZIP-016'],
        authors: authors.split(',').map((author) => author.trim()).filter((a) => a !== ''),
        authoraddress: authorAddresses.split(',').map((addr) => addr.trim()).filter((a) => a !== ''),
        symbol: symbol,
        creators: creators.split(',').map((creator) => creator.trim()).filter((a) => a !== ''),
        type: type,
        imageUri: imageUri,
      };
      setMetadataPreview(metadataObj);
    } else {
      setMetadataPreview(null);
    }
  }, [formData, formErrors]);

  // Automatically Generate Modified Michelson Code When Form Data is Valid
  useEffect(() => {
    const generateContract = async () => {
      if (!validateForm()) {
        setModifiedMichelsonCode('');
        return;
      }

      try {
        if (!michelsonCode) {
          throw new Error('Michelson code is not set.');
        }

        setModifiedMichelsonCode(michelsonCode);
        setSnackbar({ open: true, message: 'Contract generated successfully.', severity: 'success' });
      } catch (error) {
        console.error('Error generating contract:', error);
        setSnackbar({ open: true, message: 'Error generating contract. Please try again.', severity: 'error' });
        setModifiedMichelsonCode('');
      }
    };

    generateContract();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, michelsonCode]);

  // Handle Copy Contract
  const handleCopyContract = () => {
    if (!modifiedMichelsonCode) {
      setSnackbar({ open: true, message: 'Please generate the contract first.', severity: 'warning' });
      return;
    }

    navigator.clipboard
      .writeText(modifiedMichelsonCode)
      .then(() => {
        setSnackbar({ open: true, message: 'Contract copied to clipboard!', severity: 'success' });
      })
      .catch((err) => {
        console.error('Failed to copy contract:', err);
        setSnackbar({ open: true, message: 'Failed to copy contract.', severity: 'error' });
      });
  };

  // Function to submit data to Google Form using a hidden form submission
  const submitToGoogleForm = (contractAddr, ownerAddr, version) => {
    return new Promise((resolve, reject) => {
      const form = document.createElement('form');
      form.action = GOOGLE_FORM_ACTION_URL;
      form.method = 'POST';
      form.target = 'hidden_iframe'; // Targeting a hidden iframe to prevent page reload

      // Create hidden input fields for each form entry
      const fields = {
        [GOOGLE_FORM_ENTRY_IDS.contractAddress]: contractAddr,
        [GOOGLE_FORM_ENTRY_IDS.ownerAddress]: ownerAddr,
        [GOOGLE_FORM_ENTRY_IDS.version]: version,
      };

      for (const [key, value] of Object.entries(fields)) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
      }

      // Append the form to the body
      document.body.appendChild(form);

      // Create a hidden iframe if it doesn't exist
      let iframe = document.getElementById('hidden_iframe');
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.name = 'hidden_iframe';
        iframe.id = 'hidden_iframe';
        // Resolve the promise when the iframe loads (i.e., form submission is complete)
        iframe.onload = () => {
          // Assume success since Google Forms doesn't provide a response
          resolve();
        };
        document.body.appendChild(iframe);
      }

      // Submit the form
      form.submit();

      // Remove the form after submission
      setTimeout(() => {
        document.body.removeChild(form);
        resolve();
      }, 1000); // Adjust the timeout as needed
    });
  };

  // Handle Contract Deployment
  const handleDeployContract = async () => {
    if (!validateForm()) {
      setSnackbar({ open: true, message: 'Please fix the errors in the form before deploying.', severity: 'error' });
      return;
    }

    if (!isWalletConnected) {
      setSnackbar({ open: true, message: 'Please connect your wallet.', severity: 'error' });
      return;
    }

    if (!walletAddress) {
      setSnackbar({
        open: true,
        message: 'Wallet address is undefined. Please reconnect your wallet.',
        severity: 'error',
      });
      return;
    }

    if (!modifiedMichelsonCode) {
      setSnackbar({ open: true, message: 'Please generate the contract first.', severity: 'warning' });
      return;
    }

    // Perform fee estimation before opening the confirmation dialog
    setDeploying(true);
    setSnackbar({ open: true, message: 'Checking balance and estimating fees...', severity: 'info' });

    try {
      // Define the metadata object
      const metadataObj = {
        name: formData.name,
        description: formData.description,
        interfaces: ['TZIP-012', 'TZIP-016'],
        authors: formData.authors.split(',').map((author) => author.trim()).filter((a) => a !== ''),
        authoraddress: formData.authorAddresses.split(',').map((addr) => addr.trim()).filter((a) => a !== ''),
        symbol: formData.symbol,
        creators: formData.creators.split(',').map((creator) => creator.trim()).filter((a) => a !== ''),
        type: formData.type,
        imageUri: formData.imageUri,
      };

      const jsonString = JSON.stringify(metadataObj);
      const metadataHex = stringToHex(jsonString);

      const metadataMap = new MichelsonMap();
      metadataMap.set('', TEZOS_STORAGE_CONTENT_HEX);
      metadataMap.set(CONTENT_KEY, metadataHex);

      const ledgerMap = new MichelsonMap();
      const operatorsMap = new MichelsonMap();
      const tokenMetadataMap = new MichelsonMap();

      let storage;

      if (formData.contractVersion === 'v1') {
        storage = {
          admin: walletAddress,
          ledger: ledgerMap,
          metadata: metadataMap,
          next_token_id: 0,
          operators: operatorsMap,
          token_metadata: tokenMetadataMap,
          parents: [], // Should be an empty set
          children: [], // Should be an empty set
        };
      } else if (formData.contractVersion === 'v2') {
        storage = {
          admin: walletAddress, // address
          all_tokens: 0, // nat
          children: [], // set(address) - should be empty set
          ledger: ledgerMap, // big_map
          metadata: metadataMap, // big_map
          next_token_id: 0, // nat
          operators: operatorsMap, // big_map
          parents: [], // set(address) - should be empty set
          paused: false, // bool
          token_metadata: tokenMetadataMap, // big_map
          total_supply: new MichelsonMap(), // big_map(nat, nat)
        };
      }

      // **Debugging: Log Storage Object**
      console.log('Storage Object for Estimation:', storage);

      // Fetch user's balance
      const balanceMutez = await Tezos.tz.getBalance(walletAddress);
      const balanceTez = new BigNumber(balanceMutez.toNumber()).dividedBy(1e6);

      // Estimate origination operation
      const originationEstimation = await Tezos.estimate.originate({
        code: modifiedMichelsonCode,
        storage: storage,
      });

      const estimatedFeeMutez = originationEstimation.suggestedFeeMutez;
      const estimatedGasLimitLocal = originationEstimation.gasLimit;
      const estimatedStorageLimitLocal = originationEstimation.storageLimit;

      const estimatedFeeTezLocal = new BigNumber(estimatedFeeMutez).dividedBy(1e6).toFixed(6);
      setEstimatedFeeTez(estimatedFeeTezLocal);
      setEstimatedGasLimit(estimatedGasLimitLocal);
      setEstimatedStorageLimit(estimatedStorageLimitLocal);

      // Calculate Storage Cost
      const storageCostTez = new BigNumber(estimatedStorageLimitLocal).multipliedBy(STORAGE_COST_PER_BYTE).toFixed(6);

      // Calculate Total Estimated Cost
      const totalEstimatedCostTez = new BigNumber(estimatedFeeTezLocal).plus(storageCostTez).toFixed(6);

      // Calculate Estimated Balance Change (Total Cost)
      const estimatedBalanceChange = new BigNumber(totalEstimatedCostTez).negated().toFixed(6); // Negative value

      setEstimatedBalanceChangeTez(estimatedBalanceChange);

      // **Debugging: Log Fee Estimates**
      console.log('Estimated Fee (Tez):', estimatedFeeTezLocal);
      console.log('Estimated Gas Limit:', estimatedGasLimitLocal);
      console.log('Estimated Storage Limit:', estimatedStorageLimitLocal);
      console.log('Storage Cost (Tez):', storageCostTez);
      console.log('Total Estimated Cost (Tez):', totalEstimatedCostTez);
      console.log('Estimated Balance Change (Tez):', estimatedBalanceChange);

      // Check if the balance is sufficient
      if (balanceTez.isLessThan(totalEstimatedCostTez)) {
        setSnackbar({
          open: true,
          message: `Insufficient balance. You need at least ${totalEstimatedCostTez} ꜩ to deploy this contract.`,
          severity: 'error',
        });
        setDeploying(false);
        return;
      }

      // Open Confirmation Dialog with estimation data
      setConfirmDialog({
        open: true,
        data: {
          estimatedFeeTez: estimatedFeeTezLocal,
          estimatedGasLimit: estimatedGasLimitLocal,
          estimatedStorageLimit: estimatedStorageLimitLocal,
          storageCostTez: storageCostTez, // New field
          estimatedBalanceChangeTez: estimatedBalanceChange,
        },
      });
    } catch (error) {
      console.error('Error during fee estimation:', error);

      setSnackbar({
        open: true,
        message: 'Error estimating fees. Please try again.',
        severity: 'error',
      });
      setDeploying(false);
    }
  };

  // Confirm Deployment with Balance Check
  const confirmDeployment = async () => {
    setConfirmDialog({ open: false, data: null });
    setDeploying(true);
    setSnackbar({ open: true, message: 'Deploying contract...', severity: 'info' });

    try {
      // Define the metadata object
      const metadataObj = {
        name: formData.name,
        description: formData.description,
        interfaces: ['TZIP-012', 'TZIP-016'],
        authors: formData.authors.split(',').map((author) => author.trim()).filter((a) => a !== ''),
        authoraddress: formData.authorAddresses.split(',').map((addr) => addr.trim()).filter((a) => a !== ''),
        symbol: formData.symbol,
        creators: formData.creators.split(',').map((creator) => creator.trim()).filter((a) => a !== ''),
        type: formData.type,
        imageUri: formData.imageUri,
      };

      const jsonString = JSON.stringify(metadataObj);
      const metadataHex = stringToHex(jsonString);

      const metadataMap = new MichelsonMap();
      metadataMap.set('', TEZOS_STORAGE_CONTENT_HEX);
      metadataMap.set(CONTENT_KEY, metadataHex);

      const ledgerMap = new MichelsonMap();
      const operatorsMap = new MichelsonMap();
      const tokenMetadataMap = new MichelsonMap();

      let storage;

      if (formData.contractVersion === 'v1') {
        storage = {
          admin: walletAddress,
          ledger: ledgerMap,
          metadata: metadataMap,
          next_token_id: 0,
          operators: operatorsMap,
          token_metadata: tokenMetadataMap,
          parents: [], // Should be an empty set
          children: [], // Should be an empty set
        };
      } else if (formData.contractVersion === 'v2') {
        storage = {
          admin: walletAddress, // address
          all_tokens: 0, // nat
          children: [], // set(address) - should be empty set
          ledger: ledgerMap, // big_map
          metadata: metadataMap, // big_map
          next_token_id: 0, // nat
          operators: operatorsMap, // big_map
          parents: [], // set(address) - should be empty set
          paused: false, // bool
          token_metadata: tokenMetadataMap, // big_map
          total_supply: new MichelsonMap(), // big_map(nat, nat)
        };
      }

      // **Debugging: Log Storage Object for Origination**
      console.log('Storage Object for Origination:', storage);

      // Proceed with origination
      const originationOp = await Tezos.wallet
        .originate({
          code: modifiedMichelsonCode,
          storage: storage,
        })
        .send();

      setSnackbar({ open: true, message: 'Awaiting confirmation...', severity: 'info' });

      await originationOp.confirmation();

      const contract = await originationOp.contract();
      const contractAddr = contract.address;

      if (contractAddr) {
        setContractAddress(contractAddr);
        setSnackbar({
          open: true,
          message: `Contract deployed at ${contractAddr}`,
          severity: 'success',
        });
        setContractDialogOpen(true);

        // Submit data to Google Form
        await submitToGoogleForm(contractAddr, walletAddress, formData.contractVersion);

        setSnackbar({
          open: true,
          message: `Contract deployed at ${contractAddr} and submitted for gallery update.`,
          severity: 'success',
        });

        // Store the deployed contract in localStorage for management
        const storedContracts = JSON.parse(localStorage.getItem('deployedContracts')) || [];
        storedContracts.push({ address: contractAddr, owner: walletAddress });
        localStorage.setItem('deployedContracts', JSON.stringify(storedContracts));
      } else {
        setSnackbar({
          open: true,
          message: 'Failed to retrieve contract address.',
          severity: 'error',
        });
      }
    } catch (error) {
      console.error('Error deploying contract:', error);

      if (error.name === 'AbortedBeaconError') {
        setSnackbar({
          open: true,
          message: 'Deployment aborted by the user.',
          severity: 'warning',
        });
      } else if (error?.data?.[0]?.with?.string) {
        const errorMessage = error.data[0].with.string;
        if (errorMessage.includes('balance_too_low')) {
          setSnackbar({
            open: true,
            message: 'Insufficient balance to cover fees and storage costs.',
            severity: 'error',
          });
        } else {
          setSnackbar({
            open: true,
            message: `Deployment error: ${errorMessage}`,
            severity: 'error',
          });
        }
      } else if (error.message) {
        setSnackbar({
          open: true,
          message: `Error deploying contract: ${error.message}`,
          severity: 'error',
        });
      } else {
        setSnackbar({
          open: true,
          message: 'Error deploying contract. Please try again.',
          severity: 'error',
        });
      }
    } finally {
      setDeploying(false);
      setEstimatedFeeTez(null);
      setEstimatedGasLimit(null);
      setEstimatedStorageLimit(null);
      setEstimatedBalanceChangeTez(null); // Reset balance change
    }
  };

  // Handle Close Confirmation Dialog
  const handleCloseDialog = () => {
    setConfirmDialog({ open: false, data: null });
  };

  // Handle Close Snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Handle Close Contract Dialog
  const handleCloseContractDialog = () => {
    setContractDialogOpen(false);
  };

  // Handle Before Unload Event to Warn User
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (contractAddress && !contractDialogOpen) {
        e.preventDefault();
        e.returnValue = 'You have not copied your contract address. Are you sure you want to leave this page?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [contractAddress, contractDialogOpen]);

  return (
    <Container elevation={3}>
      <Typography variant="h4" gutterBottom align="center">
        Deploy Your On-Chain Tezos NFT Smart Contract
      </Typography>
      <Typography variant="h5" gutterBottom align="center">
        NFT Collection Contract
      </Typography>
      <Typography variant="body1" gutterBottom align="center">
        Ready to mint your NFTs fully on-chain? Just fill in the details below, and we’ll handle the metadata magic, swapping in your info and wallet address before deploying it on Tezos with Taquito. Big thanks to{' '}
        <Link
          href="https://x.com/JestemZero"
          target="_blank"
          rel="noopener noreferrer"
          color="primary"
          underline="hover"
        >
          @JestemZero
        </Link>
        ’s clever #ZeroContract and{' '}
        <Link
          href="https://x.com/jams2blues"
          target="_blank"
          rel="noopener noreferrer"
          color="primary"
          underline="hover"
        >
          @jams2blues
        </Link>{' '}
        for the late nights – powered by sheer willpower and love.
      </Typography>

      {/* Liability Disclaimer */}
      <Section>
        <Alert severity="warning">
          <Typography variant="body2">
            <strong>Disclaimer:</strong> By deploying contracts and NFTs via this platform, you accept full responsibility for your on-chain actions. On Tezos, contracts are immutable and cannot be deleted or altered once deployed. Save The World With Art™ holds no liability for any content you create or deploy. Always test thoroughly on{' '}
            <Link
              href="https://ghostnet.savetheworldwithart.io"
              color="primary"
              underline="hover"
              target="_blank"
              rel="noopener noreferrer"
            >
              Ghostnet.savetheworldwithart.io
            </Link>{' '}
            before deploying to mainnet, as all actions are final and permanent. If you make a mistake you can hide the collection from your main objkt portfolio or burn any erroneous tokens.⚠️ OBJKT might not display Collection Thumbnails over 254 Characters, so make 'em teeny tiny!
          </Typography>
        </Alert>
      </Section>

      {/* Wallet Connection Status */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        {isWalletConnected ? (
          <Typography variant="subtitle1">Wallet Connected: {walletAddress}</Typography>
        ) : (
          <Typography variant="subtitle1">Please connect your wallet to proceed.</Typography>
        )}
      </div>

      {/* Step 1: Fill Contract Details */}
      <Section>
        <Typography variant="h6" gutterBottom>
          Step 1: Fill in Your Collection Details
        </Typography>
        <form noValidate autoComplete="off">
          <Grid container spacing={2}>
            {/* Contract Version Selection */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="contract-version-label">Contract Version *</InputLabel>
                <Select
                  labelId="contract-version-label"
                  id="contract-version-select"
                  name="contractVersion"
                  value={formData.contractVersion}
                  label="Contract Version *"
                  onChange={handleInputChange}
                >
                  <MenuItem value="v1">#ZeroContract v1 - 1/1 NFTs Only</MenuItem>
                  <MenuItem value="v2">#ZeroContract v2 - Can Mint Multiple Editions</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* NFT Collection Name */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="NFT Collection Name *"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                fullWidth
                placeholder="e.g., SaveTheWorldWithArt"
                required
                inputProps={{
                  maxLength: 30,
                }}
                helperText={`${formData.name.length}/30 characters`}
                error={!!formErrors.name}
                FormHelperTextProps={{ style: { color: 'red' } }}
              />
            </Grid>

            {/* NFT Symbol */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="NFT Symbol *"
                name="symbol"
                value={formData.symbol}
                onChange={handleInputChange}
                fullWidth
                placeholder="Unique symbol, e.g., SWTWA"
                required
                inputProps={{
                  maxLength: 5,
                }}
                helperText={`${formData.symbol.length}/5 characters. Allowed: Letters and numbers only`}
                error={!!formErrors.symbol}
                FormHelperTextProps={{ style: { color: 'red' } }}
              />
            </Grid>

            {/* NFT Collection Description */}
            <Grid item xs={12}>
              <TextField
                label="NFT Collection Description *"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={4}
                placeholder="Provide a brief description of your NFT collection."
                required
                inputProps={{
                  maxLength: 250,
                }}
                helperText={`${formData.description.length}/250 characters`}
                error={!!formErrors.description}
                FormHelperTextProps={{ style: { color: 'red' } }}
              />
            </Grid>

            {/* NFT Authors */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Author(s) *"
                name="authors"
                value={formData.authors}
                onChange={handleInputChange}
                fullWidth
                placeholder="Comma-separated names, e.g., Alice, Bob"
                required
                inputProps={{
                  maxLength: 50,
                }}
                helperText={`${formData.authors.length}/50 characters. Allowed: Letters, numbers, spaces, and standard punctuation (.,'-).`}
                error={!!formErrors.authors}
                FormHelperTextProps={{ style: { color: 'red' } }}
              />
            </Grid>

            {/* Author Addresses */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Author Address(es) *"
                name="authorAddresses"
                value={formData.authorAddresses}
                onChange={handleInputChange}
                fullWidth
                placeholder="Comma-separated Tezos addresses, e.g., tz1..., tz2..."
                required
                inputProps={{
                  maxLength: 200,
                }}
                helperText={`${formData.authorAddresses.length}/200 characters`}
                error={!!formErrors.authorAddresses}
                FormHelperTextProps={{ style: { color: 'red' } }}
              />
            </Grid>

            {/* NFT Creators */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Creator(s) *"
                name="creators"
                value={formData.creators}
                onChange={handleInputChange}
                fullWidth
                placeholder="Comma-separated Tezos addresses, e.g., tz1..., tz2..."
                required
                inputProps={{
                  maxLength: 200,
                }}
                helperText={`${formData.creators.length}/200 characters`}
                error={!!formErrors.creators}
                FormHelperTextProps={{ style: { color: 'red' } }}
              />
            </Grid>

            {/* Type Dropdown */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal" error={!!formErrors.type}>
                <InputLabel id="type-label">Type *</InputLabel>
                <Select
                  labelId="type-label"
                  id="type-select"
                  name="type"
                  value={formData.type}
                  label="Type *"
                  onChange={handleInputChange}
                >
                  <MenuItem value="art">Art</MenuItem>
                  <MenuItem value="music">Music</MenuItem>
                  <MenuItem value="collectible">Collectible</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
                {formErrors.type && (
                  <Typography variant="caption" color="error">
                    {formErrors.type}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            {/* Upload Collection Thumbnail */}
            <Grid item xs={12}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <FileUpload setArtifactData={handleThumbnailUpload} />
                <Tooltip
                  title={
                    <React.Fragment>
                      <Typography variant="subtitle2">Supported Filetypes:</Typography>
                      <Typography variant="body2">
                        {supportedFiletypesList.join(', ')}
                      </Typography>
                    </React.Fragment>
                  }
                  arrow
                >
                  <IconButton
                    size="small"
                    style={{ marginLeft: '8px' }}
                    aria-label="Supported Filetypes"
                  >
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </div>
              {/* Display File Constraints */}
              <Typography variant="caption" color="error" style={{ marginTop: '5px', display: 'block' }}>
                • Thumbnail must be 1:1 aspect ratio and under 15KB
              </Typography>
            </Grid>

            {/* Agree to Terms and Conditions */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.agreeToTerms}
                    onChange={handleInputChange}
                    name="agreeToTerms"
                    color="primary"
                  />
                }
                label={
                  <span>
                    I agree to the{' '}
                    <Link href="/terms" target="_blank" rel="noopener noreferrer">
                      Terms and Conditions
                    </Link>
                    .
                  </span>
                }
              />
              {formErrors.agreeToTerms && (
                <Typography variant="caption" color="error">
                  {formErrors.agreeToTerms}
                </Typography>
              )}
            </Grid>

            {/* Display Preview */}
            {metadataPreview && (
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Metadata Preview:
                </Typography>
                <NFTPreview metadata={metadataPreview} />
              </Grid>
            )}

            {/* Buttons */}
            <Grid item xs={12} style={{ textAlign: 'center', marginTop: '20px' }}>
              {/* "Copy Contract" Button */}
              <div style={{ marginBottom: '10px' }}>
                <Typography variant="caption" display="block" gutterBottom>
                  for advanced users
                </Typography>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={handleCopyContract}
                  disabled={!modifiedMichelsonCode}
                  fullWidth={window.innerWidth < 600} // Responsive fullWidth
                  sx={{
                    maxWidth: '300px',
                    margin: '0 auto',
                  }}
                >
                  Copy Contract
                </Button>
              </div>

              {/* "Deploy Contract" Button */}
              <div>
                <Typography variant="caption" display="block" gutterBottom>
                  Get your collection on-chain so you can start minting!
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleDeployContract}
                  disabled={deploying || !modifiedMichelsonCode || Object.keys(formErrors).length > 0}
                  startIcon={deploying && <CircularProgress size={20} />}
                  fullWidth={window.innerWidth < 600} // Responsive fullWidth
                  sx={{
                    maxWidth: '300px',
                    margin: '0 auto',
                  }}
                >
                  {deploying ? 'Deploying...' : 'Deploy Contract'}
                </Button>
                {/* Display Estimated Fees */}
                {estimatedFeeTez && (
                  <Typography variant="body2" color="textSecondary" style={{ marginTop: '10px' }}>
                    Estimated Fees: {estimatedFeeTez} ꜩ
                  </Typography>
                )}
              </div>
            </Grid>
          </Grid>
        </form>
      </Section>

      {/* Step 2: Display Contract Address */}
      {contractAddress && (
        <Section>
          <Typography variant="h6" gutterBottom>
            Step 2: Your Contract is Deployed
          </Typography>
          <Typography variant="body2" gutterBottom>
            Your contract has been successfully deployed. Below is your contract address. You can use this address to mint NFTs.
          </Typography>
          <Preformatted>{contractAddress}</Preformatted>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => navigator.clipboard.writeText(contractAddress)}
            style={{ marginTop: '10px' }}
            fullWidth
            sx={{
              maxWidth: '300px',
              margin: '10px auto 0',
            }}
          >
            Copy Contract Address
          </Button>
          <Typography variant="body2" style={{ marginTop: '10px' }}>
            Please check your contract on{' '}
            <Link
              href={`https://better-call.dev/mainnet/${contractAddress}/operations`}
              target="_blank"
              rel="noopener noreferrer"
              color="primary"
              underline="hover"
            >
              Better Call Dev
            </Link>{' '}
            or{' '}
            <Link
              href={`https://objkt.com/collections/${contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              color="primary"
              underline="hover"
            >
              OBJKT.com
            </Link>{' '}
            to verify your contract.
          </Typography>
        </Section>
      )}

      {/* Contract Address Dialog */}
      <Dialog
        open={contractDialogOpen}
        onClose={(event, reason) => {
          if (reason && (reason === 'backdropClick' || reason === 'escapeKeyDown')) {
            // Do nothing to prevent closing
            return;
          }
          handleCloseContractDialog();
        }}
        aria-labelledby="contract-dialog-title"
        aria-describedby="contract-dialog-description"
        fullWidth
        maxWidth="sm" // Limit dialog width
      >
        <DialogTitle id="contract-dialog-title">Your Contract Address</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Your contract has been successfully deployed. Please copy and save your contract address.
          </Typography>
          <Preformatted>{contractAddress}</Preformatted>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigator.clipboard.writeText(contractAddress)}
            style={{ marginTop: '10px' }}
            fullWidth
          >
            Copy Contract Address
          </Button>
          <Typography variant="body2" style={{ marginTop: '10px' }}>
            You can also view your contract on{' '}
            <Link
              href={`https://better-call.dev/mainnet/${contractAddress}/operations`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Better Call Dev
            </Link>{' '}
            or{' '}
            <Link
              href={`https://objkt.com/collections/${contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              OBJKT.com
            </Link>
            .
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseContractDialog} color="primary">
            I have saved it
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleCloseDialog}
        aria-labelledby="confirm-deployment-title"
        aria-describedby="confirm-deployment-description"
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle id="confirm-deployment-title">Confirm Deployment</DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-deployment-description">
            Are you sure you want to deploy this smart contract? This action is irreversible, and the contract cannot be deleted once deployed on the Tezos mainnet.
            <br /><br />
            <strong>Estimated Deployment Cost (Fee):</strong> {confirmDialog.data ? `${confirmDialog.data.estimatedFeeTez} ꜩ` : 'Calculating...'}{' '}
            <Tooltip title="The network fee required to deploy your smart contract on the Tezos blockchain." arrow>
              <InfoIcon fontSize="small" style={{ marginLeft: '5px', verticalAlign: 'middle', cursor: 'pointer' }} />
            </Tooltip>
            <br />
            <strong>Gas Limit:</strong> {confirmDialog.data ? confirmDialog.data.estimatedGasLimit : 'Calculating...'}{' '}
            <Tooltip title="The maximum amount of computational work allowed for the deployment operation." arrow>
              <InfoIcon fontSize="small" style={{ marginLeft: '5px', verticalAlign: 'middle', cursor: 'pointer' }} />
            </Tooltip>
            <br />
            <strong>Storage Limit:</strong> {confirmDialog.data ? confirmDialog.data.estimatedStorageLimit : 'Calculating...'}{' '}
            <Tooltip title="The maximum amount of storage allocated for your contract's data on the blockchain." arrow>
              <InfoIcon fontSize="small" style={{ marginLeft: '5px', verticalAlign: 'middle', cursor: 'pointer' }} />
            </Tooltip>
            <br />
            <strong>Estimated Storage Cost:</strong> {confirmDialog.data ? `${confirmDialog.data.storageCostTez} ꜩ` : 'Calculating...'}{' '}
            <Tooltip title="The cost associated with storing your contract's data on the Tezos blockchain." arrow>
              <InfoIcon fontSize="small" style={{ marginLeft: '5px', verticalAlign: 'middle', cursor: 'pointer' }} />
            </Tooltip>
            <br />
            <strong>Estimated Balance Change:</strong> {confirmDialog.data ? `${confirmDialog.data.estimatedBalanceChangeTez} ꜩ` : 'Calculating...'}{' '}
            <Tooltip title="The total estimated change in your account balance after deploying the contract (fee + storage cost)." arrow>
              <InfoIcon fontSize="small" style={{ marginLeft: '5px', verticalAlign: 'middle', cursor: 'pointer' }} />
            </Tooltip>
          </DialogContentText>
          <Typography variant="subtitle2" color="error" style={{ marginTop: '10px' }}>
            **Please ensure all the information is correct before proceeding.**
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmDeployment} color="primary" variant="contained" autoFocus>
            Confirm Deployment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default GenerateContract;
