const Ganache = require("./helpers/ganache");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StakingContract", () => {
    const ganache = new Ganache();

    let accounts;
    let owner;
    let user;

    let indexContract;
    let mockOracle;

    let indexToken;
    let asset1;
    let asset2;
    let asset3;
    let asset4;
    let asset5;

    before("setup", async () => {
        accounts = await ethers.getSigners();
        owner = accounts[0];
        user = accounts[1];

        const Token = await ethers.getContractFactory("Token");

        indexToken = await Token.deploy();
        await indexToken.deployed();

        asset1 = await Token.deploy();
        await asset1.deployed();
        await asset1.mint(
            owner.address,
            ethers.utils.parseUnits("100000", "ether")
        );

        asset2 = await Token.deploy();
        await asset2.deployed();
        await asset2.mint(
            owner.address,
            ethers.utils.parseUnits("25000", "ether")
        );

        asset3 = await Token.deploy();
        await asset3.deployed();
        await asset3.mint(
            owner.address,
            ethers.utils.parseUnits("50000", "ether")
        );

        asset4 = await Token.deploy();
        await asset4.deployed();
        await asset4.mint(
            user.address,
            ethers.utils.parseUnits("10000", "ether")
        );

        asset5 = await Token.deploy();
        await asset5.deployed();
        await asset5.mint(
            user.address,
            ethers.utils.parseUnits("1000", "ether")
        );

        const MockOracle = await ethers.getContractFactory("MockOracle");
        mockOracle = await MockOracle.deploy(
            [asset1.address, asset2.address, asset3.address, asset4.address],
            [
                ethers.utils.parseUnits("1", "ether"),
                ethers.utils.parseUnits("2", "ether"),
                ethers.utils.parseUnits("1", "ether"),
                ethers.utils.parseUnits("1", "ether"),
            ]
        );

        await mockOracle.deployed();

        const IterableMapping = await ethers.getContractFactory(
            "IterableMapping"
        );
        const iterableMapping = await IterableMapping.deploy();
        await iterableMapping.deployed();

        const IndexContract = await ethers.getContractFactory("IndexContract", {
            libraries: {
                IterableMapping: iterableMapping.address,
            },
        });
        indexContract = await IndexContract.deploy(
            indexToken.address,
            mockOracle.address
        );
        await indexContract.deployed();

        const MINTER_ROLE = await indexToken.MINTER_ROLE();

        await indexToken
            .connect(owner)
            .grantRole(MINTER_ROLE, indexContract.address);

        await asset1.approve(
            indexContract.address,
            ethers.utils.parseUnits("100000", "ether")
        );
        await indexContract.deposit(
            asset1.address,
            ethers.utils.parseUnits("100000", "ether")
        );
        await asset2.approve(
            indexContract.address,
            ethers.utils.parseUnits("25000", "ether")
        );
        await indexContract.deposit(
            asset2.address,
            ethers.utils.parseUnits("25000", "ether")
        );
        await asset3.approve(
            indexContract.address,
            ethers.utils.parseUnits("50000", "ether")
        );
        await indexContract.deposit(
            asset3.address,
            ethers.utils.parseUnits("50000", "ether")
        );

        await ganache.snapshot();
    });

    afterEach("cleanup", async () => {
        await ganache.revert();
    });

    //positive tests

    it("should check owner indexToken ballance", async () => {
        const ownerIndexTokenBallance = await indexToken.balanceOf(
            owner.address
        );

        expect(ethers.utils.formatEther(ownerIndexTokenBallance)).to.equal(
            "2000.0"
        );
    });

    it("should deposit", async () => {
        await asset4
            .connect(user)
            .approve(
                indexContract.address,
                ethers.utils.parseUnits("1000", "ether")
            );
        await indexContract
            .connect(user)
            .deposit(asset4.address, ethers.utils.parseUnits("1000", "ether"));

        const userIndexTokenBallance = await indexToken.balanceOf(user.address);

        expect(ethers.utils.formatEther(userIndexTokenBallance)).to.equal(
            "10.0"
        );
    });

    it("should deposit twice", async () => {
        await asset4
            .connect(user)
            .approve(
                indexContract.address,
                ethers.utils.parseUnits("1000", "ether")
            );
        await indexContract
            .connect(user)
            .deposit(asset4.address, ethers.utils.parseUnits("1000", "ether"));

        const firstUserIndexTokenBallance = await indexToken.balanceOf(user.address);

        expect(ethers.utils.formatEther(firstUserIndexTokenBallance)).to.equal(
            "10.0"
        );

        await asset4
            .connect(user)
            .approve(
                indexContract.address,
                ethers.utils.parseUnits("1000", "ether")
            );
        await indexContract
            .connect(user)
            .deposit(asset4.address, ethers.utils.parseUnits("1000", "ether"));

        const secondUserIndexTokenBallance = await indexToken.balanceOf(user.address);

        expect(ethers.utils.formatEther(secondUserIndexTokenBallance)).to.equal(
            "20.0"
        );
    });

    //negative tests

    it("should not allow deposit less then 1000USD", async () => {
        await asset4
            .connect(user)
            .approve(
                indexContract.address,
                ethers.utils.parseUnits("100", "ether")
            );

        await expect(
            indexContract
                .connect(user)
                .deposit(
                    asset4.address,
                    ethers.utils.parseUnits("100", "ether")
                )
        ).to.be.revertedWith(
            "deposited assets needs to be no less than 1000 USD"
        );
    });

    it("should not allow deposit wrong asset", async () => {
        await asset5
            .connect(user)
            .approve(
                indexContract.address,
                ethers.utils.parseUnits("1000", "ether")
            );

        await expect(
            indexContract
                .connect(user)
                .deposit(
                    asset5.address,
                    ethers.utils.parseUnits("1000", "ether")
                )
        ).to.be.revertedWith("depositedAssetPrice is 0");
    });
});
