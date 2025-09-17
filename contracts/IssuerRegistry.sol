// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title IssuerRegistry
 * @dev Manages the registry of approved credential issuers
 * Only approved issuers can mint credential NFTs
 */
contract IssuerRegistry is AccessControl, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");

    struct IssuerInfo {
        string name;
        string description;
        string website;
        string logoUrl;
        bool isActive;
        uint256 registeredAt;
        uint256 credentialsIssued;
    }

    mapping(address => IssuerInfo) public issuers;
    mapping(string => address) public issuersByName;
    address[] public issuerAddresses;

    event IssuerRegistered(
        address indexed issuerAddress,
        string name,
        uint256 timestamp
    );

    event IssuerDeactivated(
        address indexed issuerAddress,
        string name,
        uint256 timestamp
    );

    event IssuerActivated(
        address indexed issuerAddress,
        string name,
        uint256 timestamp
    );

    event IssuerUpdated(
        address indexed issuerAddress,
        string name,
        uint256 timestamp
    );

    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender), "Caller is not an admin");
        _;
    }

    modifier onlyActiveIssuer() {
        require(
            hasRole(ISSUER_ROLE, msg.sender) && issuers[msg.sender].isActive,
            "Caller is not an active issuer"
        );
        _;
    }

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
    }

    /**
     * @dev Register a new issuer
     * @param issuerAddress Address of the issuer
     * @param name Name of the issuing organization
     * @param description Description of the organization
     * @param website Official website URL
     * @param logoUrl Logo image URL
     */
    function registerIssuer(
        address issuerAddress,
        string memory name,
        string memory description,
        string memory website,
        string memory logoUrl
    ) external onlyAdmin whenNotPaused {
        require(issuerAddress != address(0), "Invalid issuer address");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(!isIssuer(issuerAddress), "Issuer already registered");
        require(issuersByName[name] == address(0), "Name already taken");

        issuers[issuerAddress] = IssuerInfo({
            name: name,
            description: description,
            website: website,
            logoUrl: logoUrl,
            isActive: true,
            registeredAt: block.timestamp,
            credentialsIssued: 0
        });

        issuersByName[name] = issuerAddress;
        issuerAddresses.push(issuerAddress);

        _grantRole(ISSUER_ROLE, issuerAddress);

        emit IssuerRegistered(issuerAddress, name, block.timestamp);
    }

    /**
     * @dev Update issuer information
     * @param issuerAddress Address of the issuer
     * @param description New description
     * @param website New website URL
     * @param logoUrl New logo URL
     */
    function updateIssuer(
        address issuerAddress,
        string memory description,
        string memory website,
        string memory logoUrl
    ) external onlyAdmin whenNotPaused {
        require(isIssuer(issuerAddress), "Issuer not found");

        IssuerInfo storage issuer = issuers[issuerAddress];
        issuer.description = description;
        issuer.website = website;
        issuer.logoUrl = logoUrl;

        emit IssuerUpdated(issuerAddress, issuer.name, block.timestamp);
    }

    /**
     * @dev Deactivate an issuer
     * @param issuerAddress Address of the issuer to deactivate
     */
    function deactivateIssuer(address issuerAddress) external onlyAdmin {
        require(isIssuer(issuerAddress), "Issuer not found");
        
        issuers[issuerAddress].isActive = false;
        _revokeRole(ISSUER_ROLE, issuerAddress);

        emit IssuerDeactivated(
            issuerAddress,
            issuers[issuerAddress].name,
            block.timestamp
        );
    }

    /**
     * @dev Reactivate an issuer
     * @param issuerAddress Address of the issuer to reactivate
     */
    function activateIssuer(address issuerAddress) external onlyAdmin {
        require(isIssuer(issuerAddress), "Issuer not found");
        
        issuers[issuerAddress].isActive = true;
        _grantRole(ISSUER_ROLE, issuerAddress);

        emit IssuerActivated(
            issuerAddress,
            issuers[issuerAddress].name,
            block.timestamp
        );
    }

    /**
     * @dev Increment credential count for an issuer
     * @param issuerAddress Address of the issuer
     */
    function incrementCredentialCount(address issuerAddress) external {
        require(
            msg.sender == address(this) || hasRole(ADMIN_ROLE, msg.sender),
            "Unauthorized"
        );
        require(isIssuer(issuerAddress), "Issuer not found");
        
        issuers[issuerAddress].credentialsIssued++;
    }

    /**
     * @dev Check if an address is a registered issuer
     * @param issuerAddress Address to check
     * @return bool True if address is a registered issuer
     */
    function isIssuer(address issuerAddress) public view returns (bool) {
        return bytes(issuers[issuerAddress].name).length > 0;
    }

    /**
     * @dev Check if an address is an active issuer
     * @param issuerAddress Address to check
     * @return bool True if address is an active issuer
     */
    function isActiveIssuer(address issuerAddress) public view returns (bool) {
        return isIssuer(issuerAddress) && issuers[issuerAddress].isActive;
    }

    /**
     * @dev Get issuer information
     * @param issuerAddress Address of the issuer
     * @return IssuerInfo Issuer information struct
     */
    function getIssuer(address issuerAddress)
        external
        view
        returns (IssuerInfo memory)
    {
        require(isIssuer(issuerAddress), "Issuer not found");
        return issuers[issuerAddress];
    }

    /**
     * @dev Get issuer address by name
     * @param name Name of the issuer
     * @return address Address of the issuer
     */
    function getIssuerByName(string memory name)
        external
        view
        returns (address)
    {
        return issuersByName[name];
    }

    /**
     * @dev Get all issuer addresses
     * @return address[] Array of all issuer addresses
     */
    function getAllIssuers() external view returns (address[] memory) {
        return issuerAddresses;
    }

    /**
     * @dev Get total number of issuers
     * @return uint256 Total number of registered issuers
     */
    function getTotalIssuers() external view returns (uint256) {
        return issuerAddresses.length;
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
