import { ethers } from "ethers";
import { useState, useEffect } from "react";
import axios from "axios";
import Web3Modal from "web3modal";
import { nftaddress, nftmarketaddress } from "../.config";
import NFT from "../artifacts/contracts/NFT.sol/NFT.json";
import Market from "../artifacts/contracts/NFTMarket.sol/NFTMarket.json";

const CreatorDashboard = () => {
	const [nfts, setNfts] = useState([]);
	const [soldNfts, setSoldNfts] = useState([]);
	const [loadingState, setLoadingState] = useState("not-loaded");

	const loadNfts = async () => {
		const web3modal = new Web3Modal();
		const connection = await web3modal.connect();
		const provider = new ethers.providers.Web3Provider(connection);
		const signer = provider.getSigner();

		const tokenContract = new ethers.Contract(nftaddress, NFT.abi, signer);
		const marketContract = new ethers.Contract(
			nftmarketaddress,
			Market.abi,
			signer
		);
		const data = await marketContract.fetchItemsCreated();

		const items = await Promise.all(
			data.map(async (i) => {
				const tokenUri = await tokenContract.tokenURI(i.tokenId);
				const meta = await axios.get(tokenUri);
				let price = ethers.utils.formatUnits(i.price.toString(), "ethers");
				let item = {
					price,
					tokenId: item.tokenId.toNumber(),
					seller: item.seller,
					image: meta.data.image,
					owner: item.owner,
					sold: item.sold,
				};
				return item;
			})
		);

		const soldItems = items.filter((item) => item.sold);
		setNfts(items);
		setSoldNfts(soldItems);
		setLoadingState("loaded");
	};
	useEffect(() => {
		loadNfts();
	}, []);

	if (loadingState === "loaded" && nfts.length === 0) {
		return <div className="py-10 px-20 text-3xl">No items found</div>;
	}

	return (
		<>
			<div className="p-4">
				<h2 className="text-2xl py-2">Items Created</h2>
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
					{nfts.length > 0 ? (
						nfts.map((item, i) => (
							<div key={i} className="border.shadow.rounded-xl.overflow-hidden">
								<img src={item.image} alt="nft created" />
								<div className="p-4 bg-black">
									<p className="text-2xl font-bold text-white">
										Price - {item.price} Eth
									</p>
								</div>
							</div>
						))
					) : (
						<div className="p-4">No items Created</div>
					)}
				</div>
			</div>
			<div className="px-4">
				<h2 className="text-2xl py-2">Items Sold</h2>
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
					{soldNfts.length > 0 ? (
						soldNfts.map((item, i) => (
							<div
								key={i}
								className="border.shadow shadow rounded-xl overflow-hidden">
								<img src={item.image} alt="nft sold" />
								<div className="p-4 bg-black">
									<p className="text-2xl font-bold text-white">
										Price - {item.price} Eth
									</p>
								</div>
							</div>
						))
					) : (
						<div className="p-4">No items sold</div>
					)}
				</div>
			</div>
		</>
	);
};

export default CreatorDashboard;
