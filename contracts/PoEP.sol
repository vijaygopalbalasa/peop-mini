// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./PoEPVerifier.sol";


contract PoEP is ERC721Enumerable, Ownable, ReentrancyGuard, Pausable {
    using Strings for uint256;
    
    // State variables
    mapping(uint256 => bool) public nullifiers;           // Prevent double-minting
    mapping(uint256 => uint256) public trustScore;        // tokenId => score
    mapping(address => bool) public scoreUpdaters;        // Authorized score updaters
    mapping(address => uint256) public queryFees;         // Fee tracking
    
    // Configuration
    uint256 public constant QUERY_FEE = 100000; // 0.1 USDC (6 decimals)
    uint256 public constant MAX_SCORE = 1000;
    string private _baseTokenURI;
    
    // ZK Verifier
    PoEPVerifier public immutable zkVerifier;
    
    // Events
    event PassportMinted(address indexed user, uint256 indexed tokenId, uint256 nullifier);
    event ScoreUpdated(address indexed user, uint256 oldScore, uint256 newScore);
    event QueryFeePaid(address indexed app, address indexed user, uint256 fee);
    
    constructor(
        string memory baseURI,
        address verifierAddress
    ) ERC721("ProofOfExistencePassport", "PoEP") Ownable(msg.sender) {
        _baseTokenURI = baseURI;
        zkVerifier = PoEPVerifier(verifierAddress);
        scoreUpdaters[msg.sender] = true;
    }
    
    /**
     * @dev Mint passport with ZK proof of biometric uniqueness
     * @param _pA ZK proof point A
     * @param _pB ZK proof point B  
     * @param _pC ZK proof point C
     * @param _nullifier Unique nullifier from biometric hash
     */
    function mint(
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC,
        uint256 _nullifier
    ) external nonReentrant whenNotPaused {
        require(!nullifiers[_nullifier], "PoEP: Nullifier already used");
        
        // Verify ZK proof
        uint[1] memory publicSignals = [_nullifier];
        require(
            zkVerifier.verifyProof(_pA, _pB, _pC, publicSignals),
            "PoEP: Invalid ZK proof"
        );
        
        uint256 tokenId = uint256(uint160(msg.sender));
        require(_ownerOf(tokenId) == address(0), "PoEP: Already minted for this address");
        
        // Mark nullifier as used
        nullifiers[_nullifier] = true;
        
        // Mint passport NFT
        _mint(msg.sender, tokenId);
        trustScore[tokenId] = 1; // Genesis score
        
        emit PassportMinted(msg.sender, tokenId, _nullifier);
    }
    
    /**
     * @dev Update trust score (called by authorized indexer)
     * @param user Address to update score for
     * @param delta Score change (can be positive or negative)
     */
    function updateScore(address user, int256 delta) external {
        require(scoreUpdaters[msg.sender], "PoEP: Not authorized to update scores");
        
        uint256 tokenId = uint256(uint160(user));
        require(_ownerOf(tokenId) != address(0), "PoEP: Passport does not exist");
        
        uint256 oldScore = trustScore[tokenId];
        uint256 newScore;
        
        if (delta >= 0) {
            newScore = oldScore + uint256(delta);
            if (newScore > MAX_SCORE) newScore = MAX_SCORE;
        } else {
            uint256 decrease = uint256(-delta);
            if (decrease >= oldScore) {
                newScore = 1; // Minimum score
            } else {
                newScore = oldScore - decrease;
            }
        }
        
        trustScore[tokenId] = newScore;
        emit ScoreUpdated(user, oldScore, newScore);
    }
    
    /**
     * @dev Query trust score (with optional fee for apps)
     * @param user Address to query score for
     * @return score Current trust score
     */
    function getTrustScore(address user) external payable returns (uint256 score) {
        uint256 tokenId = uint256(uint160(user));
        
        if (_ownerOf(tokenId) == address(0)) {
            return 0;
        }
        
        // Charge fee for non-owner queries
        if (msg.sender != owner() && msg.value > 0) {
            require(msg.value >= QUERY_FEE, "PoEP: Insufficient query fee");
            queryFees[msg.sender] += msg.value;
            emit QueryFeePaid(msg.sender, user, msg.value);
        }
        
        return trustScore[tokenId];
    }
    
    /**
     * @dev Get trust score for free (view function)
     * @param user Address to query
     * @return score Trust score (0 if no passport)
     */
    function viewTrustScore(address user) external view returns (uint256 score) {
        uint256 tokenId = uint256(uint160(user));
        return _ownerOf(tokenId) != address(0) ? trustScore[tokenId] : 0;
    }
    
    /**
     * @dev Dynamic token URI with current score
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "PoEP: URI query for nonexistent token");
        
        string memory baseURI = _baseTokenURI;
        uint256 score = trustScore[tokenId];
        
        return string(abi.encodePacked(
            baseURI,
            tokenId.toString(),
            "?score=",
            score.toString()
        ));
    }
    
    /**
     * @dev Soul-bound: disable transfers
     */
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        
        // Allow minting (from == address(0)) and burning (to == address(0))
        // Block all other transfers
        require(
            from == address(0) || to == address(0),
            "PoEP: Soul-bound tokens cannot be transferred"
        );
        
        return super._update(to, tokenId, auth);
    }
    
    // Admin functions
    function setScoreUpdater(address updater, bool authorized) external onlyOwner {
        scoreUpdaters[updater] = authorized;
    }
    
    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "PoEP: No fees to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "PoEP: Fee withdrawal failed");
    }
    
    // Emergency burn function
    function burn(uint256 tokenId) external {
        require(
            ownerOf(tokenId) == msg.sender,
            "PoEP: Only token owner can burn"
        );
        _burn(tokenId);
    }
}