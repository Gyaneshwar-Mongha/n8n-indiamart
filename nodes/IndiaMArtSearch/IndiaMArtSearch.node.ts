import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError, NodeConnectionTypes } from 'n8n-workflow';

export class IndiaMArtSearch implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'IndiaMART Search',
		name: 'indiaMArtSearch',
		icon: 'file:../icon.svg',
		group: ['transform'],
		version: 1,
		description: 'Search IndiaMART using UI input or previous node data',
		defaults: {
			name: 'IndiaMART Search',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		properties: [
			{
				displayName: 'Keyword',
				name: 'keyword',
				type: 'string',
				default: '',
			},
			{
				displayName: 'City',
				name: 'city',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Country',
				name: 'country',
				type: 'string',
				default: '',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		for (let i = 0; i < items.length; i++) {
			const item = items[i];

			/* ===============================
			   0. SKIP IF STATUS IS USED
			=============================== */

			if (item.json.status === 'used') {
				item.json.skipped = true;
				item.json.message = 'Row already used, skipping IndiaMART search';
				continue;
			}

			/* ===============================
			   1. READ INPUTS
			=============================== */

			const keyword =
				(this.getNodeParameter('keyword', i, '') as string) ||
				(item.json.keyword as string);

			const city =
				(this.getNodeParameter('city', i, '') as string) ||
				(item.json.city as string) ||
				'';

			const country =
				(this.getNodeParameter('country', i, '') as string) ||
				(item.json.country as string) ||
				'';

			if (!keyword) {
				throw new NodeOperationError(
					this.getNode(),
					'Keyword is required (provide via UI or input JSON)',
					{ itemIndex: i },
				);
			}

			/* ===============================
			   2. SEARCH API
			=============================== */

			const url = `https://dir.indiamart.com/api/n8nreq.rp?q=${encodeURIComponent(
				keyword,
			)}&source=dir.search&options.filters.city.data=${encodeURIComponent(
				city,
			)}&geo_country_info.geo_country_name=${encodeURIComponent(country)}`;

			const response = await this.helpers.httpRequest({
				method: 'GET',
				url,
				headers: {
					'User-Agent': 'n8n-nodes-indiamart',
				},
			});

			let parsedData: Record<string, unknown>;
			try {
				parsedData =
					typeof response === 'string' ? JSON.parse(response) : response;
			} catch {
				throw new NodeOperationError(
					this.getNode(),
					'Failed to parse IndiaMART response',
					{ itemIndex: i },
				);
			}

			/* ===============================
			   3. EXTRACT PRODUCTS
			=============================== */

			const products: Array<{
				name: unknown;
				number: unknown;
				companyname: unknown;
				image: unknown;
				smalldescorg: unknown;
			}> = [];

			if (parsedData?.results && Array.isArray(parsedData.results)) {
				for (const result of parsedData.results) {
					const fields = result?.fields;
					if (fields) {
						products.push({
							name: fields.title,
							number: fields.pns,
							companyname: fields.companyname,
							image: fields.zoomed_image,
							smalldescorg: fields.smalldescorg,
						});
					}
				}
			}

			/* ===============================
			   4. ATTACH OUTPUT
			=============================== */

			item.json.keyword = keyword;
			item.json.city = city;
			item.json.country = country;
			item.json.products = products;
			item.json.searchedAt = new Date().toISOString();
			item.json.skipped = false;
		}

		return [items];
	}
}