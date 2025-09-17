// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./IssuerRegistry.sol";

/**
 * @title CredentialNFT
 * @dev NFT contract for verifiable credentials
 * Each NFT represents a credential issued by an approved issuer
 */
contract CredentialNFT is ERC721, ERC721URIStorage, AccessControl, Pausable {
    using Counters for Counters.Counter;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    Counters.Counter private _tokenIdCounter;
    IssuerRegistry public immutable issuerRegistry;

    struct CredentialMetadata {
        string credentialType; // e.g., "Diploma", "Certificate", "License"
        string subject; // e.g., "Bachelor of Science in Computer Science"
        string recipientName;
        address recipientAddress;
        address issuerAddress;
        uint256 issuedAt;
        uint256 validUntil; // 0 for permanent credentials
        string additionalData; // JSON string for extra data
        bool isRevoked;
        uint256 revokedAt;
        string revocationReason;
    }

    mapping(uint256 => CredentialMetadata) public credentials;
    mapping(address => uint256[]) public recipientCredentials;
    mapping(address => uint256[]) public issuerCredentials;

    event CredentialIssued(
        uint256 indexed tokenId,
        address indexed recipient,
        address indexed issuer,
        string credentialType,
        uint256 timestamp
    );

    event CredentialRevoked(
        uint256 indexed tokenId,
        address indexed issuer,
        string reason,
        uint256 timestamp
    );

    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender), "Caller is not an admin");
        _;
    }

    modifier onlyActiveIssuer() {
        require(
            issuerRegistry.isActiveIssuer(msg.sender),
            "Caller is not an active issuer"
        );
        _;
    }

    modifier onlyIssuerOfToken(uint256 tokenId) {
        require(_exists(tokenId), "Token does not exist");
        require(
            credentials[tokenId].issuerAddress == msg.sender,
            "Only the issuer can perform this action"
        );
        _;
    }

    constructor(
        string memory name,
        string memory symbol,
        address issuerRegistryAddress,
        address admin
    ) ERC721(name, symbol) {
        require(issuerRegistryAddress != address(0), "Invalid registry address");
        require(admin != address(0), "Invalid admin address");

        issuerRegistry = IssuerRegistry(issuerRegistryAddress);
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
    }

    /**
     * @dev Issue a new credential NFT
     * @param recipientAddress Address of the credential recipient
     * @param credentialType Type of credential
     * @param subject Subject/title of the credential
     * @param recipientName Name of the recipient
     * @param validUntil Expiration timestamp (0 for permanent)
     * @param additionalData Additional data in JSON format
     * @param credentialTokenURI URI pointing to credential metadata
     */
    function issueCredential(
        address recipientAddress,
        string memory credentialType,
        string memory subject,
        string memory recipientName,
        uint256 validUntil,
        string memory additionalData,
        string memory credentialTokenURI
    ) external onlyActiveIssuer whenNotPaused returns (uint256) {
        require(recipientAddress != address(0), "Invalid recipient address");
        require(bytes(credentialType).length > 0, "Credential type required");
        require(bytes(subject).length > 0, "Subject required");
        require(bytes(recipientName).length > 0, "Recipient name required");

        if (validUntil > 0) {
            require(validUntil > block.timestamp, "Invalid expiration date");
        }

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        // Mint the NFT to the recipient
        _safeMint(recipientAddress, tokenId);
        _setTokenURI(tokenId, credentialTokenURI);

        // Store credential metadata
        credentials[tokenId] = CredentialMetadata({
            credentialType: credentialType,
            subject: subject,
            recipientName: recipientName,
            recipientAddress: recipientAddress,
            issuerAddress: msg.sender,
            issuedAt: block.timestamp,
            validUntil: validUntil,
            additionalData: additionalData,
            isRevoked: false,
            revokedAt: 0,
            revocationReason: ""
        });

        // Update tracking arrays
        recipientCredentials[recipientAddress].push(tokenId);
        issuerCredentials[msg.sender].push(tokenId);

        // Increment issuer's credential count
        try issuerRegistry.incrementCredentialCount(msg.sender) {} catch {}

        emit CredentialIssued(
            tokenId,
            recipientAddress,
            msg.sender,
            credentialType,
            block.timestamp
        );

        return tokenId;
    }

    /**
     * @dev Revoke a credential
     * @param tokenId ID of the credential to revoke
     * @param reason Reason for revocation
     */
    function revokeCredential(
        uint256 tokenId,
        string memory reason
    ) external onlyIssuerOfToken(tokenId) whenNotPaused {
        require(!credentials[tokenId].isRevoked, "Credential already revoked");
        require(bytes(reason).length > 0, "Revocation reason required");

        credentials[tokenId].isRevoked = true;
        credentials[tokenId].revokedAt = block.timestamp;
        credentials[tokenId].revocationReason = reason;

        emit CredentialRevoked(
            tokenId,
            msg.sender,
            reason,
            block.timestamp
        );
    }

    /**
     * @dev Check if a credential is valid
     * @param tokenId ID of the credential
     * @return bool True if credential is valid (not revoked and not expired)
     */
    function isCredentialValid(uint256 tokenId) public view returns (bool) {
        if (!_exists(tokenId)) return false;
        
        CredentialMetadata memory cred = credentials[tokenId];
        
        // Check if revoked
        if (cred.isRevoked) return false;
        
        // Check if expired
        if (cred.validUntil > 0 && cred.validUntil <= block.timestamp) {
            return false;
        }
        
        // Check if issuer is still active
        if (!issuerRegistry.isActiveIssuer(cred.issuerAddress)) {
            return false;
        }
        
        return true;
    }

    /**
     * @dev Get credential metadata
     * @param tokenId ID of the credential
     * @return CredentialMetadata Credential metadata struct
     */
    function getCredential(uint256 tokenId)
        external
        view
        returns (CredentialMetadata memory)
    {
        require(_exists(tokenId), "Token does not exist");
        return credentials[tokenId];
    }

    /**
     * @dev Get all credentials for a recipient
     * @param recipient Address of the recipient
     * @return uint256[] Array of token IDs
     */
    function getRecipientCredentials(address recipient)
        external
        view
        returns (uint256[] memory)
    {
        return recipientCredentials[recipient];
    }

    /**
     * @dev Get all credentials issued by an issuer
     * @param issuer Address of the issuer
     * @return uint256[] Array of token IDs
     */
    function getIssuerCredentials(address issuer)
        external
        view
        returns (uint256[] memory)
    {
        return issuerCredentials[issuer];
    }

    /**
     * @dev Get total supply of credentials
     * @return uint256 Total number of credentials issued
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter.current();
    }

    /**
     * @dev Verify credential authenticity and validity
     * @param tokenId ID of the credential to verify
     * @return isValid True if credential is valid
     * @return issuerName Name of the issuing organization
     * @return credentialData Basic credential information
     */
    function verifyCredential(uint256 tokenId)
        external
        view
        returns (
            bool isValid,
            string memory issuerName,
            CredentialMetadata memory credentialData
        )
    {
        if (!_exists(tokenId)) {
            return (false, "", CredentialMetadata("", "", "", address(0), address(0), 0, 0, "", false, 0, ""));
        }

        credentialData = credentials[tokenId];
        isValid = isCredentialValid(tokenId);

        // Get issuer name
        try issuerRegistry.getIssuer(credentialData.issuerAddress) returns (
            IssuerRegistry.IssuerInfo memory issuerInfo
        ) {
            issuerName = issuerInfo.name;
        } catch {
            issuerName = "Unknown Issuer";
        }

        return (isValid, issuerName, credentialData);
    }

    /**
     * @dev Override required by Solidity for multiple inheritance
     */
    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
    }

    /**
     * @dev Override required by Solidity for multiple inheritance
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    /**
     * @dev Override required by Solidity for multiple inheritance
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Override to prevent token transfers (soulbound)
     * Credentials should be non-transferable
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
        
        // Allow minting (from == address(0)) but prevent transfers
        require(
            from == address(0) || hasRole(ADMIN_ROLE, msg.sender),
            "Credentials are non-transferable"
        );
    }

    /**
     * @dev Pause the contract
     */
    function pause() external onlyAdmin {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyAdmin {
        _unpause();
    }
}
