// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AgroTraceability is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    struct Escrow {
        address buyer;
        address seller;
        uint256 amount;
        bool isFunded;
        bool isDelivered;
        bool sellerRatedBuyer; // <-- NEW: Prevents review spamming
    }

    struct UserRating {
        uint256 totalScore;
        uint256 reviewCount;
    }

    mapping(uint256 => Escrow) public escrows;
    mapping(address => UserRating) public ratings;

    event ProduceMinted(uint256 indexed tokenId, address indexed farmer, string ipfsUri);
    event EscrowFunded(uint256 indexed tokenId, address indexed buyer, uint256 amount);
    event ProduceDelivered(uint256 indexed tokenId);
    event FundsReleased(uint256 indexed tokenId, address indexed seller, uint256 amount);
    event BuyerRated(uint256 indexed tokenId, address indexed buyer, uint8 rating); // <-- NEW

    constructor() ERC721("AgroProduce", "AGRP") Ownable(msg.sender) {}

    function mintProduce(string memory uri) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _mint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);
        emit ProduceMinted(tokenId, msg.sender, uri);
        return tokenId;
    }

    function fundEscrow(uint256 tokenId) public payable {
        require(ownerOf(tokenId) != msg.sender, "You cannot buy your own produce");
        require(!escrows[tokenId].isFunded, "Escrow already funded");
        
        escrows[tokenId] = Escrow({
            buyer: msg.sender,
            seller: ownerOf(tokenId),
            amount: msg.value,
            isFunded: true,
            isDelivered: false,
            sellerRatedBuyer: false // <-- NEW: Initialize as false
        });

        emit EscrowFunded(tokenId, msg.sender, msg.value);
    }

    // Buyer rates the Seller when confirming delivery
    function confirmDeliveryAndReleaseFunds(uint256 tokenId, uint8 ratingForSeller) public {
        Escrow storage escrow = escrows[tokenId];
        require(msg.sender == escrow.buyer, "Only buyer can confirm delivery");
        require(escrow.isFunded, "Escrow not funded");
        require(ratingForSeller > 0 && ratingForSeller <= 5, "Rating must be 1-5");

        escrow.isDelivered = true;
        
        payable(escrow.seller).transfer(escrow.amount);
        _transfer(escrow.seller, escrow.buyer, tokenId);

        ratings[escrow.seller].totalScore += ratingForSeller;
        ratings[escrow.seller].reviewCount++;

        emit ProduceDelivered(tokenId);
        emit FundsReleased(tokenId, escrow.seller, escrow.amount);
    }

    // <-- NEW: Farmer rates the Buyer after the transaction is complete
    function rateBuyer(uint256 tokenId, uint8 ratingForBuyer) public {
        Escrow storage escrow = escrows[tokenId];
        
        require(msg.sender == escrow.seller, "Only the seller can rate the buyer");
        require(escrow.isDelivered, "Cannot rate until delivery is confirmed");
        require(!escrow.sellerRatedBuyer, "You have already rated the buyer for this order");
        require(ratingForBuyer > 0 && ratingForBuyer <= 5, "Rating must be 1-5");

        escrow.sellerRatedBuyer = true;
        
        ratings[escrow.buyer].totalScore += ratingForBuyer;
        ratings[escrow.buyer].reviewCount++;

        emit BuyerRated(tokenId, escrow.buyer, ratingForBuyer);
    }

    // <-- UPDATED: Now returns both Average AND Total Reviews so the UI can show "4 Stars (12 Reviews)"
    function getAverageRating(address user) public view returns (uint256, uint256) {
        if (ratings[user].reviewCount == 0) return (0, 0);
        return (ratings[user].totalScore / ratings[user].reviewCount, ratings[user].reviewCount);
    }
}