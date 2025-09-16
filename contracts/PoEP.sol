// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./PoEPVerifier.sol";

/**
 * @title PoEP - Proof-of-Existence Passport
 * @dev A soul-bound NFT that proves unique human identity using ZK-SNARKs
 * @notice Each wallet can only mint one PoEP NFT, and it's non-transferable
 */
contract PoEP is ERC721, Ownable, ReentrancyGuard {
    // Verifier contract for ZK proofs
    PoEPVerifier public immutable verifier;

    // Counter for token IDs
    uint256 private _tokenIds;

    // Mapping from nullifier to whether it's been used
    mapping(uint256 => bool) public nullifiersUsed;

    // Mapping from address to trust score
    mapping(address => uint256) public trustScores;

    // Mapping to track if an address has minted
    mapping(address => bool) public hasMinted;

    // Base URI for metadata
    string private _baseTokenURI;

    // Events
    event PassportMinted(address indexed user, uint256 indexed tokenId, uint256 nullifier);
    event ScoreUpdated(address indexed user, uint256 oldScore, uint256 newScore);

    // Errors
    error AlreadyMinted();
    error InvalidProof();
    error NullifierAlreadyUsed();
    error TokenNonTransferable();

    /**
     * @dev Constructor
     * @param _verifier Address of the ZK verifier contract
     * @param _baseURI Base URI for token metadata
     */
    constructor(
        address _verifier,
        string memory _baseURI
    ) ERC721("Proof-of-Existence Passport", "POEP") Ownable(msg.sender) {
        verifier = PoEPVerifier(_verifier);
        _baseTokenURI = _baseURI;
    }

    /**
     * @dev Mint a PoEP NFT using ZK proof
     * @param _pA ZK-SNARK proof component A
     * @param _pB ZK-SNARK proof component B
     * @param _pC ZK-SNARK proof component C
     * @param nullifier Public nullifier from the proof
     */
    function mint(
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC,
        uint256 nullifier
    ) external nonReentrant {
        // Check if address has already minted
        if (hasMinted[msg.sender]) {
            revert AlreadyMinted();
        }

        // Check if nullifier has been used
        if (nullifiersUsed[nullifier]) {
            revert NullifierAlreadyUsed();
        }

        // Verify the ZK proof
        uint256[] memory publicSignals = new uint256[](1);
        publicSignals[0] = nullifier;

        bool proofValid = verifier.verifyProof(_pA, _pB, _pC, publicSignals);
        if (!proofValid) {
            revert InvalidProof();
        }

        // Mark nullifier as used
        nullifiersUsed[nullifier] = true;

        // Mark address as having minted
        hasMinted[msg.sender] = true;

        // Increment token ID and mint
        _tokenIds++;
        uint256 tokenId = _tokenIds;

        _safeMint(msg.sender, tokenId);

        // Initialize trust score
        trustScores[msg.sender] = 1;

        emit PassportMinted(msg.sender, tokenId, nullifier);
        emit ScoreUpdated(msg.sender, 0, 1);
    }

    /**
     * @dev Update trust score for a user (only owner)
     * @param user Address to update score for
     * @param increment Amount to increase score by
     */
    function addScore(address user, uint256 increment) external onlyOwner {
        if (!hasMinted[user]) return; // Only update scores for passport holders

        uint256 oldScore = trustScores[user];
        uint256 newScore = oldScore + increment;
        trustScores[user] = newScore;

        emit ScoreUpdated(user, oldScore, newScore);
    }

    /**
     * @dev Check if an address has a PoEP passport
     * @param user Address to check
     * @return true if user has minted a passport
     */
    function hasPassport(address user) external view returns (bool) {
        return hasMinted[user];
    }

    /**
     * @dev Get trust score for a user
     * @param user Address to check
     * @return score Current trust score
     */
    function viewTrustScore(address user) external view returns (uint256 score) {
        return trustScores[user];
    }

    /**
     * @dev Override token URI to include dynamic trust score
     * @param tokenId Token ID to get URI for
     * @return URI for the token metadata
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);

        address owner = ownerOf(tokenId);
        uint256 score = trustScores[owner];

        // Return dynamic metadata with trust score
        return string(abi.encodePacked(_baseTokenURI, "?score=", _toString(score)));
    }

    /**
     * @dev Set base URI (only owner)
     * @param baseURI New base URI
     */
    function setBaseURI(string calldata baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }

    /**
     * @dev Override transfer functions to make tokens soul-bound
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);

        // Allow minting (from == address(0)) but prevent transfers
        if (from != address(0) && to != address(0)) {
            revert TokenNonTransferable();
        }

        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Disable approval functions since tokens are non-transferable
     */
    function approve(address, uint256) public virtual override {
        revert TokenNonTransferable();
    }

    function setApprovalForAll(address, bool) public virtual override {
        revert TokenNonTransferable();
    }

    /**
     * @dev Helper function to convert uint to string
     */
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}