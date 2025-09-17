// Contract ABIs and addresses
export const CONTRACTS = {
  ISSUER_REGISTRY: {
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_ISSUER_REGISTRY || '',
    abi: [
      "function registerIssuer(address issuerAddress, string memory name, string memory description, string memory website, string memory logoUrl) external",
      "function deactivateIssuer(address issuerAddress) external",
      "function activateIssuer(address issuerAddress) external",
      "function updateIssuer(address issuerAddress, string memory description, string memory website, string memory logoUrl) external",
      "function isActiveIssuer(address issuerAddress) public view returns (bool)",
      "function getIssuer(address issuerAddress) external view returns (tuple(string name, string description, string website, string logoUrl, bool isActive, uint256 registeredAt, uint256 credentialsIssued))",
      "function getAllIssuers() external view returns (address[])",
      "function getTotalIssuers() external view returns (uint256)",
      "function hasRole(bytes32 role, address account) public view returns (bool)",
      "function ADMIN_ROLE() public view returns (bytes32)",
      "event IssuerRegistered(address indexed issuerAddress, string name, uint256 timestamp)",
      "event IssuerDeactivated(address indexed issuerAddress, string name, uint256 timestamp)",
      "event IssuerActivated(address indexed issuerAddress, string name, uint256 timestamp)"
    ]
  },
  CREDENTIAL_NFT: {
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_CREDENTIAL_NFT || '',
    abi: [
      "function issueCredential(address recipientAddress, string memory credentialType, string memory subject, string memory recipientName, uint256 validUntil, string memory additionalData, string memory tokenURI) external returns (uint256)",
      "function revokeCredential(uint256 tokenId, string memory reason) external",
      "function isCredentialValid(uint256 tokenId) public view returns (bool)",
      "function getCredential(uint256 tokenId) external view returns (tuple(string credentialType, string subject, string recipientName, address recipientAddress, address issuerAddress, uint256 issuedAt, uint256 validUntil, string additionalData, bool isRevoked, uint256 revokedAt, string revocationReason))",
      "function verifyCredential(uint256 tokenId) external view returns (bool isValid, string memory issuerName, tuple(string credentialType, string subject, string recipientName, address recipientAddress, address issuerAddress, uint256 issuedAt, uint256 validUntil, string additionalData, bool isRevoked, uint256 revokedAt, string revocationReason) credentialData)",
      "function getRecipientCredentials(address recipient) external view returns (uint256[])",
      "function getIssuerCredentials(address issuer) external view returns (uint256[])",
      "function totalSupply() external view returns (uint256)",
      "function ownerOf(uint256 tokenId) external view returns (address)",
      "function tokenURI(uint256 tokenId) public view returns (string memory)",
      "event CredentialIssued(uint256 indexed tokenId, address indexed recipient, address indexed issuer, string credentialType, uint256 timestamp)",
      "event CredentialRevoked(uint256 indexed tokenId, address indexed issuer, string reason, uint256 timestamp)"
    ]
  }
}

export const NETWORK_CONFIG = {
  43113: {
    name: 'Avalanche Fuji Testnet',
    rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
    blockExplorer: 'https://testnet.snowtrace.io',
    currency: 'AVAX'
  },
  43114: {
    name: 'Avalanche Mainnet',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    blockExplorer: 'https://snowtrace.io',
    currency: 'AVAX'
  },
  31337: {
    name: 'Hardhat Local',
    rpcUrl: 'http://127.0.0.1:8545',
    blockExplorer: 'http://localhost:8545',
    currency: 'ETH'
  }
}

// Credential types
export const CREDENTIAL_TYPES = [
  'Bachelor Degree',
  'Master Degree',
  'PhD Degree',
  'Certificate',
  'Diploma',
  'Professional License',
  'Training Certificate',
  'Skill Certificate',
  'Achievement Badge',
  'Other'
]

// Common subjects/fields of study
export const COMMON_SUBJECTS = [
  'Computer Science',
  'Software Engineering',
  'Data Science',
  'Artificial Intelligence',
  'Cybersecurity',
  'Business Administration',
  'Finance',
  'Marketing',
  'Medicine',
  'Law',
  'Engineering',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Psychology',
  'Other'
]
