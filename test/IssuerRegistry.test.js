const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("IssuerRegistry", function () {
  let issuerRegistry;
  let admin, issuer1, issuer2, user;

  beforeEach(async function () {
    [admin, issuer1, issuer2, user] = await ethers.getSigners();
    
    const IssuerRegistry = await ethers.getContractFactory("IssuerRegistry");
    issuerRegistry = await IssuerRegistry.deploy(admin.address);
    await issuerRegistry.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right admin", async function () {
      expect(await issuerRegistry.hasRole(await issuerRegistry.ADMIN_ROLE(), admin.address)).to.be.true;
    });

    it("Should start with no issuers", async function () {
      expect(await issuerRegistry.getTotalIssuers()).to.equal(0);
    });
  });

  describe("Issuer Registration", function () {
    const issuerData = {
      name: "Test University",
      description: "A test university for credentials",
      website: "https://test-university.edu",
      logoUrl: "https://test-university.edu/logo.png"
    };

    it("Should allow admin to register an issuer", async function () {
      await expect(
        issuerRegistry.connect(admin).registerIssuer(
          issuer1.address,
          issuerData.name,
          issuerData.description,
          issuerData.website,
          issuerData.logoUrl
        )
      ).to.emit(issuerRegistry, "IssuerRegistered")
        .withArgs(issuer1.address, issuerData.name, await getBlockTimestamp());

      expect(await issuerRegistry.isIssuer(issuer1.address)).to.be.true;
      expect(await issuerRegistry.isActiveIssuer(issuer1.address)).to.be.true;
      expect(await issuerRegistry.getTotalIssuers()).to.equal(1);
    });

    it("Should not allow non-admin to register an issuer", async function () {
      await expect(
        issuerRegistry.connect(user).registerIssuer(
          issuer1.address,
          issuerData.name,
          issuerData.description,
          issuerData.website,
          issuerData.logoUrl
        )
      ).to.be.revertedWith("Caller is not an admin");
    });

    it("Should not allow duplicate issuer addresses", async function () {
      await issuerRegistry.connect(admin).registerIssuer(
        issuer1.address,
        issuerData.name,
        issuerData.description,
        issuerData.website,
        issuerData.logoUrl
      );

      await expect(
        issuerRegistry.connect(admin).registerIssuer(
          issuer1.address,
          "Different Name",
          issuerData.description,
          issuerData.website,
          issuerData.logoUrl
        )
      ).to.be.revertedWith("Issuer already registered");
    });

    it("Should not allow duplicate issuer names", async function () {
      await issuerRegistry.connect(admin).registerIssuer(
        issuer1.address,
        issuerData.name,
        issuerData.description,
        issuerData.website,
        issuerData.logoUrl
      );

      await expect(
        issuerRegistry.connect(admin).registerIssuer(
          issuer2.address,
          issuerData.name, // Same name
          issuerData.description,
          issuerData.website,
          issuerData.logoUrl
        )
      ).to.be.revertedWith("Name already taken");
    });
  });

  describe("Issuer Management", function () {
    const issuerData = {
      name: "Test University",
      description: "A test university for credentials",
      website: "https://test-university.edu",
      logoUrl: "https://test-university.edu/logo.png"
    };

    beforeEach(async function () {
      await issuerRegistry.connect(admin).registerIssuer(
        issuer1.address,
        issuerData.name,
        issuerData.description,
        issuerData.website,
        issuerData.logoUrl
      );
    });

    it("Should allow admin to deactivate an issuer", async function () {
      await expect(
        issuerRegistry.connect(admin).deactivateIssuer(issuer1.address)
      ).to.emit(issuerRegistry, "IssuerDeactivated")
        .withArgs(issuer1.address, issuerData.name, await getBlockTimestamp());

      expect(await issuerRegistry.isActiveIssuer(issuer1.address)).to.be.false;
      expect(await issuerRegistry.isIssuer(issuer1.address)).to.be.true; // Still registered
    });

    it("Should allow admin to reactivate an issuer", async function () {
      await issuerRegistry.connect(admin).deactivateIssuer(issuer1.address);
      
      await expect(
        issuerRegistry.connect(admin).activateIssuer(issuer1.address)
      ).to.emit(issuerRegistry, "IssuerActivated")
        .withArgs(issuer1.address, issuerData.name, await getBlockTimestamp());

      expect(await issuerRegistry.isActiveIssuer(issuer1.address)).to.be.true;
    });

    it("Should allow admin to update issuer information", async function () {
      const newData = {
        description: "Updated description",
        website: "https://new-website.edu",
        logoUrl: "https://new-website.edu/logo.png"
      };

      await expect(
        issuerRegistry.connect(admin).updateIssuer(
          issuer1.address,
          newData.description,
          newData.website,
          newData.logoUrl
        )
      ).to.emit(issuerRegistry, "IssuerUpdated")
        .withArgs(issuer1.address, issuerData.name, await getBlockTimestamp());

      const issuerInfo = await issuerRegistry.getIssuer(issuer1.address);
      expect(issuerInfo.description).to.equal(newData.description);
      expect(issuerInfo.website).to.equal(newData.website);
      expect(issuerInfo.logoUrl).to.equal(newData.logoUrl);
    });
  });

  describe("Query Functions", function () {
    const issuers = [
      {
        address: null, // Will be set to issuer1.address
        name: "University A",
        description: "First university",
        website: "https://university-a.edu",
        logoUrl: "https://university-a.edu/logo.png"
      },
      {
        address: null, // Will be set to issuer2.address
        name: "University B",
        description: "Second university",
        website: "https://university-b.edu",
        logoUrl: "https://university-b.edu/logo.png"
      }
    ];

    beforeEach(async function () {
      issuers[0].address = issuer1.address;
      issuers[1].address = issuer2.address;

      for (const issuer of issuers) {
        await issuerRegistry.connect(admin).registerIssuer(
          issuer.address,
          issuer.name,
          issuer.description,
          issuer.website,
          issuer.logoUrl
        );
      }
    });

    it("Should return correct issuer information", async function () {
      const issuerInfo = await issuerRegistry.getIssuer(issuer1.address);
      expect(issuerInfo.name).to.equal(issuers[0].name);
      expect(issuerInfo.description).to.equal(issuers[0].description);
      expect(issuerInfo.website).to.equal(issuers[0].website);
      expect(issuerInfo.logoUrl).to.equal(issuers[0].logoUrl);
      expect(issuerInfo.isActive).to.be.true;
      expect(issuerInfo.credentialsIssued).to.equal(0);
    });

    it("Should return issuer address by name", async function () {
      expect(await issuerRegistry.getIssuerByName(issuers[0].name))
        .to.equal(issuer1.address);
    });

    it("Should return all issuer addresses", async function () {
      const allIssuers = await issuerRegistry.getAllIssuers();
      expect(allIssuers.length).to.equal(2);
      expect(allIssuers[0]).to.equal(issuer1.address);
      expect(allIssuers[1]).to.equal(issuer2.address);
    });

    it("Should return correct total issuers count", async function () {
      expect(await issuerRegistry.getTotalIssuers()).to.equal(2);
    });
  });

  async function getBlockTimestamp() {
    const block = await ethers.provider.getBlock("latest");
    return block.timestamp;
  }
});
