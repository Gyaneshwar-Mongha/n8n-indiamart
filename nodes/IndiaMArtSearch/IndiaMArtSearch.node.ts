import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IN8nHttpFullResponse,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

export class IndiaMArtSearch implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'IndiaMART Search',
		name: 'indiaMArtSearch',
		icon: 'file:../icon.svg',
		group: ['input'],
		version: 1,
		description: 'Search IndiaMART for products by keyword and return product names',
		defaults: {
			name: 'IndiaMART Search',
		},
		credentials: [
			{
				name: 'indiaMartApi',
				required: true,
			},
		],
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		properties: [
			// Node properties which the user gets displayed and
			// can change on the node.
			{
				displayName: 'Keyword',
				name: 'keyword',
				type: 'string',
				default: '',
				placeholder: 'e.g., shirts, shoes',
				description: 'Search keyword in IndiaMART',
				required: true,
			},
		],
	};

	// The function below is responsible for searching IndiaMART
	// for products matching the provided keyword and extracting product names.
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		let item: INodeExecutionData;
		let keyword: string;

		// Iterates over all input items and fetch products from IndiaMART
		// for the given keyword
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const credentials = await this.getCredentials('indiaMartApi');
				const secretKey = credentials.secretKey as string;

				keyword = this.getNodeParameter('keyword', itemIndex, '') as string;
				item = items[itemIndex];

				if (!keyword) {
					throw new NodeOperationError(this.getNode(), 'Keyword parameter is required', {
						itemIndex,
					});
				}

				// Pre-search validation: hit credGenRead API
				const credReadUrl = 'https://dev-export.indiamart.com/api/credGenRead/';
				const credResponse = await this.helpers.httpRequest({
					method: 'POST',
					url: credReadUrl,
					body: {
						secretkey: secretKey,
					},
					json: true,
					returnFullResponse: true,
				}) as IN8nHttpFullResponse;

				const credBody = credResponse.body as { glid?: string };
				if (!credBody?.glid) {
					throw new NodeOperationError(this.getNode(), 'Invalid or expired secret key (credential validation failed)', {
						itemIndex,
					});
				}

				// Make HTTP request to IndiaMART search API
				const url = `https://dir.indiamart.com/api/n8nreq.rp?q=${encodeURIComponent(keyword)}&source=dir.search`;
				const response = await this.helpers.httpRequest({
					method: 'GET',
					url: url,
					headers: {
						'User-Agent': 'n8n-nodes-indiamart',
					},
				});

				// Parse JSON response
				let parsedData: unknown;
				try {
					parsedData = typeof response === 'string' ? JSON.parse(response) : response;
				} catch {
					throw new NodeOperationError(this.getNode(), 'Failed to parse response as JSON', {
						itemIndex,
					});
				}

				// Extract products from results array
				const productArray: Array<{ name: unknown; number: unknown; companyname: unknown; image: unknown }> = [];
				if (parsedData && typeof parsedData === 'object' && 'results' in parsedData) {
					const results = (parsedData as Record<string, unknown>).results;
					if (Array.isArray(results)) {
						results.forEach((result: unknown) => {
							if (result) {
								// Access title from fields key
								const fields = (result as Record<string, unknown>).fields;
								if (fields && typeof fields === 'object') {
									const title = (fields as Record<string, unknown>).title;
									const pns = (fields as Record<string, unknown>).pns;
									const companyname = (fields as Record<string, unknown>).companyname;
									const zoomed_image = (fields as Record<string, unknown>).zoomed_image;
									productArray.push({
										name: title,
										number: pns,
										companyname: companyname,
										image: zoomed_image
									});
								}
							}
						});
					}
				}

				// Return product names as array and keyword
				item.json.products = productArray;
				item.json.keyword = keyword;
			} catch (error) {
				// Handle errors appropriately
				if (this.continueOnFail()) {
					items.push({ json: this.getInputData(itemIndex)[0].json, error, pairedItem: itemIndex });
				} else {
					// Adding `itemIndex` allows other workflows to handle this error
					if (error.context) {
						// If the error thrown already contains the context property,
						// only append the itemIndex
						error.context.itemIndex = itemIndex;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error, {
						itemIndex,
					});
				}
			}
		}

		return [items];
	}
}
