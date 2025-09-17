const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CredentialNFT", function () {
  let issuerRegistry, credentialNFT;
  let admin, issuer1, issuer2, student1, student2, verifier;

  beforeEach(async function () {
    [admin, issuer1, issuer2, student1, student2, verifier] = await ethers.getSigners();
    
    // Deploy IssuerRegistry
    const IssuerRegistry = await ethers.getContractFactory("IssuerRegistry");
    issuerRegistry = await IssuerRegistry.deploy(admin.address);
    await issuerRegistry.waitForDeployment();

    // Deploy CredentialNFT
    const CredentialNFT = await ethers.getContractFactory("CredentialNFT");
    credentialNFT = await CredentialNFT.deploy(
      "AVCP Credentials",
      "AVCP",
      await issuerRegistry.getAddress(),
      admin.address
    );
    await credentialNFT.waitForDeployment();

    // Register issuer1 as an approved issuer
    await issuerRegistry.connect(admin).registerIssuer(
      issuer1.address,
      "Test University",
      "A test university",
      "https://test.edu",
      "https://test.edu/logo.png"
    );
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await credentialNFT.name()).to.equal("AVCP Credentials");
      expect(await credentialNFT.symbol()).to.equal("AVCP");
    });

    it("Should set the correct admin", async function () {
      expect(await credentialNFT.hasRole(await credentialNFT.ADMIN_ROLE(), admin.address)).to.be.true;
    });

    it("Should reference the correct issuer registry", async function () {
      expect(await credentialNFT.issuerRegistry()).to.equal(await issuerRegistry.getAddress());
    });

    it("Should start with zero total supply", async function () {
      expect(await credentialNFT.totalSupply()).to.equal(0);
    });
  });

  describe("Credential Issuance", function () {
    const credentialData = {
      credentialType: "Bachelor Degree",
      subject: "Computer Science",
      recipientName: "John Doe",
      validUntil: 0, // Permanent credential
      additionalData: JSON.stringify({
        gpa: "3.8",
        graduationDate: "2024-05-15",
        honors: "Magna Cum Laude"
      }),
      tokenURI: "https://ipfs.io/ipfs/QmTest123"
    };

    it("Should allow approved issuer to mint credential", async function () {
      await expect(
        credentialNFT.connect(issuer1).issueCredential(
          student1.address,
          credentialData.credentialType,
          credentialData.subject,
          credentialData.recipientName,
          credentialData.validUntil,
          credentialData.additionalData,
          credentialData.tokenURI
        )
      ).to.emit(credentialNFT, "CredentialIssued")
        .withArgs(0, student1.address, issuer1.address, credentialData.credentialType, await getBlockTimestamp());

      expect(await credentialNFT.totalSupply()).to.equal(1);
      expect(await credentialNFT.ownerOf(0)).to.equal(student1.address);
    });

    it("Should not allow non-approved issuer to mint credential", async function () {
      await expect(
        credentialNFT.connect(issuer2).issueCredential(
          student1.address,
          credentialData.credentialType,
          credentialData.subject,
          credentialData.recipientName,
          credentialData.validUntil,
          credentialData.additionalData,
          credentialData.tokenURI
        )
      ).to.be.revertedWith("Caller is not an active issuer");
    });

    it("Should not allow issuing credential with empty required fields", async function () {
      await expect(
        credentialNFT.connect(issuer1).issueCredential(
          student1.address,
          "", // Empty credential type
          credentialData.subject,
          credentialData.recipientName,
          credentialData.validUntil,
          credentialData.additionalData,
          credentialData.tokenURI
        )
      ).to.be.revertedWith("Credential type required");

      await expect(
        credentialNFT.connect(issuer1).issueCredential(
          student1.address,
          credentialData.credentialType,
          "", // Empty subject
          credentialData.recipientName,
          credentialData.validUntil,
          credentialData.additionalData,
          credentialData.tokenURI
        )
      ).to.be.revertedWith("Subject required");

      await expect(
        credentialNFT.connect(issuer1).issueCredential(
          student1.address,
          credentialData.credentialType,
          credentialData.subject,
          "", // Empty recipient name
          credentialData.validUntil,
          credentialData.additionalData,
          credentialData.tokenURI
        )
      ).to.be.revertedWith("Recipient name required");
    });

    it("Should not allow issuing credential with invalid expiration", async function () {
      const pastDate = Math.floor(Date.now() / 1000) - 86400; // Yesterday
      
      await expect(
        credentialNFT.connect(issuer1).issueCredential(
          student1.address,
          credentialData.credentialType,
          credentialData.subject,
          credentialData.recipientName,
          pastDate,
          credentialData.additionalData,
          credentialData.tokenURI
        )
      ).to.be.revertedWith("Invalid expiration date");
    });

    it("Should store correct credential metadata", async function () {
      await credentialNFT.connect(issuer1).issueCredential(
        student1.address,
        credentialData.credentialType,
        credentialData.subject,
        credentialData.recipientName,
        credentialData.validUntil,
        credentialData.additionalData,
        credentialData.tokenURI
      );

      const credential = await credentialNFT.getCredential(0);
      expect(credential.credentialType).to.equal(credentialData.credentialType);
      expect(credential.subject).to.equal(credentialData.subject);
      expect(credential.recipientName).to.equal(credentialData.recipientName);
      expect(credential.recipientAddress).to.equal(student1.address);
      expect(credential.issuerAddress).to.equal(issuer1.address);
      expect(credential.validUntil).to.equal(credentialData.validUntil);
      expect(credential.additionalData).to.equal(credentialData.additionalData);
      expect(credential.isRevoked).to.be.false;
    });
  });

  describe("Credential Management", function () {
    let tokenId;

    beforeEach(async function () {
      const tx = await credentialNFT.connect(issuer1).issueCredential(
        student1.address,
        "Bachelor Degree",
        "Computer Science",
        "John Doe",
        0,
        JSON.stringify({ gpa: "3.8" }),
        "https://ipfs.io/ipfs/QmTest123"
      );
      const receipt = await tx.wait();
      tokenId = 0; // First token ID
    });

    it("Should allow issuer to revoke their credential", async function () {
      const reason = "Academic misconduct";
      
      await expect(
        credentialNFT.connect(issuer1).revokeCredential(tokenId, reason)
      ).to.emit(credentialNFT, "CredentialRevoked")
        .withArgs(tokenId, issuer1.address, reason, await getBlockTimestamp());

      const credential = await credentialNFT.getCredential(tokenId);
      expect(credential.isRevoked).to.be.true;
      expect(credential.revocationReason).to.equal(reason);
    });

    it("Should not allow non-issuer to revoke credential", async function () {
      await expect(
        credentialNFT.connect(issuer2).revokeCredential(tokenId, "Invalid reason")
      ).to.be.revertedWith("Only the issuer can perform this action");
    });

    it("Should not allow revoking already revoked credential", async function () {
      await credentialNFT.connect(issuer1).revokeCredential(tokenId, "First revocation");
      
      await expect(
        credentialNFT.connect(issuer1).revokeCredential(tokenId, "Second revocation")
      ).to.be.revertedWith("Credential already revoked");
    });

    it("Should require revocation reason", async function () {
      await expect(
        credentialNFT.connect(issuer1).revokeCredential(tokenId, "")
      ).to.be.revertedWith("Revocation reason required");
    });
  });

  describe("Credential Verification", function () {
    let validTokenId, expiredTokenId, revokedTokenId;

    beforeEach(async function () {
      // Issue valid credential
      await credentialNFT.connect(issuer1).issueCredential(
        student1.address,
        "Bachelor Degree",
        "Computer Science",
        "John Doe",
        0, // Permanent
        "{}",
        "https://ipfs.io/ipfs/QmTest1"
      );
      validTokenId = 0;

      // Issue expired credential
      const futureDate = Math.floor(Date.now() / 1000) + 86400; // Tomorrow
      await credentialNFT.connect(issuer1).issueCredential(
        student1.address,
        "Certificate",
        "Web Development",
        "John Doe",
        futureDate,
        "{}",
        "https://ipfs.io/ipfs/QmTest2"
      );
      expiredTokenId = 1;

      // Issue and revoke credential
      await credentialNFT.connect(issuer1).issueCredential(
        student1.address,
        "Diploma",
        "Mathematics",
        "John Doe",
        0,
        "{}",
        "https://ipfs.io/ipfs/QmTest3"
      );
      revokedTokenId = 2;
      await credentialNFT.connect(issuer1).revokeCredential(revokedTokenId, "Test revocation");
    });

    it("Should correctly validate valid credential", async function () {
      expect(await credentialNFT.isCredentialValid(validTokenId)).to.be.true;
      
      const [isValid, issuerName, credentialData] = await credentialNFT.verifyCredential(validTokenId);
      expect(isValid).to.be.true;
      expect(issuerName).to.equal("Test University");
      expect(credentialData.credentialType).to.equal("Bachelor Degree");
    });

    it("Should correctly invalidate revoked credential", async function () {
      expect(await credentialNFT.isCredentialValid(revokedTokenId)).to.be.false;
      
      const [isValid, issuerName, credentialData] = await credentialNFT.verifyCredential(revokedTokenId);
      expect(isValid).to.be.false;
      expect(credentialData.isRevoked).to.be.true;
    });

    it("Should return false for non-existent credential", async function () {
      expect(await credentialNFT.isCredentialValid(999)).to.be.false;
      
      const [isValid, issuerName, credentialData] = await credentialNFT.verifyCredential(999);
      expect(isValid).to.be.false;
    });
  });

  describe("Query Functions", function () {
    beforeEach(async function () {
      // Issue credentials for student1
      await credentialNFT.connect(issuer1).issueCredential(
        student1.address,
        "Bachelor Degree",
        "Computer Science",
        "John Doe",
        0,
        "{}",
        "https://ipfs.io/ipfs/QmTest1"
      );

      await credentialNFT.connect(issuer1).issueCredential(
        student1.address,
        "Certificate",
        "Web Development",
        "John Doe",
        0,
        "{}",
        "https://ipfs.io/ipfs/QmTest2"
      );

      // Issue credential for student2
      await credentialNFT.connect(issuer1).issueCredential(
        student2.address,
        "Master Degree",
        "Data Science",
        "Jane Smith",
        0,
        "{}",
        "https://ipfs.io/ipfs/QmTest3"
      );
    });

    it("Should return correct credentials for recipient", async function () {
      const student1Creds = await credentialNFT.getRecipientCredentials(student1.address);
      expect(student1Creds.length).to.equal(2);
      expect(student1Creds[0]).to.equal(0);
      expect(student1Creds[1]).to.equal(1);

      const student2Creds = await credentialNFT.getRecipientCredentials(student2.address);
      expect(student2Creds.length).to.equal(1);
      expect(student2Creds[0]).to.equal(2);
    });

    it("Should return correct credentials for issuer", async function () {
      const issuer1Creds = await credentialNFT.getIssuerCredentials(issuer1.address);
      expect(issuer1Creds.length).to.equal(3);
      expect(issuer1Creds[0]).to.equal(0);
      expect(issuer1Creds[1]).to.equal(1);
      expect(issuer1Creds[2]).to.equal(2);
    });
  });

  describe("Non-Transferable (Soulbound) Tokens", function () {
    let tokenId;

    beforeEach(async function () {
      await credentialNFT.connect(issuer1).issueCredential(
        student1.address,
        "Bachelor Degree",
        "Computer Science",
        "John Doe",
        0,
        "{}",
        "https://ipfs.io/ipfs/QmTest1"
      );
      tokenId = 0;
    });

    it("Should prevent token transfers", async function () {
      await expect(
        credentialNFT.connect(student1).transferFrom(
          student1.address,
          student2.address,
          tokenId
        )
      ).to.be.revertedWith("Credentials are non-transferable");
    });

    it("Should prevent approval for transfers", async function () {
      await expect(
        credentialNFT.connect(student1).approve(student2.address, tokenId)
      ).to.be.revertedWith("Credentials are non-transferable");
    });
  });

  async function getBlockTimestamp() {
    const latestBlock = await ethers.provider.getBlock("latest");
    return latestBlock.timestamp + 1; // Next block timestamp
  }
});
