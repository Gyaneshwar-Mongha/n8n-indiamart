import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
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
		const returnData: INodeExecutionData[] = [];

		// Iterates over all input items and fetch products from IndiaMART
		// for the given keyword
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const credentials = await this.getCredentials('indiaMartApi');
				const secretKey = credentials.secretKey as string;

				const keyword = this.getNodeParameter('keyword', itemIndex, '') as string;

				if (!keyword) {
					throw new NodeOperationError(this.getNode(), 'Keyword parameter is required', {
						itemIndex,
					});
				}

				// Make HTTP request to IndiaMART search API
				const url = 'https://export.indiamart.com/cgi/SearchN8n.php';
				const response = await this.helpers.httpRequest({
					method: 'POST',
					url: url,
					body: {
						secretKey: secretKey,
						searchedKey: keyword,
					},
					json: true,
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

				// Create a deep clone to ensure no mutation of input data
				const outputJson = JSON.parse(JSON.stringify(items[itemIndex].json));
				outputJson.products = parsedData;
				outputJson.keyword = keyword;

				returnData.push({
					json: outputJson,
					pairedItem: itemIndex,
				});
			} catch (error) {
				// Handle errors appropriately
				if (this.continueOnFail()) {
					returnData.push({ json: items[itemIndex].json, error, pairedItem: itemIndex });
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

		return [returnData];
	}
}
