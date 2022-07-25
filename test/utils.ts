import { ethers, network } from "hardhat";

export async function mineBlocks(newNumber : number) {
    await network.provider.send("hardhat_mine", ["0x" + (newNumber).toString(16)]);
}

export async function getBlockNumber(): Promise<number> {
    return (await ethers.provider.getBlock("latest")).number;
}

export async function getAddresses(): Promise<Array<string>> {
    const accounts = await ethers.getSigners();

    let result = new Array<string>;
    for (const account of accounts) {
      result.push(account.address);
    }
    return result;
}

export async function getAddress(index : number): Promise<string> {
    const account = (await ethers.getSigners()).at(index);
    if (account == undefined) {
        return "";
    } else {
        return account.address;
    }
}
