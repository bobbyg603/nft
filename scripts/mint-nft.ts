import { createAlchemyWeb3 } from "@alch/alchemy-web3";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import assert from "node:assert";
dotenv.config();

const { API_URL, PUBLIC_KEY, PRIVATE_KEY } = process.env;

assert(API_URL, "Please set API_URL env variable");

const contractJsonPath = path.join(__dirname, "../artifacts/contracts/MyNFT.sol/MyNFT.json");

if (!fs.existsSync(contractJsonPath)) {
    throw new Error("Contract json does not exist, did you forget to compile?");
}

const json = fs.readFileSync(contractJsonPath).toString();

if (!json) {
    throw new Error("Could not read contract json file");
}

const web3 = createAlchemyWeb3(API_URL);

const contract = JSON.parse(json);
const contractAddress = "0xc56641d94BCc99366F444687947359CA36042412";
const nftContract = new web3.eth.Contract(contract.abi, contractAddress);

async function mintNFT(tokenURI: string) {
    assert(PUBLIC_KEY, "Please set PUBLIC_KEY env variable");
    assert(PRIVATE_KEY, "Please set PRIVATE_KEY env variable");

    const nonce = await web3.eth.getTransactionCount(PUBLIC_KEY, "latest");

    const tx = {
        from: PUBLIC_KEY,
        to: contractAddress,
        nonce: nonce,
        gas: 500000,
        data: nftContract.methods.mintNFT(PUBLIC_KEY, tokenURI).encodeABI(),
    };

    const signedTx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY);

    assert(signedTx.rawTransaction, "Failed to sign transaction");

    try {
        web3.eth.sendSignedTransaction(
            signedTx.rawTransaction,
            function (err, hash) {
                if (!err) {
                    console.log(
                        "The hash of your transaction is: ",
                        hash,
                        "\nCheck Alchemy's Mempool to view the status of your transaction!"
                    );
                } else {
                    console.error(
                        "Something went wrong when submitting your transaction:",
                        err
                    );
                }
            }
        );
    } catch (err) {
        console.error("Failed to send signed transaction:", err);
    }
}

mintNFT("ipfs://QmSkJuSvV8qPwurUf7ZuJAZRkhZTx8XBPUuo7CHz9MyVAx");