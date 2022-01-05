import { useState } from "react";
import { ethers } from "ethers";
import { create as ipfsHttpClient } from "ipfs-http-client";
import { useRouter } from "next/router";
import Web3Modal from "web3modal";

const client = ipfsHttpClient("https://ipfs.infura.io:5001/api/v0");

import { nftaddress, nftmarketaddress } from "../.config";

import NFT from "../artifacts/contracts/NFT.sol/NFT.json";
import Market from "../artifacts/contracts/NFTMarket.sol/NFTMarket.json";

const CreateItem = () => {
	const [fileUrl, setFileUrl] = useState(null);
	const [formInput, updateFormInput] = useState({
		price: "",
		name: "",
		description: "",
	});
	const router = useRouter();

	const onChange = async (e) => {
		const file = e.target.files[0];
		try {
			const added = await client.add(file, {
				progress: (pr) => console.log(`received: ${pr}`),
			});
			const url = `https://ipfs.infura.io/ipfs/${added.path}`;
			setFileUrl(url);
		} catch (er) {
			console.log(er);
		}
	};

	const createItem = async () => {
		const { name, description, price } = formInput;
		if (!name || !description || !price || !fileUrl) return;
		const data = JSON.stringify({
			name,
			description,
			image: fileUrl,
		});

		try {
			const added = await client.add(data);
			const url = `https://ipfs.infura.io/ipfs/${added.path}`;
			//after file is uploaded to ipfs, pass the url to save it on polygon
			createSale(url);
		} catch (e) {
			console.log(`Error uploading file: ${e}`);
		}
	};

	const createSale = async (url) => {
		const web3modal = new Web3Modal();
		const connection = await web3modal.connect();
		const provider = new ethers.providers.Web3Provider(connection);

		const signer = provider.getSigner();
		let contract = new ethers.Contract(nftaddress, NFT.abi, signer);

		let transaction = await contract.createToken(url);
		let tx = await transaction.wait();

		let event = tx.events[0];
		let value = event.args[2];
		let tokenId = value.toNumber();

		const price = ethers.utils.parseUnits(formInput.price, "ether");

		contract = new ethers.Contract(nftmarketaddress, Market.abi, signer);
		let listingPrice = await contract.getListingPrice();
		listingPrice = listingPrice.toString();

		transaction = await contract.createMarketItem(nftaddress, tokenId, price, {
			value: listingPrice,
		});
		await transaction.wait();
		router.push("/");
	};

	return (
		<div className="flex justify-center">
			<div className="w-1/2 flex flex-col pb-12">
				<input
					type="text"
					className="mt-8 border rounded p-4"
					placeholder="Asset Name"
					onChange={(e) =>
						updateFormInput({ ...formInput, name: e.target.value })
					}
				/>
				<textarea
					className="mt-2 border rounded p-4"
					placeholder="Asset Description"
					onChange={(e) =>
						updateFormInput({ ...formInput, description: e.target.value })
					}></textarea>
				<input
					type="text"
					className="mt-8 border rounded p-4"
					placeholder="Asset Price in ETH"
					onChange={(e) =>
						updateFormInput({ ...formInput, price: e.target.value })
					}
				/>
				<input
					type="file"
					className="my-4"
					placeholder="Asset"
					onChange={onChange}
				/>
				{fileUrl && (
					<img src={fileUrl} alt="" className="rounded mt-4" width="350" />
				)}
				<button
					onClick={createItem}
					className="font-bold mt-4 bg-pink-500 text-white rounded p-4 shadow-lg">
					Create Digital Asset
				</button>
			</div>
		</div>
	);
};

export default CreateItem;
