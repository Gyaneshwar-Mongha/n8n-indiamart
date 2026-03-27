import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError, NodeConnectionTypes } from 'n8n-workflow';

export class IndiaMART implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'IndiaMART',
		name: 'indiaMART',
		icon: 'file:../icon.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Search products or post requirements on IndiaMART',
		defaults: {
			name: 'IndiaMART',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'indiaMartApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Search Products',
						value: 'search',
						description: 'Search IndiaMART for products by keyword',
						action: 'Search products',
					},
					{
						name: 'Post Requirement',
						value: 'postRequirement',
						description: 'Post a product requirement on IndiaMART',
						action: 'Post a requirement',
					},
				],
				default: 'search',
			},
			// Search properties
			{
				displayName: 'Keyword',
				name: 'keyword',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['search'],
					},
				},
				default: '',
				placeholder: 'e.g., shirts, shoes',
				description: 'Search keyword in IndiaMART',
				required: true,
			},
			// Post Requirement properties
			{
				displayName: 'Product Name',
				name: 'productName',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['postRequirement'],
					},
				},
				default: '',
				placeholder: 'water purifier, office chair',
				description: 'Product name for the requirement',
				required: true,
			},
			{
				displayName: 'Quantity',
				name: 'quantity',
				type: 'number',
				displayOptions: {
					show: {
						operation: ['postRequirement'],
					},
				},
				default: 1,
				placeholder: '10',
				description: 'Quantity required (must be greater than 0)',
				required: true,
				typeOptions: {
					minValue: 1,
				},
			},
			{
				displayName: 'Quantity Unit',
				name: 'quantityUnit',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['postRequirement'],
					},
				},
				default: 'Piece',
				placeholder: 'Piece, Kg, Ton, Box',
				description: 'Unit of measurement for the quantity',
				required: true,
			},
			{
				displayName: 'Additional Requirements',
				name: 'additionalRequirements',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['postRequirement'],
					},
				},
				typeOptions: {
					rows: 4,
				},
				default: '',
				placeholder: 'Any specific requirements, preferences, or details...',
				description: 'Additional information about your requirement',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				if (operation === 'search') {
					const keyword = this.getNodeParameter('keyword', i) as string;

					const response = await this.helpers.httpRequestWithAuthentication.call(this, 'indiaMartApi', {
						method: 'POST',
						url: 'https://export.indiamart.com/cgi/SearchN8n.php',
						body: {
							searchedKey: keyword,
						},
						json: true,
					});

					returnData.push({
						json: {
							...items[i].json,
							products: response as IDataObject,
							keyword,
						},
						pairedItem: i,
					});
				} else if (operation === 'postRequirement') {
					const productName = this.getNodeParameter('productName', i) as string;
					const quantity = this.getNodeParameter('quantity', i) as number;
					const quantityUnit = this.getNodeParameter('quantityUnit', i) as string;
					const additionalRequirements = this.getNodeParameter('additionalRequirements', i, '') as string;

					if (quantity <= 0) {
						throw new NodeOperationError(this.getNode(), 'Quantity must be greater than 0', { itemIndex: i });
					}

					if (quantityUnit && !/^[a-zA-Z\s]+$/.test(quantityUnit)) {
						throw new NodeOperationError(this.getNode(), 'Quantity unit must contain only alphabets and spaces', { itemIndex: i });
					}

					const response = await this.helpers.httpRequestWithAuthentication.call(this, 'indiaMartApi', {
						method: 'POST',
						url: 'https://export.indiamart.com/cgi/postRequirement.php',
						body: {
							productName,
							quantity,
							quantityUnit,
							additionalRequirements,
						},
						json: true,
					});

					const bodyString = typeof response === 'string' ? response : JSON.stringify(response);
					if (bodyString.includes('Invalid or expired secret key')) {
						returnData.push({
							json: { message: 'Invalid or expired secret key' },
							pairedItem: i,
						});
						continue;
					}

					returnData.push({
						json: { message: 'Successfully posted requirement on IndiaMART' },
						pairedItem: i,
					});
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { ...items[i].json, error: error.message },
						pairedItem: i,
						error,
					});
				} else {
					throw new NodeApiError(this.getNode(), error, { itemIndex: i });
				}
			}
		}

		return [returnData];
	}
}
