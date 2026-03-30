import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

export class IndiaMArt implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'IndiaMART',
		name: 'indiaMArt',
		icon: 'file:icon.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Interact with the IndiaMART API',
		defaults: {
			name: 'IndiaMART',
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
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Search Products',
						value: 'searchProducts',
						description: 'Search IndiaMART for products by keyword',
						action: 'Search products',
					},
					{
						name: 'Post Requirement',
						value: 'postRequirement',
						description: 'Post a product requirement on IndiaMART',
						action: 'Post requirement',
					},
				],
				default: 'searchProducts',
			},
			// --- Search Products parameters ---
			{
				displayName: 'Keyword',
				name: 'keyword',
				type: 'string',
				default: '',
				placeholder: 'e.g., shirts, shoes',
				description: 'Search keyword in IndiaMART',
				required: true,
				displayOptions: {
					show: {
						operation: ['searchProducts'],
					},
				},
			},
			// --- Post Requirement parameters ---
			{
				displayName: 'Product Name',
				name: 'productName',
				type: 'string',
				default: '',
				placeholder: 'water purifier, office chair',
				description: 'Product name for the requirement',
				required: true,
				displayOptions: {
					show: {
						operation: ['postRequirement'],
					},
				},
			},
			{
				displayName: 'Quantity',
				name: 'quantity',
				type: 'number',
				default: 1,
				placeholder: '10',
				description: 'Quantity required (must be greater than 0)',
				required: true,
				typeOptions: {
					minValue: 1,
				},
				displayOptions: {
					show: {
						operation: ['postRequirement'],
					},
				},
			},
			{
				displayName: 'Quantity Unit',
				name: 'quantityUnit',
				type: 'string',
				default: 'Piece',
				placeholder: 'Piece, Kg, Ton, Box',
				description: 'Unit of measurement for the quantity',
				required: true,
				displayOptions: {
					show: {
						operation: ['postRequirement'],
					},
				},
			},
			{
				displayName: 'Additional Requirements',
				name: 'additionalRequirements',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				placeholder: 'Any specific requirements, preferences, or details...',
				description: 'Additional information about your requirement',
				displayOptions: {
					show: {
						operation: ['postRequirement'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				if (operation === 'searchProducts') {
					const keyword = this.getNodeParameter('keyword', itemIndex, '') as string;

					if (!keyword) {
						throw new NodeOperationError(this.getNode(), 'Keyword parameter is required', {
							itemIndex,
						});
					}

					const response = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'indiaMartApi',
						{
							method: 'POST',
							url: 'https://export.indiamart.com/cgi/SearchN8n.php',
							body: {
								searchedKey: keyword,
							},
							json: true,
						},
					);

					// Parse JSON response
					let parsedData: unknown;
					try {
						parsedData = typeof response === 'string' ? JSON.parse(response) : response;
					} catch {
						throw new NodeOperationError(this.getNode(), 'Failed to parse response as JSON', {
							itemIndex,
						});
					}

					const outputJson = {
						...items[itemIndex].json,
						products: parsedData as IDataObject,
						keyword,
					};

					returnData.push({
						json: outputJson,
						pairedItem: itemIndex,
					});
				} else if (operation === 'postRequirement') {
					const productName = this.getNodeParameter('productName', itemIndex, '') as string;
					const quantity = this.getNodeParameter('quantity', itemIndex, 1) as number;
					const quantityUnit = this.getNodeParameter('quantityUnit', itemIndex, 'Piece') as string;
					const additionalRequirements = this.getNodeParameter(
						'additionalRequirements',
						itemIndex,
						'',
					) as string;

					if (quantity <= 0) {
						throw new NodeOperationError(this.getNode(), 'Quantity must be greater than 0', {
							itemIndex,
						});
					}

					if (quantityUnit && !/^[a-zA-Z\s]+$/.test(quantityUnit)) {
						throw new NodeOperationError(
							this.getNode(),
							'Quantity unit must contain only alphabets (a-z, A-Z) and spaces',
							{ itemIndex },
						);
					}

					await this.helpers.httpRequestWithAuthentication.call(this, 'indiaMartApi', {
						method: 'POST',
						url: 'https://export.indiamart.com/cgi/postRequirement.php',
						body: {
							productName,
							quantity,
							quantityUnit,
							additionalRequirements,
						},
						headers: {
							'Content-Type': 'application/json',
						},
						json: true,
					});

					returnData.push({
						json: {
							message: 'Successfully posted requirement on IndiaMART',
						},
						pairedItem: itemIndex,
					});
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							...items[itemIndex].json,
							error: error.message,
						},
						pairedItem: itemIndex,
					});
				} else {
					if (error.context) {
						error.context.itemIndex = itemIndex;
						throw error;
					}
					// Use NodeApiError for HTTP/API failures, NodeOperationError for validation
					if (error instanceof NodeOperationError) {
						throw error;
					}
					throw new NodeApiError(this.getNode(), error, {
						itemIndex,
					});
				}
			}
		}

		return [returnData];
	}
}
